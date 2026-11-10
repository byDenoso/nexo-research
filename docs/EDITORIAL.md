# Editorial rules

## Promoting a result

1. Find the result identifier (`T-` followed by 12 hex characters) on its page or in `data/generated/manifest.json`.
2. Add an entry to `data/curated/approvals.json`:

```json
{
  "id": "T-0123456789ab",
  "status": "TESTING",
  "statusNote": {"pt-BR": "...", "en": "..."},
  "dataset": "...",
  "dataVersion": "...",
  "model": "...",
  "statMethod": "...",
  "parameters": [{"name": "Omega_m", "value": "0.30 (fixed)"}],
  "references": [{"label": "...", "doi": "10.xxxx/xxxxx"}],
  "code": [{"label": "...", "url": "https://..."}],
  "plain": {"summary": {"pt-BR": "...", "en": "..."}, "why": {"pt-BR": "...", "en": "..."}}
}
```

3. `npm run check`. The build fails if the identifier matches no Tower record, if an identifier repeats, or if a DOI, arXiv identifier or link is malformed.
4. Open a pull request. The change of status is visible in the diff and in the git history.

Fields that are absent are shown as "Not stated in the public summary". Nothing is inferred.

## Dossiers

A dossier says where a result can be checked. It never changes a status and is independent of `approvals.json`.
Add an entry to `data/curated/dossiers.json`:

```json
{
  "id": "T-0123456789ab",
  "datasets": [
    {
      "name": "DES-SN5YR",
      "role": {"pt-BR": "...", "en": "..."},
      "release": "exact release or file version actually used",
      "table": "table or file in the source",
      "reference": {"label": "Author (year), arXiv:0000.00000", "url": "https://arxiv.org/abs/0000.00000", "arxiv": "0000.00000"}
    }
  ],
  "code": [{"label": "...", "url": "https://..."}],
  "artefacts": [{"label": "...", "url": "https://...", "sha256": "64 hex characters"}],
  "analysisDate": "2026-10-06"
}
```

`release`, `table`, `code`, `artefacts` and `analysisDate` are optional on purpose. Fill one only after checking it
against the run that produced the number; a field left out is shown as "Not stated in the public summary".
A paper reference identifies the compilation, not the file version that was fitted.
The build fails if a dossier names an identifier that is not in the snapshot or repeats one.

## Figures

The figures on the site are drawn from `figure` entries of the public manifest and from nothing else.
`src/lib/sensitivity.ts` reads runs whose key figure is "Reduction in fit improvement" (%) for one removed
redshift range; a run with a different label format is left out of the figure, never guessed.

## Page revision dates

`data/curated/pages.json` holds the date of the last editorial revision of each static route and feeds the
sitemap. Update the date of a route in the same pull request that changes its page. Family pages use the
date of their latest record, and the snapshot date only raises routes that render snapshot data.

## Status meanings

| Status | Meaning |
|---|---|
| CANDIDATE | Internal result without independent validation. Default for every Tower record. |
| TESTING | Under verification by additional tests. |
| VALIDATED | Reproduced and reviewed within the project criteria. |
| REFUTED | Contradicted by a later test. |
| PUBLISHED | Described in an authorised publication. Requires an entry in `publications.json`. |

The Tower uses its own states. They are not mapped one-to-one to these, because their meanings differ; the mapping is an editorial decision recorded in `approvals.json`.

## Publications

Add to `data/curated/publications.json` only works the author cleared for public release, with `publicAuthorized: true`. A submitted or in-review manuscript is shown with state `SUBMITTED` only when its existence is meant to be public. Do not add a DOI or arXiv identifier that has not been assigned.

## Identifier stability

Result identifiers are the first 12 hex characters of the SHA-256 of the English question text. Editing the question changes the identifier; keep the old identifier in the approval record if a link must survive.
