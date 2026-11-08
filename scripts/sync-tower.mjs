// Refreshes data/source/atlas-public.json from the public Tower manifest.
// The snapshot is replaced only when the new document validates, is not older than the current one,
// and does not lose records. Any failure keeps the last validated snapshot and exits non-zero.
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {towerPublic} from '../src/lib/schemas.ts';

const URL_SOURCE = process.env.TOWER_PUBLIC_URL ?? 'https://nexoresearch.org/atlas-public.json';
const TARGET = new URL('../data/source/atlas-public.json', import.meta.url);
const MAX_BYTES = 8 * 1024 * 1024;
const idOf = test => createHash('sha256').update(test.question.en).digest('hex').slice(0, 12);

if (!URL_SOURCE.startsWith('https://')) throw new Error('TOWER_PUBLIC_URL must be https');
const response = await fetch(URL_SOURCE, {redirect: 'error', signal: AbortSignal.timeout(30000), headers: {Accept: 'application/json'}});
if (!response.ok) throw new Error(`Tower public source answered ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
if (bytes.length > MAX_BYTES) throw new Error('Tower public source is larger than 8 MB');
const next = towerPublic.parse(JSON.parse(bytes.toString('utf8')));
const current = towerPublic.parse(JSON.parse(readFileSync(TARGET, 'utf8')));

const latest = doc => doc.tests.reduce((max, test) => (test.updated_at > max ? test.updated_at : max), '');
if (latest(next) < latest(current)) throw new Error('new snapshot is older than the validated one; keeping the current snapshot');
if (next.tests.length < current.tests.length * 0.8) throw new Error(`new snapshot lost records (${current.tests.length} -> ${next.tests.length}); keeping the current snapshot`);

const before = new Map(current.tests.map(test => [idOf(test), test.updated_at]));
const added = next.tests.filter(test => !before.has(idOf(test))).length;
const changed = next.tests.filter(test => before.has(idOf(test)) && before.get(idOf(test)) !== test.updated_at).length;
if (bytes.equals(readFileSync(TARGET))) {
  console.log('no change');
} else {
  writeFileSync(TARGET, bytes);
  console.log(`snapshot updated: +${added} new, ${changed} changed, ${next.tests.length} total`);
}
