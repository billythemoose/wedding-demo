# Request Flows

What happens to each kind of request, end to end. The login and after-party flows are in [auth-flow.md](auth-flow.md). This page covers routing, page and asset loads, the RSVP form, and the error paths.

## Edge decision tree

`lambda/validate.ts` runs on the viewer request of **every** CloudFront behaviour, before the cache. WAF has already allowed the request by this point.

```mermaid
flowchart TD
    START([Viewer request]) --> TS{"uri is exactly<br/>/w or /s ?"}
    TS -->|yes| R301["301 → /w/ or /s/<br/>(query string kept)"]
    TS -->|no| PA{"first path segment<br/>is w or s ?"}
    PA -->|no| PASS["Forward unchanged<br/>(login app, default behaviour)"]
    PA -->|yes| RW["Rewrite URI:<br/>ends in / → + index.html<br/>last segment has no '.' → + /index.html<br/>otherwise unchanged"]
    RW --> CK{"api-token<br/>cookie present?"}
    CK -->|no| R401["401 JSON<br/>{message: 'Please log in'}"]
    CK -->|yes| LK["GetItem wedding-auth-table<br/>(us-east-1)"]
    LK -->|throws| R500["500 JSON<br/>{message: 'Something went wrong…'}"]
    LK --> VALID{"item exists and<br/>expire > now?"}
    VALID -->|no| R401
    VALID -->|yes| AREA{"area is s and<br/>party !== true?"}
    AREA -->|yes| R302["302 → /w/secret<br/>Cache-Control: no-store"]
    AREA -->|no| FWD["Forward rewritten request<br/>→ cache → S3 wed/…"]
```

Notes:
- The expiry check comes before the party check, so an expired party-approved token gets a 401, not a 302.
- The 401 is a raw JSON response. Nothing redirects the guest to the login page, so a guest whose token expired sees `{"message":"Please log in"}` and has to go to `/` themselves.
- The 301 also runs for the bare `/w` and `/s` before any token check, so it works without a cookie.

## First visit, no cookie

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant WAF as WAF
    participant CF as CloudFront
    participant E as Lambda@Edge
    participant S3 as S3

    B->>WAF: GET https://example.com/
    WAF->>WAF: geo = US/CA? managed rules?
    alt blocked
        WAF-->>B: 403
    else allowed
        WAF->>CF: forward
        CF->>E: viewer request "/" 
        E-->>CF: not /w or /s → unchanged
        CF->>S3: login/index.html (default root object, on cache miss)
        S3-->>B: login page
        B->>CF: GET /main-*.js, /styles-*.css
        CF->>E: viewer request (passes through)
        CF-->>B: assets (cached by CloudFront)
    end
    Note over B: Guest tries /w/ directly
    B->>CF: GET /w/
    CF->>E: viewer request
    E-->>B: 401 {"message":"Please log in"}
```

## Loading a protected page and its assets

Once logged in, every file under `/w/` or `/s/` (HTML, JS, CSS, images) goes through the full edge check. Each one costs a DynamoDB `GetItem` from the edge location to `us-east-1`, even when CloudFront already has the file cached, because viewer-request functions run before the cache.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant CF as CloudFront
    participant E as Lambda@Edge
    participant DB as wedding-auth-table
    participant S3 as S3 (wed/)

    B->>CF: GET /w/story (Cookie: api-token=uuid)
    CF->>E: viewer request
    E->>E: rewrite → /w/story/index.html
    E->>DB: GetItem {uuid}
    DB-->>E: {uuid, expire, ttl}
    E-->>CF: forward
    alt cache hit
        CF-->>B: story/index.html
    else cache miss
        CF->>S3: GET wed/w/story/index.html (OAC)
        S3-->>CF: file
        CF-->>B: story/index.html
    end
    par each referenced asset
        B->>CF: GET /w/main-*.js
        CF->>E: viewer request
        E->>DB: GetItem {uuid}
        E-->>CF: forward (has '.', no rewrite)
        CF-->>B: main-*.js
    and
        B->>CF: GET /w/assets/img/1.jpg
        CF->>E: viewer request
        E->>DB: GetItem {uuid}
        CF-->>B: 1.jpg
    end
```

After the first load, clicking a nav link inside the `wedding` app uses the Angular router. It renders client-side and makes no new HTML request; only images not yet loaded are fetched.

## RSVP submit with a plus-one

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (/w/rsvp)
    participant GW as API Gateway<br/>api.…/v1
    participant L as rsvp-api Lambda
    participant AT as wedding-auth-table
    participant RT as RSVP table

    Note over B: Form valid (names, E.164 US phone)
    B->>GW: OPTIONS /rsvp (CORS preflight)
    GW-->>B: 204 Allow-Origin example.com, Allow-Credentials
    par person 1
        B->>GW: PUT /rsvp {firstName, lastName, phone, attending} + cookie
        GW->>L: invoke
        L->>AT: GetItem {uuid}
        alt no cookie / unknown / expired
            L-->>B: 401
        else lookup throws
            L-->>B: 500
        else valid
            L->>L: isPerson(body)? else 400
            L->>RT: PutItem (lower-cased, overwrites same name)
            L-->>B: 200 (or 500 if the write fails)
        end
    and person 2
        B->>GW: PUT /rsvp {…} + cookie
        GW->>L: invoke (same steps)
        L-->>B: 200
    end
    alt all 200
        B->>B: toast "Registration successful!"
    else any 401
        B->>B: toast "Please log in again"
    else other error
        B->>B: toast "Registration failed"
    end
```

`forkJoin` fails as soon as one request fails, but the other request may already have been written. A failed toast can therefore mean one of the two people was saved. Submitting again is safe, because the `(firstName, lastName)` key makes the write an overwrite.

## CORS preflight on `api.`

The pages are served from `example.com` and the API from `api.example.com`, so every API call is cross-origin. JSON bodies and `withCredentials` mean the browser sends a preflight first.

```mermaid
sequenceDiagram
    participant B as Browser
    participant GW as API Gateway
    participant L as Lambda

    B->>GW: OPTIONS /auth<br/>Origin: https://example.com
    GW-->>B: 204 (MOCK integration from defaultCorsPreflightOptions)<br/>Access-Control-Allow-Origin, -Credentials: true
    B->>GW: POST /auth + JSON body
    GW->>L: invoke
    L-->>B: response with CORS headers set by the Lambda
    Note over GW,B: API Gateway's own 4xx/5xx responses (429, 403, 502…)<br/>carry the same CORS headers via Default4xx/Default5xx,<br/>so the app can read the status code.
```

From `localhost` the preflight succeeds at the HTTP level, but the browser rejects it because the allowed origin doesn't match. That is why API calls don't work during local development.

## Throttled login (429)

```mermaid
sequenceDiagram
    participant B as Browser
    participant GW as API Gateway (stage prod)
    participant L as validate-api

    loop more than 5 req/s (burst 10), counted across all callers
        B->>GW: POST /auth
        GW-->>B: 429 Too Many Requests (Default4xx, CORS headers)
    end
    Note over B: Login / SecretPage show<br/>"Too many attempts, please wait and try again"
    Note over L: The Lambda is never invoked for a throttled request
```

## Returning guest with an expired token

The cookie and the token item both last 60 days, so they usually expire together. The browser drops the cookie and the edge function sees no cookie. If clocks or a manual table edit make them differ, the edge function sees an expired item instead. The result is the same either way.

```mermaid
sequenceDiagram
    participant B as Browser
    participant E as Lambda@Edge
    participant DB as wedding-auth-table

    B->>E: GET /w/ (cookie expired → not sent)
    E-->>B: 401 Please log in
    B->>E: GET /w/ (cookie still sent, item expired)
    E->>DB: GetItem
    DB-->>E: item with expire < now (or already removed by TTL)
    E-->>B: 401 Please log in
    Note over B: Guest must open / and log in again → new token
```
