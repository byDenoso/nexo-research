// Emits the reviewed public snapshot (ATLAS_PUBLIC_V1) from a checkout of byDenoso/Pantheon.
// Usage: node scripts/emit-pantheon-public.mjs <path-to-Pantheon> <output.json>
// Run after `npm ci --ignore-scripts && npm run build` in <Pantheon>/nexo-atlas.
// It uses the same public projection that the Atlas worker serves; no credential is involved.
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [root, out] = process.argv.slice(2);
if (!root || !out) throw new Error('usage: emit-pantheon-public.mjs <Pantheon dir> <output.json>');
const {createWorker} = await import(pathToFileURL(resolve(root, 'nexo-atlas/worker/index.mjs')).href);
const response = await createWorker().fetch(new Request('https://nexoresearch.org/api/atlas-public'), {});
if (response.status !== 200) throw new Error(`public projection answered ${response.status}`);
const text = await response.text();
if (JSON.parse(text).contract !== 'ATLAS_PUBLIC_V1') throw new Error('unexpected contract');
await writeFile(out, text);
console.log(`emitted ${text.length} bytes`);
