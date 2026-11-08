import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {manifest as manifestSchema, projects as projectsSchema, publications as publicationsSchema, type Manifest, type Project, type Publication, type Result} from './schemas.ts';
import {z} from 'zod';

const root = process.cwd();
const json = (path: string): unknown => JSON.parse(readFileSync(join(root, path), 'utf8'));

let cached: Manifest | undefined;
export function getManifest(): Manifest {
  cached ??= manifestSchema.parse(json('data/generated/manifest.json'));
  return cached;
}
export const getResults = (): Result[] => getManifest().results;
export const getResult = (slug: string): Result | undefined => getResults().find(item => item.slug === slug);
export const getProjects = (): Project[] => projectsSchema.parse(json('data/curated/projects.json'));
export const getPublications = (): Publication[] => publicationsSchema.parse(json('data/curated/publications.json')).sort((a, b) => b.date.localeCompare(a.date));

const profile = z.object({
  name: z.string(), affiliation: z.string(),
  orcid: z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/).nullable(),
  email: z.string().email().nullable(),
  profileUrl: z.string().url().nullable(),
  repositories: z.array(z.object({label: z.string(), url: z.string().url(), description: z.string().optional()}))
});
export const getProfile = () => profile.parse(json('data/curated/profile.json'));

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nexoresearch.org';

export const DATASETS: ReadonlyArray<[string, RegExp]> = [
  ['DESI DR2 BAO', /DESI/i], ['DES-SN5YR', /DES-SN5YR/i], ['Union3', /Union3/i], ['Pantheon+', /Pantheon/i],
  ['Planck', /Planck/i], ['SH0ES', /SH0ES/i], ['TRGB', /TRGB/i], ['JWST', /JWST/i], ['Euclid', /Euclid/i], ['Gaia', /Gaia/i]
];
export function datasetMentions(results: Result[]): Array<{name: string; count: number}> {
  return DATASETS.map(([name, pattern]) => ({name, count: results.filter(item => pattern.test(`${item.question.en} ${item.method.en} ${item.result.en}`)).length}))
    .filter(entry => entry.count > 0).sort((a, b) => b.count - a.count);
}

export function monthlyActivity(results: Result[]): Array<{month: string; count: number}> {
  const bins = new Map<string, number>();
  for (const item of results) {
    const month = item.updatedAt.slice(0, 7);
    bins.set(month, (bins.get(month) ?? 0) + 1);
  }
  return [...bins.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({month, count}));
}

const bibEscape = (text: string) => text.replace(/[{}\\]/g, '');
export function toBibtex(pub: Publication): string {
  const key = `${pub.authors[0]?.split(' ').at(-1)?.toLowerCase().replace(/[^a-z]/g, '') ?? 'nexo'}${pub.date.slice(0, 4)}${pub.id.replace(/[^a-z0-9]/g, '').slice(0, 8)}`;
  const fields: Array<[string, string | undefined]> = [
    ['title', `{${bibEscape(pub.title)}}`], ['author', bibEscape(pub.authors.join(' and '))], ['year', pub.date.slice(0, 4)],
    ['journal', pub.venue ? bibEscape(pub.venue) : undefined], ['doi', pub.doi], ['eprint', pub.arxiv], ['archivePrefix', pub.arxiv ? 'arXiv' : undefined]
  ];
  const body = fields.filter((entry): entry is [string, string] => Boolean(entry[1])).map(([name, value]) => `  ${name} = ${name === 'title' ? value : `{${value}}`}`).join(',\n');
  return `@${pub.state === 'PUBLISHED' || pub.state === 'ACCEPTED' ? 'article' : 'unpublished'}{${key},\n${body}\n}`;
}
