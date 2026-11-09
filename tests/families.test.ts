import {readFileSync} from 'node:fs';
import {describe, it, expect} from 'vitest';
import {buildManifest} from '../src/lib/build.ts';
import {getFamilies, familyFor} from '../src/lib/families.ts';
import {scientificText} from '../src/lib/format.ts';
import {towerPublic} from '../src/lib/schemas.ts';

const bytes = readFileSync('data/source/atlas-public.json');
const manifest = buildManifest(towerPublic.parse(JSON.parse(bytes.toString())), [], bytes);
const families = getFamilies(manifest.results);

describe('editorial research families', () => {
  it('preserves every source ID, state and execution once', () => {
    const records = families.flatMap(family => family.records);
    expect(records).toHaveLength(manifest.results.length);
    expect(records.map(record => record.id).sort()).toEqual(manifest.results.map(record => record.id).sort());
    expect(records.every(record => record.status === 'CANDIDATE')).toBe(true);
    expect(families.length).toBeLessThan(manifest.results.length);
  });

  it('groups known nuisance-parameter variations but not unrelated questions', () => {
    const family = families.find(item => item.slug === 'redshift-exclusion');
    expect(family).toBeDefined();
    expect(family!.records.length).toBeGreaterThan(10);
    expect(family!.records.every(record => /redshift|ranges z/i.test(record.question.en))).toBe(true);
    const other = manifest.results.find(record => /holography, the meV scale/.test(record.question.en));
    expect(other).toBeDefined();
    expect(familyFor(manifest.results, other!)?.records).toHaveLength(1);
  });

  it('keeps scientific texts unchanged in source, and presentation locale-sensitive', () => {
    expect(scientificText('w₀ = -0.838, wₐ = -0.62', 'pt')).toBe('w₀ = −0,838, wₐ = −0,62');
    expect(scientificText('w₀ = -0.838, wₐ = -0.62', 'en')).toBe('w₀ = -0.838, wₐ = -0.62');
    expect(scientificText('doi:10.5281/zenodo.12345', 'pt')).toBe('doi:10.5281/zenodo.12345');
  });
});
