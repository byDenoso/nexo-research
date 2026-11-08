import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {buildManifest, idOf} from '../src/lib/build.ts';
import {classify} from '../src/lib/classify.ts';
import {approval, approvals, manifest as manifestSchema, publication, towerPublic} from '../src/lib/schemas.ts';

const bytes = readFileSync('data/source/atlas-public.json');
const tower = towerPublic.parse(JSON.parse(bytes.toString('utf8')));

describe('manifest from the public Tower snapshot', () => {
  const manifest = buildManifest(tower, [], bytes);

  it('keeps one result per public test with stable, unique identifiers', () => {
    expect(manifest.results).toHaveLength(tower.tests.length);
    expect(new Set(manifest.results.map(item => item.id)).size).toBe(tower.tests.length);
    expect(manifest.results.every(item => item.slug === item.id.toLowerCase())).toBe(true);
    expect(idOf(tower.tests[0]!.question)).toBe(manifest.results.find(item => item.question.en === tower.tests[0]!.question.en)?.id);
  });

  it('never promotes a result without an editorial approval', () => {
    expect(manifest.results.every(item => item.status === 'CANDIDATE' && item.statusSource === 'default')).toBe(true);
  });

  it('is valid against its own schema and records the snapshot hash', () => {
    expect(manifestSchema.safeParse(manifest).success).toBe(true);
    expect(manifest.generatedFrom.snapshotSha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('keeps missing publication dates as null instead of inventing one', () => {
    expect(manifest.results.filter(item => item.publishedAt === null).length).toBe(tower.tests.filter(test => test.published_at === null).length);
  });

  it('attaches a figure only when the Tower published one for the same question', () => {
    const withFigure = manifest.results.filter(item => item.figure).length;
    expect(withFigure).toBe(new Set(tower.visuals.map(visual => visual.subject.question.en)).size);
  });
});

describe('editorial approvals', () => {
  const first = buildManifest(tower, [], bytes).results[0]!;
  const record = {id: first.id, status: 'VALIDATED' as const, dataset: 'Example data set', dataVersion: 'v1'};

  it('raise the status of exactly the approved result', () => {
    const promoted = buildManifest(tower, approvals.parse([record]), bytes);
    expect(promoted.results.filter(item => item.status === 'VALIDATED').map(item => item.id)).toEqual([first.id]);
    expect(promoted.results.find(item => item.id === first.id)?.approval?.dataset).toBe('Example data set');
  });

  it('are rejected when they match no Tower test or repeat an identifier', () => {
    expect(() => buildManifest(tower, approvals.parse([{id: 'T-000000000000', status: 'TESTING'}]), bytes)).toThrow(/matches no Tower test/);
    expect(() => buildManifest(tower, approvals.parse([record, record]), bytes)).toThrow(/duplicate approval/);
  });

  it('validate identifiers, statuses, DOI, arXiv and https-only links', () => {
    expect(approval.safeParse({id: 'bad', status: 'VALIDATED'}).success).toBe(false);
    expect(approval.safeParse({...record, status: 'DONE'}).success).toBe(false);
    expect(approval.safeParse({...record, references: [{label: 'x', doi: 'not-a-doi'}]}).success).toBe(false);
    expect(approval.safeParse({...record, code: [{label: 'x', url: 'http://example.org'}]}).success).toBe(false);
    expect(approval.safeParse({...record, references: [{label: 'x', doi: '10.1000/xyz123', arxiv: '2401.01234'}]}).success).toBe(true);
  });
});

describe('publications', () => {
  const base = {id: 'example', title: 'T', authors: ['A'], abstract: {'pt-BR': 'a', en: 'a'}, topic: 'expansion', state: 'PREPRINT', date: '2026-01'};
  it('require explicit authorisation for public display', () => {
    expect(publication.safeParse(base).success).toBe(false);
    expect(publication.safeParse({...base, publicAuthorized: true}).success).toBe(true);
    expect(publication.safeParse({...base, publicAuthorized: true, doi: 'wrong'}).success).toBe(false);
  });
});

describe('research line classification', () => {
  it('maps keywords to lines and falls back to a neutral line', () => {
    expect(classify('Does DESI BAO prefer evolving dark energy?')).toContain('expansion');
    expect(classify('JWST little red dots selection')).toContain('galaxies');
    expect(classify('something unrelated')).toEqual(['reproducibility']);
  });
});
