# Sources

This repo was assembled from snapshots of the original projects, exported with `git archive` on 2026-11-11.

| Source | Branch | Commit | Exported | What came from it |
|---|---|---|---|---|
| `wedding` | `mainline` | `3770703b28eb84ad6f98029565f39b9194935706` | 2026-11-11 | The base app: project config, home, party, RSVP, registry, story, travel and secret pages, header menu, API service (merged into the fake backend), global styles, validators, and the two placeholder seed photos (`home_1.jpeg`, `home_2.jpeg`, both stock photos) |
| `wedding-login` | `mainline` | `e352fd4cd0416f04e1ed6a8a4b6279a041d130da` | 2026-11-11 | The login page, and its auth service (merged into the fake backend) |
| `wedding-secret` | `master` | `3288daf692c357c108901ff8cdb7d767b16a0f65` | 2026-11-11 | The after-party page |
| `billythemoose.github.io` (portfolio) | `master` | `c7ab86d99d29de79750541a5e347d94ac9f37f7f` | 2026-11-11 | Only `infra/` config files, as a starting point for `infra/` |

Nothing was taken from `wedding-cdk`. Its stacks belong to the retired production setup.

Personal details in the templates were replaced before the first commit, and every image starts as one of two placeholders.

History starts fresh. See the original repos for earlier commits.
