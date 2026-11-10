import Link from 'next/link';
import type {ReactNode} from 'react';
import {PairChart, pairOf} from '@/components/PairChart';
import {SensitivityChart} from '@/components/SensitivityChart';
import type {Family} from '@/lib/families';
import {scientificText} from '@/lib/format';
import {pick, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {compilations, sensitivityPoints, sensitivityRows} from '@/lib/sensitivity';

export function FamilyFigure({family, locale}: {family: Family; locale: Locale}) {
  const pt = locale === 'pt';
  if (family.slug === 'redshift-exclusion' || family.slug === 'redshift-concentration') {
    const points = sensitivityPoints(family.records);
    if (points.length < 2) return null;
    return (
      <div className="card family-figure">
        <SensitivityChart rows={sensitivityRows(points)} series={compilations(points)} locale={locale}
          title={pt ? 'Redução da melhora do ajuste' : 'Reduction in fit improvement'}
          lead={pt ? 'Uma execução por ponto, agrupada por compilação e faixa excluída.' : 'One run per dot, grouped by compilation and excluded range.'} />
      </div>
    );
  }

  if (family.slug === 'desi-dr1-tracers' || family.slug === 'fixed-expansion-growth') {
    return <ChiSquareFigure family={family} locale={locale} />;
  }

  // A single run can contain a comparison under two conditions in its published figure.
  const item = family.records.length === 1 ? family.records[0] : undefined;
  if (item?.figure && pairOf(item)) {
    return (
      <div className="card family-figure">
        <PairChart item={item} locale={locale}>
          {item.figure.limitations.map(limit => <p className="viz-source" key={limit.en}>{pick(limit, locale)}</p>)}
          <Link href={href(locale, '/results/' + item.slug)} className="text-link" prefetch={false}>
            {pt ? 'Método, limites e proveniência' : 'Method, limits and provenance'} · {item.id}
          </Link>
        </PairChart>
      </div>
    );
  }
  return null;
}

// The two families define separate reference models and use the same signed Δχ² convention
// within each family. Keep the tracer and its fixed model with each value.
function ChiSquareFigure({family, locale}: {family: Family; locale: Locale}): ReactNode {
  const pt = locale === 'pt';
  const growth = family.slug === 'fixed-expansion-growth';
  const tracer = growth
    ? (pt ? /, os dados de (.+?) favorecem / : /, do (.+?) favor /)
    : (pt ? /^No DESI DR1, (.+?) favorecem / : /^In DESI DR1, do (.+?) favor /);
  const points = family.records.flatMap(item => {
    const figure = item.figure;
    if (!figure || figure.y.label.en !== 'Reference χ² − alternative χ²' || figure.y.unit !== '') return [];
    const [series] = figure.series;
    const point = series?.points[0];
    const context = tracer.exec(pick(item.question, locale))?.[1];
    if (figure.series.length !== 1 || !series || series.points.length !== 1 || !point || !context) return [];
    if (point.low !== undefined || point.high !== undefined || !Number.isFinite(point.y)) return [];
    return [{item, value: point.y, context, model: scientificText(pick(series.label, locale), locale)}];
  });
  if (points.length < 2) return null;
  const values = points.map(point => point.value);
  const magnitude = Math.max(...values.map(Math.abs));
  const step = magnitude > 0 ? 10 ** Math.floor(Math.log10(magnitude)) / 2 : 1;
  const min = Math.min(0, Math.floor(Math.min(...values) / step) * step);
  const max = Math.max(step, Math.ceil(Math.max(...values) / step) * step);
  const position = (value: number) => 100 * (value - min) / (max - min);
  const zero = position(0);
  const ticks = [...new Set([min, 0, max])];
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 3});
  const format = (value: number) => number.format(value).replace(/^-/, '−');

  return (
    <figure className="card family-figure" style={{'--family-zero': `${zero}%`} as React.CSSProperties}>
      <figcaption>
        <h2>Δχ² = {pt ? 'χ² da referência − χ² da alternativa' : 'reference χ² − alternative χ²'}</h2>
        <p>{growth
          ? (pt ? 'Comparações de crescimento com a expansão fixada em cada execução.' : 'Growth comparisons with expansion held fixed in each run.')
          : (pt ? 'Comparações de pontos CPL fixos com a constante cosmológica no DESI DR1.' : 'DESI DR1 comparisons of fixed CPL points with the cosmological constant.')}</p>
      </figcaption>
      <ul role="list" className="family-chart-rows">
        {points.map(({item, value, context, model}) => {
          const end = position(value);
          return (
            <li key={item.id}>
              <div>
                <Link href={href(locale, '/results/' + item.slug)} className="family-chart-label" prefetch={false}>{context}<span className="sr-only"> · {model} · {item.id}</span></Link>
                <p className="family-chart-model">{model}</p>
              </div>
              <div className="family-chart-track" aria-hidden="true">
                <span data-negative={value < 0 ? '' : undefined} style={{insetInlineStart: `${Math.min(zero, end)}%`, inlineSize: `${Math.abs(end - zero)}%`}} />
              </div>
              <span className="family-chart-value">{format(value)}</span>
            </li>
          );
        })}
        <li className="family-chart-axis" aria-hidden="true">
          <div className="family-chart-ticks">
            {ticks.map(tick => <span key={tick} style={{insetInlineStart: `${position(tick)}%`}}>{format(tick)}</span>)}
          </div>
        </li>
      </ul>
      <p className="family-chart-note">{pt
        ? 'Cada Δχ² compara os dois ajustes da sua própria execução. Valores positivos indicam χ² menor para a alternativa. Cada registro detalha a comparação e seus limites.'
        : 'Each Δχ² compares the two fits within its own run. Positive values indicate a lower χ² for the alternative. Each record details the comparison and its limits.'}</p>
    </figure>
  );
}
