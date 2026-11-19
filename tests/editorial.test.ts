import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {buildManifest} from '../src/lib/build.ts';
import {getFamilies} from '../src/lib/families.ts';
import {ROUTES} from '../src/lib/i18n.ts';
import {toFamilyRows} from '../src/lib/rows.ts';
import {dossier, dossiers, towerPublic} from '../src/lib/schemas.ts';
import {fold, matches} from '../src/lib/search.ts';
import {compilations, sensitivityPoints, sensitivityRows} from '../src/lib/sensitivity.ts';

const bytes = readFileSync('data/source/atlas-public.json');
const manifest = buildManifest(towerPublic.parse(JSON.parse(bytes.toString())), [], bytes);
const rows = toFamilyRows(getFamilies(manifest.results), 'pt');
const find = (query: string) => rows.filter(row => matches(row.haystack, query)).map(row => row.slug);

describe('catalogue search', () => {
  it('ignores accents and case', () => {
    expect(fold('Expansão  e ENERGIA')).toBe('expansao e energia');
    expect(find('tracadores')).toEqual(find('traçadores'));
    expect(find('tracadores')).toContain('bao-tracer-exclusion');
  });

  it('indexes the editorial family title and description, in both languages', () => {
    expect(find('Concentração do sinal por redshift')).toContain('redshift-concentration');
    expect(find('redshift localisation')).toContain('redshift-concentration');
    expect(find('floresta lyα')).toContain('foreground-directions');
  });

  it('still finds records by identifier and returns nothing for nonsense', () => {
    expect(find('T-05ae703af393')).toEqual(['redshift-exclusion']);
    expect(find('zzzz-no-match')).toEqual([]);
  });
});

describe('redshift-sensitivity figure', () => {
  const points = sensitivityPoints(manifest.results);

  it('uses only values present in manifest figures', () => {
    expect(points.length).toBeGreaterThan(40);
    for (const point of points) {
      const figure = manifest.results.find(item => item.id === point.id)!.figure!;
      expect(figure.series[0]!.points[0]!.y).toBe(point.value);
      expect(figure.y.unit).toBe('%');
      expect(point.zLow).toBeLessThan(point.zHigh);
    }
    expect(points.find(point => point.id === 'T-05ae703af393')).toMatchObject({compilation: 'DES-SN5YR', zLow: 0.01, zHigh: 0.15, value: 94});
  });

  it('keeps every run once and a stable series order', () => {
    const grouped = sensitivityRows(points);
    expect(grouped.flatMap(row => row.points).length).toBe(points.length);
    expect(compilations(points)).toEqual([...compilations(points)].sort());
  });
});

describe('curated editorial files', () => {
  it('dossiers point at existing records and never carry an unconfirmed release', () => {
    const entries = dossiers.parse(JSON.parse(readFileSync('data/curated/dossiers.json', 'utf8')));
    const ids = new Set(manifest.results.map(item => item.id));
    expect(entries.every(entry => ids.has(entry.id))).toBe(true);
    expect(new Set(entries.map(entry => entry.id)).size).toBe(entries.length);
  });

  it('accepts a fixed-matter-density profile only with explicit public authorization', () => {
    const label = {'pt-BR': 'Fonte de teste', en: 'Test source'};
    const entry = {
      id: 'T-05ae703af393',
      datasets: [{name: 'Example', role: label}],
      nonPhantomProfile: {scope: label, source: {label, url: 'https://example.com/'}, rows: [{omegaM: 0.3, deltaChi2: 1}]},
    };
    expect(dossier.safeParse(entry).success).toBe(false);
    expect(dossier.safeParse({...entry, nonPhantomProfile: {...entry.nonPhantomProfile, publicAuthorized: false}}).success).toBe(false);
    expect(dossier.safeParse({...entry, nonPhantomProfile: {...entry.nonPhantomProfile, publicAuthorized: true}}).success).toBe(true);
  });

  it('every static route has a revision date that is not in the future', () => {
    const dates = JSON.parse(readFileSync('data/curated/pages.json', 'utf8')) as Record<string, string>;
    const today = new Date().toISOString().slice(0, 10);
    for (const path of ['', ...ROUTES.map(route => `/${route}`)]) {
      expect(dates[path], path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(dates[path]! <= today, path).toBe(true);
    }
  });
});

// A curated entrance must resolve to a real run without hiding its scientific state.
import {readResult, selectedIds, isNegative} from '../src/lib/editorial.ts';
describe('public reading layer', () => {
  it('keeps featured runs resolvable in both languages with visible limits', () => {
    for (const id of selectedIds) {
      const item = manifest.results.find(item => item.id === id);
      expect(item, id).toBeDefined();
      for (const locale of ['pt','en'] as const) {
        const reading = readResult(item!, locale);
        expect(reading.question).toContain('?');
        expect(reading.why.length).toBeGreaterThan(40);
        expect(reading.limit.length).toBeGreaterThan(40);
      }
    }
  });
  it('indexes plain-language questions without losing source terminology', () => {
    expect(find('retirar supernovas proximas')).toContain('redshift-exclusion');
    expect(find('fitting assumptions')).toContain('bao-prior');
    expect(find('T-05ae703af393')).toEqual(['redshift-exclusion']);
  });
  it('keeps a negative outcome distinct from the evidence state', () => {
    const negative = manifest.results.filter(r => isNegative(r.id));
    expect(negative).toHaveLength(1);
    expect(negative[0]!.status).toBe('CANDIDATE');
    expect(readResult(negative[0]!, 'pt').limit).toContain('comparação de resumos');
  });
});
