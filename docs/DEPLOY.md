# Deployment and maintenance

## Vercel

1. Import the repository in Vercel (framework: Next.js, root directory: repository root, Node 24).
2. Build command: `npm run build`. Output: default.
3. No environment variable is required. Set `NEXT_PUBLIC_SITE_URL` to the production origin when the domain moves.
4. Every pull request gets a preview URL. Production deploys from `main`.

## Domain migration (nexoresearch.org)

The domain currently serves the existing Atlas site. Do not move it until the preview has been reviewed and approved.

1. Review the preview URL on desktop and mobile in both languages.
2. Run Lighthouse against the production origin (`npx lighthouse https://<origin>/pt --only-categories=performance,accessibility,best-practices,seo`).
3. Confirm that `/atlas-public.json` still has a public home. This site reads the Tower manifest from `TOWER_PUBLIC_URL`; if the old site stops serving it, point the variable at its new location before the move, or the daily sync fails (the site keeps the last snapshot).
4. In Vercel, add `nexoresearch.org` to this project and update DNS as Vercel instructs. Keep the old project until the new origin is verified.
5. Rollback: re-point the domain to the previous project.

## Routine maintenance

- `sync-tower` runs daily and opens a pull request when the public manifest changed. Merging it deploys the new records as `CANDIDATE`.
- `ci` runs typecheck, unit tests, build, the private-material scan and the Playwright suite (functional and axe accessibility) on every push and pull request.
- Dependencies: update in a branch, run `npm run check` and `npx playwright test`.
- Adding a language: extend `LOCALES` in `src/lib/i18n.ts`, add the strings to `src/lib/dict.ts` and the MDX pages in `src/content`.
