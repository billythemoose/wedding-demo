# Wedding Website Demo

A public demo of a password-protected wedding website. The original was three Angular apps behind CloudFront, with a Lambda + DynamoDB backend handling logins, an after-party unlock and RSVPs. This repo merges the three front ends into **one Angular app with no backend**, served as static files from S3 + CloudFront at `wedding.example.com`.

In the demo, any password works except `wrong` (which shows the error toast), and nothing you enter is saved. A banner at the top of every page says so.

The first load of `/w` is about 104 kB of compressed JS and CSS. The original site shipped about 21 MB of images.

## Original vs demo

[`docs/`](docs/README.md) describes the original system in detail: architecture, request flows, authentication, data model, security and API. The original repos are private.

| Original | Demo |
|---|---|
| Three apps: login at `/`, main site at `/w/`, after-party at `/s/` ([front-end apps](docs/frontend-apps.md)) | One app with the same URLs, lazy-loaded per route (`apps/web`) |
| Passwords checked by a Lambda against Secrets Manager ([API](docs/api.md), [authentication](docs/auth-flow.md)) | `DemoApiService` accepts any password except `wrong`, after a short fake delay |
| 60-day `HttpOnly` token cookie, stored in DynamoDB ([data model](docs/data-model.md)) | `DemoSession` keeps two flags in `sessionStorage`, cleared when the tab closes |
| Lambda@Edge checks the cookie on every `/w/` and `/s/` request ([request flows](docs/request-flows.md)) | Angular route guards `requireGuest` and `requireParty`, which redirect the same way. Browser-only, so not real security |
| RSVPs written to DynamoDB by a second Lambda | `putRsvp` waits, then shows the success state. Nothing is stored |
| Four CDK stacks: DNS + certificate, secret, API, and CloudFront with WAF and S3 ([architecture](docs/architecture.md)) | One `WeddingDemoStack`: private S3 bucket, CloudFront, its own certificate and the `wedding` DNS records (`infra/`) |
| Build, upload and invalidate by hand ([deployment](docs/deployment.md)) | `npm run deploy` |

## Layout

```
apps/web/   the Angular app
infra/      CDK app with WeddingDemoStack
scripts/    image optimizer, site upload, read-only baseline checks
docs/       documentation of the original system
```

## Running it

Needs Node 22 (see `.nvmrc`).

```bash
npm install
npm start          # dev server at http://localhost:4200
npm test           # app tests, then infra tests
npm run build      # production build in apps/web/dist/web/browser
```

## Deploying

Deploys to `us-east-1` into an account that is already CDK-bootstrapped and has a Route 53 hosted zone for the domain.

1. Copy `infra/.env.example` to `infra/.env` (git-ignored) and fill in `DOMAIN_NAME`, `HOSTED_ZONE_ID` and `SUBDOMAIN`.
2. `npm run deploy` builds the app, deploys `WeddingDemoStack`, uploads the site to the bucket and invalidates `index.html`.
3. `npm run destroy` removes the stack, the bucket and its files, the certificate and the `A`/`AAAA` records. The certificate-validation `CNAME` may be left in the hosted zone; delete it by hand if so.

`npm run synth` shows the CloudFormation template without deploying.

## Photos

The committed images in `apps/web/src/assets/img/` are resized WebP copies, and the build only uses those. The full-size originals live in a git-ignored backup.

To add or replace a photo, put the original in `apps/web/photos-src/` (graphics with text or sharp edges go in `photos-src/sharp/`, which is converted lossless), then run:

```bash
npm run images     # needs cwebp: brew install webp
```
