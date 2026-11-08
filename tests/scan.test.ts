import {readFileSync} from 'node:fs';
import {describe, expect, it} from 'vitest';
import {scanText} from '../scripts/scan-private.mjs';
import {toBibtex} from '../src/lib/data.ts';
import {fmtDate, isLocale, pick} from '../src/lib/i18n.ts';

describe('private-material scanner', () => {
  it('flags credentials, private routes and private document links', () => {
    expect(scanText('-----BEGIN PRIVATE KEY-----')).toContain('private key');
    expect(scanText('fetch("/api/atlas-cockpit")')).toContain('private api route');
    expect(scanText('https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz')).toContain('private sheet url');
    expect(scanText('const k = "AIzaSyA1234567890123456789012345678901234"')).toContain('google api key');
  });
  it('lets ordinary public text through', () => {
    expect(scanText('Cosmological tests against BAO and supernovae. https://doi.org/10.1000/example')).toEqual([]);
  });
  it('finds nothing in the validated public snapshot', () => {
    expect(scanText(readFileSync('data/source/atlas-public.json', 'utf8'))).toEqual([]);
  });
});

describe('BibTeX export', () => {
  const pub = {id: 'ex-1', title: 'A title', authors: ['Dener Pereira'], abstract: {'pt-BR': 'a', en: 'a'}, topic: 'expansion' as const, state: 'PREPRINT' as const, date: '2026-05', arxiv: '2605.01234', publicAuthorized: true as const};
  it('exports only fields that exist and never invents a DOI', () => {
    const bib = toBibtex(pub);
    expect(bib).toMatch(/^@unpublished\{pereira2026ex1,/);
    expect(bib).toContain('eprint = {2605.01234}');
    expect(bib).not.toMatch(/doi/);
  });
  it('uses @article for accepted and published work', () => {
    expect(toBibtex({...pub, state: 'PUBLISHED', doi: '10.1000/xyz123', venue: 'Journal'})).toMatch(/^@article\{/);
  });
});

describe('locale helpers', () => {
  it('accepts only supported locales and picks the right language', () => {
    expect(isLocale('pt')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(pick({'pt-BR': 'olá', en: 'hello'}, 'en')).toBe('hello');
    expect(pick({'pt-BR': 'olá', en: 'hello'}, 'pt')).toBe('olá');
  });
  it('formats dates in UTC', () => {
    expect(fmtDate('2026-10-09T23:59:00Z', 'en')).toBe('09 Oct 2026');
  });
});
