// Builds the public manifest from the last validated Tower snapshot plus editorial approvals.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {buildManifest} from '../src/lib/build.ts';
import {approvals as approvalsSchema, dossiers as dossiersSchema, publications as publicationsSchema, projects as projectsSchema, towerPublic} from '../src/lib/schemas.ts';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));
const snapshotBytes = read('data/source/atlas-public.json');
const tower = towerPublic.parse(JSON.parse(snapshotBytes.toString('utf8')));
const approvals = approvalsSchema.parse(JSON.parse(read('data/curated/approvals.json').toString('utf8')));
publicationsSchema.parse(JSON.parse(read('data/curated/publications.json').toString('utf8')));
projectsSchema.parse(JSON.parse(read('data/curated/projects.json').toString('utf8')));

const manifest = buildManifest(tower, approvals, snapshotBytes);
const dossiers = dossiersSchema.parse(JSON.parse(read('data/curated/dossiers.json').toString('utf8')));
const known = new Set(manifest.results.map(item => item.id));
for (const entry of dossiers) if (!known.has(entry.id)) throw new Error(`dossier ${entry.id} matches no Tower test`);
if (new Set(dossiers.map(entry => entry.id)).size !== dossiers.length) throw new Error('duplicate dossier id');
mkdirSync(new URL('../data/generated/', import.meta.url), {recursive: true});
writeFileSync(new URL('../data/generated/manifest.json', import.meta.url), JSON.stringify(manifest));
console.log(`manifest: ${manifest.results.length} results, ${manifest.results.filter(item => item.figure).length} with figure, ${approvals.length} approvals, ${dossiers.length} dossiers`);
