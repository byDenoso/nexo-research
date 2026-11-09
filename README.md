# NEXO Research

Public scientific portal of NEXO, a research system in computational and observational cosmology directed by Dener Pereira (Federal University of Rio de Janeiro). Portuguese (`/pt`) and English (`/en`).

Next.js (App Router, React Server Components), TypeScript strict, Tailwind CSS 4, MDX, KaTeX, Zod, Vitest, Playwright. Static generation for every page.

## What the site shows

| Route | Content |
|---|---|
| `/research` | Research lines with their projects and public results |
| `/results`, `/results/[slug]` | Public test summaries with status, provenance and key figures |
| `/publications` | Authorised papers, notes and preprints, BibTeX export |
| `/projects` | Research programmes |
| `/methods` | Methodology and reproducibility (MDX, equations in KaTeX) |
| `/data` | The Tower snapshot in use (SHA-256) and the data sets named in the summaries |
| `/code` | Public repositories |
| `/updates` | Public records by update date |
| `/about`, `/contact` | Researcher and collaboration |

## Data flow

```
Tower public manifest (ATLAS_PUBLIC_V1)
        │  scripts/sync-tower.mjs   validates, refuses older or shrinking snapshots
        ▼
data/source/atlas-public.json        last validated public snapshot (committed)
        │  scripts/build-data.mjs   Zod validation + data/curated/*
        ▼
data/generated/manifest.json         NEXO_RESEARCH_MANIFEST_V1 (built, not committed)
        ▼
static pages
```

The browser never calls the Tower. If the Tower is unavailable the site keeps the last committed snapshot.

### Scientific status

Statuses are `CANDIDATE`, `TESTING`, `VALIDATED`, `REFUTED` and `PUBLISHED`. A record that comes from the Tower is always `CANDIDATE`. The only way to change a status is an entry in `data/curated/approvals.json`, which is validated against the Tower records (unknown identifiers fail the build). See `docs/EDITORIAL.md`.

### What is curated by hand

- `data/curated/approvals.json`: status, dataset, data version, model, statistical method, parameters, references, code and plain-language text per result.
- `data/curated/publications.json`: only works cleared for public display (`publicAuthorized: true`). DOI and arXiv identifiers are format-checked; nothing is generated.
- `data/curated/projects.json`, `data/curated/profile.json` (ORCID, contact e-mail, profile URL and repositories stay empty until the researcher provides them).

## Commands

```bash
npm install
npm run dev          # development server
npm run check        # typecheck, unit tests, manifest build, private-material scan
npm run build        # manifest + production build
npm run test:e2e     # Playwright (use PW_CHANNEL=chrome to use an installed Chrome)
npm run data:sync    # refresh the snapshot from the public Tower manifest
```

## Environment

| Variable | Use | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | canonical URLs, sitemap, hreflang | `https://nexoresearch.org` |
| `TOWER_PUBLIC_URL` | source for `data:sync` | `https://bydenoso.github.io/Pantheon/atlas-public.json` (unavailable until a new feed is set) |

No secret is needed to build or run this site. See `docs/DEPLOY.md` and `docs/SECURITY.md`.
