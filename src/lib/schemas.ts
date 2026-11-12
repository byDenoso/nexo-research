import {z} from 'zod';

export const localized = z.object({'pt-BR': z.string().min(1), en: z.string().min(1)});

// ---- Tower public source (ATLAS_PUBLIC_V1), read-only contract ----
export const towerTest = z.object({
  question: localized,
  answers: localized,
  method: localized,
  result: localized,
  published_at: z.string().datetime().nullable(),
  updated_at: z.string().datetime()
});

export const towerVisual = z.object({
  presentation: z.string(),
  id: z.string().min(1),
  subject: z.object({kind: z.string(), question: localized}).passthrough(),
  title: localized,
  caption: localized,
  limitations: z.array(localized),
  publishedAt: z.string().datetime(),
  evidenceKind: z.string(),
  sources: z.array(z.object({label: localized, url: z.string().url()})),
  plot: z.object({
    x: z.object({label: localized, unit: z.string()}),
    y: z.object({label: localized, unit: z.string()}),
    style: z.string(),
    series: z.array(z.object({
      id: z.string(),
      label: localized,
      points: z.array(z.object({x: z.number(), y: z.number(), low: z.number().optional(), high: z.number().optional()}))
    }))
  })
});

export const towerPublic = z.object({
  contract: z.literal('ATLAS_PUBLIC_V1'),
  tests: z.array(towerTest),
  visualsContract: z.literal('ATLAS_PUBLIC_VISUALS_V1'),
  visuals: z.array(towerVisual)
}).passthrough();

// ---- Scientific state. Never inferred from the Tower. ----
export const STATUSES = ['CANDIDATE', 'TESTING', 'VALIDATED', 'REFUTED', 'PUBLISHED'] as const;
export const status = z.enum(STATUSES);
export type Status = z.infer<typeof status>;

export const LINES = ['expansion', 'models', 'probes', 'galaxies', 'local-group', 'anomalies', 'reproducibility'] as const;
export const line = z.enum(LINES);
export type Line = z.infer<typeof line>;

const url = z.string().url().refine(value => value.startsWith('https://'), 'https only');

// Editorial approvals: the only place where a status can be raised.
export const approval = z.object({
  id: z.string().regex(/^T-[0-9a-f]{12}$/),
  status,
  statusNote: localized.optional(),
  dataset: z.string().optional(),
  dataVersion: z.string().optional(),
  model: z.string().optional(),
  statMethod: z.string().optional(),
  parameters: z.array(z.object({name: z.string(), value: z.string()})).optional(),
  references: z.array(z.object({label: z.string(), url: url.optional(), doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(), arxiv: z.string().regex(/^\d{4}\.\d{4,5}(v\d+)?$/).optional()})).optional(),
  code: z.array(z.object({label: z.string(), url})).optional(),
  publicationIds: z.array(z.string()).optional(),
  lines: z.array(line).optional(),
  plain: z.object({summary: localized, why: localized}).optional()
});
export const approvals = z.array(approval);

// Dossier: where a highlighted result can be checked. It never changes a status. A field that
// has not been confirmed against the source is left out and shown as "not stated"; nothing is inferred.
const reference = z.object({label: z.string(), url: url.optional(), doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(), arxiv: z.string().regex(/^\d{4}\.\d{4,5}(v\d+)?$/).optional()});
export const dossier = z.object({
  id: z.string().regex(/^T-[0-9a-f]{12}$/),
  datasets: z.array(z.object({
    name: z.string().min(1),
    role: localized,
    release: z.string().min(1).optional(),
    table: z.string().min(1).optional(),
    reference: reference.optional()
  })).min(1),
  code: z.array(z.object({label: z.string(), url})).optional(),
  artefacts: z.array(z.object({label: z.string(), url, sha256: z.string().regex(/^[0-9a-f]{64}$/).optional()})).optional(),
  analysisDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});
export const dossiers = z.array(dossier);
export type Dossier = z.infer<typeof dossier>;

export const PUB_STATES = ['INTERNAL', 'PREPRINT', 'SUBMITTED', 'ACCEPTED', 'PUBLISHED'] as const;
export const publication = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  authors: z.array(z.string()).min(1),
  abstract: localized,
  topic: line,
  state: z.enum(PUB_STATES),
  date: z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/),
  venue: z.string().optional(),
  doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(),
  arxiv: z.string().regex(/^\d{4}\.\d{4,5}(v\d+)?$/).optional(),
  pdf: url.optional(),
  code: url.optional(),
  data: url.optional(),
  resultIds: z.array(z.string()).optional(),
  publicAuthorized: z.literal(true)
});
export const publications = z.array(publication);
export type Publication = z.infer<typeof publication>;

export const project = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: localized,
  summary: localized,
  line,
  // Optional pattern, tested on the English question, that narrows the records of the line to this project.
  pattern: z.string().optional(),
  state: z.enum(['active', 'planned', 'paused'])
});
export const projects = z.array(project);
export type Project = z.infer<typeof project>;

// ---- Built, public manifest consumed by the UI ----
export const result = z.object({
  id: z.string().regex(/^T-[0-9a-f]{12}$/),
  slug: z.string(),
  title: localized,
  question: localized,
  answer: localized,
  method: localized,
  result: localized,
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
  status,
  statusSource: z.enum(['default', 'approval']),
  lines: z.array(line).min(1),
  approval: approval.omit({id: true, status: true, lines: true}).optional(),
  figure: z.object({
    id: z.string(), caption: localized, limitations: z.array(localized),
    x: z.object({label: localized, unit: z.string()}), y: z.object({label: localized, unit: z.string()}),
    series: z.array(z.object({id: z.string(), label: localized, points: z.array(z.object({x: z.number(), y: z.number(), low: z.number().optional(), high: z.number().optional()}))})),
    source: z.object({label: localized, url: z.string()})
  }).optional()
});
export type Result = z.infer<typeof result>;
export const manifest = z.object({
  contract: z.literal('NEXO_RESEARCH_MANIFEST_V1'),
  generatedFrom: z.object({contract: z.string(), tests: z.number(), visuals: z.number(), snapshotSha256: z.string(), latestUpdate: z.string()}),
  results: z.array(result)
});
export type Manifest = z.infer<typeof manifest>;
