# Security and privacy

- The site is fully static. It has no API routes, no database and no secret.
- The browser never contacts the Tower. Only `scripts/sync-tower.mjs`, run in CI, reads the public manifest over HTTPS, with a size limit, schema validation and a refusal to accept an older or smaller snapshot.
- Private Tower records, spreadsheets, the Cockpit, PIN and credentials are not read, copied or referenced.
- `npm run scan` fails when the repository, the generated manifest or the production build contains private keys, tokens, spreadsheet or Drive links, private API routes or private markers. It runs in CI.
- HTTP headers: Content-Security-Policy (`default-src 'self'`, `frame-ancestors 'none'`), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- External links use `rel="noopener noreferrer"`. Links in curated data must be `https`.
- Editorial changes are pull requests, so every change to a status or a publication has a reviewer and a history.
- Contact e-mail and ORCID are published only when the researcher fills `data/curated/profile.json`.
- The private area is the existing Cockpit on its own Vercel project (`nexo-one`, PIN login). This site only redirects `/privado`, `/pt/privado` and `/en/privado` to it (`next.config.ts`). No private code, data or credential is stored here, and the footer link is a plain anchor so visitors never trigger a request to the Cockpit.
