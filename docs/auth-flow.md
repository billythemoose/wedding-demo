# Authentication

The site uses two shared passwords rather than per-user accounts:

- **Main password** (`test-secret` key): unlocks `/w/`.
- **Party password** (`party-secret` key): unlocks `/s/`, but only for a guest who is already logged in.

A successful login creates a random UUID token. The token is stored in DynamoDB with a 60-day expiry and set as an `api-token` cookie on the parent domain. Lambda@Edge checks it on every request to `/w/` and `/s/`. Entering the party password sets `party = true` on that same token's item, and the edge function requires that flag for `/s/`.

## 1. Main login (`/` → `/w/`)

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant CF as CloudFront + Lambda@Edge
    participant S3 as S3 (login/)
    participant API as api.example.com/v1
    participant L as validate-api Lambda
    participant SM as Secrets Manager
    participant DB as wedding-auth-table

    B->>CF: GET /
    CF->>S3: login/index.html (no token needed)
    S3-->>B: Login page (wedding-login app)
    B->>API: POST /auth {password} (withCredentials)
    alt over 5 req/s (burst 10)
        API-->>B: 429 → toast "Too many attempts…"
    else
        API->>L: invoke (event.resource = /auth)
        L->>SM: GetSecretValue (cached per container)
        alt password == secret["test-secret"]
            L->>DB: PutItem {uuid, expire: now+60d, ttl: expire/1000}
            alt put fails
                L-->>B: 500, no cookie → toast "Authentication Failed"
            else
                L-->>B: 200 {token} + Set-Cookie api-token=uuid<br/>(Max-Age=5184000, Domain=example.com,<br/>Path=/, Secure, SameSite=None, HttpOnly)
                B->>B: window.location.assign('/w/')
            end
        else wrong password
            L-->>B: 401 → toast "Authentication Failed"
        else no body / no password / bad JSON
            L-->>B: 400 → toast "Authentication Failed"
        end
    end
```

Notes:
- The login app does a full page load of `/w/` with `window.location.assign` instead of using the Angular router, because `/w/` is a different app behind a different CloudFront behaviour.
- Each login creates a **new** token. Old tokens stay valid until they expire, so a guest who logs in on two devices has two tokens.

## 2. Accessing protected content (`/w/*`, `/s/*`)

Every request under `/w/` and `/s/` is checked, including JS, CSS and images. The full logic, including the 301 for `/w` and the rewrite rules, is in the [edge decision tree](request-flows.md#edge-decision-tree).

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant E as Lambda@Edge (validate.ts)
    participant DB as wedding-auth-table
    participant S3 as S3 (wed/)

    B->>E: GET /w/rsvp (Cookie: api-token=uuid)
    E->>E: rewrite → /w/rsvp/index.html
    alt no api-token cookie
        E-->>B: 401 {"message":"Please log in"}
    else
        E->>DB: GetItem {uuid}
        alt lookup throws
            E-->>B: 500 {"message":"Something went wrong, please try again"}
        else item missing or expire <= now
            E-->>B: 401 {"message":"Please log in"}
        else area = s and party !== true
            E-->>B: 302 Location: /w/secret (no-store)
        else valid
            E->>S3: forward (through the cache) → wed/w/rsvp/index.html
            S3-->>B: page
        end
    end
```

Requests outside `/w/` and `/s/` (the login app's files) pass through unchanged.

## 3. After-party unlock (`/w/secret` → `/s/secret`)

The main site's nav has a 🤫 link to `/w/secret`, a second password form (`wedding/src/app/secret`). The browser sends the existing `api-token` cookie with the request, because the cookie's `Domain` covers `api.`.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (/w/secret)
    participant L as validate-api Lambda
    participant DB as wedding-auth-table
    participant E as Lambda@Edge

    B->>L: POST /v1/secret {password} + Cookie: api-token=uuid
    Note over L: event.resource = /secret
    alt password != secret["party-secret"]
        L-->>B: 401 → toast "Authentication Failed"
    else no api-token cookie
        L-->>B: 401
    else
        L->>DB: UpdateItem SET party = true<br/>IF attribute_exists(uuid) AND expire > now
        alt condition fails (unknown or expired token)
            L-->>B: 401
        else other DynamoDB error
            L-->>B: 500
        else updated
            L-->>B: 200 (empty body, no new cookie)
            B->>B: window.location.assign('/s/secret')
            B->>E: GET /s/secret (same cookie)
            E->>DB: GetItem → party = true
            E-->>B: wed/s/secret/index.html
        end
    end
```

A logged-in guest who opens `/s/secret` without entering the party password is sent to `/w/secret` by a 302 from the edge function.

## Token lifecycle

One item in `wedding-auth-table`, from creation to deletion:

```mermaid
stateDiagram-v2
    [*] --> Issued: POST /auth, correct main password<br/>PutItem uuid, expire, ttl
    Issued --> PartyApproved: POST /secret, correct party password<br/>UpdateItem SET party = true
    PartyApproved --> PartyApproved: POST /secret again (no-op)
    Issued --> Expired: now >= expire (60 days)
    PartyApproved --> Expired: now >= expire
    Expired --> Deleted: DynamoDB TTL sweep<br/>(usually within a few days of ttl)
    Deleted --> [*]

    note right of Issued
        /w/* allowed
        /s/* → 302 /w/secret
    end note
    note right of PartyApproved
        /w/* and /s/* allowed
    end note
    note right of Expired
        All checks treat it as invalid
        (401), even before TTL deletes it
    end note
```

There is no logout and no way to revoke a single token, short of deleting its item from the table by hand. Changing the main password doesn't invalidate existing tokens.

## Cookie scope

The cookie is set by a response from `api.example.com`, but its `Domain` attribute makes the browser send it to the apex and every subdomain.

```mermaid
flowchart LR
    API["api.example.com<br/>POST /v1/auth response"] -->|"Set-Cookie: api-token=…<br/>Domain=example.com"| JAR[("Browser cookie jar<br/>api-token, 60 days")]
    JAR -->|"sent on every request"| APEX["example.com<br/>/, /w/*, /s/*<br/>→ checked by Lambda@Edge"]
    JAR -->|"sent with withCredentials"| API2["api.example.com<br/>/v1/secret, /v1/rsvp<br/>→ checked by the Lambdas"]
```

| Attribute | Value | Why |
|---|---|---|
| `Max-Age` | `5184000` (60 days) | Matches `TOKEN_LIFETIME_MS`; guests stay logged in across browser restarts |
| `Domain` | `example.com` | So the apex domain (and the edge function) sees a cookie set by `api.` |
| `Path` | `/` | Covers every app |
| `Secure` | yes | HTTPS only |
| `SameSite` | `None` | Lets the cookie be sent on the browser's cross-origin `fetch` to `api.` |
| `HttpOnly` | yes | Page JavaScript can't read it. The login app reads the token from the JSON body only to decide whether to redirect. |

## Summary of auth states

| Guest has… | `/` | `/w/*` | `/s/*` | `PUT /rsvp` | `POST /secret` (correct password) |
|---|---|---|---|---|---|
| no cookie | ✅ login page | ❌ 401 | ❌ 401 | ❌ 401 | ❌ 401 |
| valid token | ✅ | ✅ | ↪️ 302 → `/w/secret` | ✅ | ✅ marks party |
| valid, party-approved token | ✅ | ✅ | ✅ | ✅ | ✅ (no change) |
| expired or unknown token | ✅ | ❌ 401 | ❌ 401 | ❌ 401 | ❌ 401 |
