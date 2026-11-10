import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FamilyFigure} from '../src/components/FamilyFigure';
import {SensitivityChart} from '../src/components/SensitivityChart';
import {buildManifest} from '../src/lib/build.ts';
import {getFamilies} from '../src/lib/families.ts';
import {towerPublic} from '../src/lib/schemas.ts';
import {compilations, sensitivityPoints, sensitivityRows} from '../src/lib/sensitivity.ts';

const snapshot = readFileSync('data/source/atlas-public.json');
const manifest = buildManifest(towerPublic.parse(JSON.parse(snapshot.toString())), [], snapshot);
const families = getFamilies(manifest.results);
const figureFor = (slug: string) => renderToStaticMarkup(createElement(FamilyFigure, {
  family: families.find(family => family.slug === slug)!, locale: 'pt'
}));

describe('figures from the public manifest', () => {
  it.each([['redshift-exclusion', 34], ['redshift-concentration', 16]])('shows every run of %s once', (slug, count) => {
    const figure = figureFor(slug);
    expect(figure.match(/class="sens-dot"/g)).toHaveLength(count);
    expect(figure.match(/href="\/pt\/results\/t-/g)).toHaveLength(count + 1);
  });

  it.each([
    ['desi-dr1-tracers', 9, '−215,07', '4,08'],
    ['fixed-expansion-growth', 5, '−0,74', '0,81']
  ])('preserves signed values for all %s runs', (slug, count, negative, positive) => {
    const figure = figureFor(slug);
    expect(figure.match(/href="\/pt\/results\/t-/g)).toHaveLength(count);
    expect(figure).toContain(negative);
    expect(figure).toContain(positive);
  });

  it('omits families without a numerical comparison', () => {
    expect(figureFor('bao-prior')).toBe('');
    expect(figureFor('t-9cdf8dcdf082')).toBe('');
  });

  it('serves the selected redshift run and full observed span before hydration', () => {
    const points = sensitivityPoints(manifest.results);
    const figure = renderToStaticMarkup(createElement(SensitivityChart, {
      rows: sensitivityRows(points), series: compilations(points), locale: 'pt', highlight: 'T-05ae703af393', title: 'Redshift'
    }));
    expect(figure.match(/class="sens-dot"/g)).toHaveLength(51);
    expect(figure).toMatch(/data-featured=""[^>]+aria-label="T-05ae703af393[^>]+94%/);
    expect(figure).toContain('18%–95%');
  });
});
