'use client';

import Link from 'next/link';
import {useState} from 'react';
import type {Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import type {SensitivityRow} from '@/lib/sensitivity';

// Dot strip of public runs: one row per (compilation, removed redshift range), one dot per run,
// x = reported reduction in fit improvement. Dots that would overlap move to the next lane, so a
// repeated value stays countable. Colour names the compilation and so does every row label.
const LANE = 10;
const CLUSTER = 4; // percentage points; runs closer than this share one stacked column
const TICKS = [0, 25, 50, 75, 100];

type Placed = {id: string; slug: string; value: number; lane: number};

// Points arrive sorted by value. Each keeps its exact x; runs within CLUSTER points of the first
// run of a column stack upwards, so a repeated value reads as a count instead of one dot.
function place(points: SensitivityRow['points']): {dots: Placed[]; lanes: number} {
  let start = -Infinity, lane = 0, lanes = 1;
  const dots = points.map(point => {
    if (point.value - start >= CLUSTER) { start = point.value; lane = 0; } else lane += 1;
    lanes = Math.max(lanes, lane + 1);
    return {id: point.id, slug: point.slug, value: point.value, lane};
  });
  return {dots, lanes};
}

export function SensitivityChart({rows, series, locale, highlight, title, lead}: {
  rows: SensitivityRow[];
  series: string[];
  locale: Locale;
  highlight?: string;
  title: string;
  lead?: string;
}) {
  const pt = locale === 'pt';
  const all = rows.flatMap(row => row.points.map(point => ({...point, row})));
  const featured = all.find(point => point.id === highlight);
  const fallback = featured ?? all.reduce<(typeof all)[number] | undefined>((best, point) => (!best || point.value > best.value ? point : best), undefined);
  const [active, setActive] = useState<string | undefined>(fallback?.id);
  if (!all.length || !fallback) return null;
  const selected = all.find(point => point.id === active) ?? fallback;
  const plotRows = rows.map(row => ({row, ...place(row.points)}));
  const lastDot = Math.max(...plotRows.map(({lanes}, index) => index * 3 + lanes - 1));
  const min = Math.min(...all.map(point => point.value));
  const max = Math.max(...all.map(point => point.value));
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 3});
  const range = (row: SensitivityRow) => `z = ${number.format(row.zLow)}–${number.format(row.zHigh)}`;
  const removed = (row: SensitivityRow) => (pt ? `sem ${range(row)}` : `without ${range(row)}`);
  const runs = (count: number) => (pt ? (count === 1 ? '1 execução' : `${count} execuções`) : (count === 1 ? '1 run' : `${count} runs`));
  const describe = (point: (typeof all)[number]) =>
    `${point.id}: ${point.row.compilation}, ${removed(point.row)}, ${pt ? 'redução de' : 'reduction of'} ${number.format(point.value)}%`;

  return (
    <figure className="viz sens" data-inview="" data-story={featured ? '' : undefined} style={{'--sens-last-dot': lastDot} as React.CSSProperties}>
      <figcaption className="viz-head">
        <p className="viz-title">{title}</p>
        {lead && <p className="viz-lead">{lead}</p>}
      </figcaption>
      <ul className="viz-legend" role="list" aria-label={pt ? 'Compilação de supernovas' : 'Supernova compilation'}>
        {series.map((name, index) => <li key={name}><span className="viz-swatch" data-series={index} aria-hidden="true" />{name}</li>)}
        <li className="viz-legend-note"><span className="viz-swatch viz-swatch-ring" aria-hidden="true" />{pt ? 'execução selecionada' : 'selected run'}</li>
      </ul>
      <div className="sens-plot">
        {plotRows.map(({row, dots, lanes}, rowIndex) => {
          const seriesIndex = series.indexOf(row.compilation);
          return (
            <div className="sens-row" key={row.key}>
              <p className="sens-label">
                <span className="viz-swatch" data-series={seriesIndex} aria-hidden="true" />
                <span className="sens-name">{row.compilation}</span>
                <span className="sens-range">{removed(row)}</span>
                <span className="sens-count">{runs(row.points.length)}</span>
              </p>
              <div className="sens-track" style={{blockSize: `${(lanes - 1) * LANE + 22}px`}}>
                {dots.map(dot => (
                  <button
                    key={dot.id} type="button" tabIndex={-1} className="sens-dot" data-series={seriesIndex}
                    data-active={dot.id === selected.id ? '' : undefined}
                    data-featured={dot.id === featured?.id ? '' : undefined}
                    style={{insetInlineStart: `${dot.value}%`, insetBlockEnd: `${dot.lane * LANE + 5}px`, '--i': rowIndex * 3 + dot.lane} as React.CSSProperties}
                    aria-label={describe({...row.points.find(point => point.id === dot.id)!, row})}
                    onMouseEnter={() => setActive(dot.id)} onFocus={() => setActive(dot.id)} onClick={() => setActive(dot.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {featured && <div className="sens-row sens-extent" aria-hidden="true">
          <div className="sens-extent-track">
            <span className="sens-extent-line" style={{insetInlineStart: `${min}%`, inlineSize: `${max - min}%`}} />
          </div>
        </div>}
        <div className="sens-row sens-axis" aria-hidden="true">
          <p className="sens-label" />
          <div className="sens-ticks">{TICKS.map(tick => <span key={tick} style={{insetInlineStart: `${tick}%`}}>{tick}%</span>)}</div>
        </div>
        <p className="sens-axis-title">{pt ? 'Redução da melhora do ajuste ao excluir a faixa (%)' : 'Reduction in fit improvement when the range is removed (%)'}</p>
      </div>
      {featured && <ol className="sens-story" role="list" aria-label={pt ? 'Leitura do gráfico' : 'Reading the chart'}>
        <li><strong>{number.format(all.length)}</strong><span>{pt ? 'Execuções públicas' : 'Public runs'}</span></li>
        <li><strong>{number.format(featured.value)}%</strong><span>{featured.row.compilation} · {removed(featured.row)}</span></li>
        <li><strong>{number.format(min)}%–{number.format(max)}%</strong><span>{pt ? 'Menor e maior redução' : 'Lowest and highest reduction'}</span></li>
      </ol>}
      <p className="sens-readout" role="status">
        <span className="viz-swatch" data-series={series.indexOf(selected.row.compilation)} aria-hidden="true" />
        <strong key={selected.id}>{number.format(selected.value)}%</strong>
        <span>{selected.row.compilation} · {removed(selected.row)}</span>
        <Link className="text-link" href={href(locale, '/results/' + selected.slug)} prefetch={false}>
          {pt ? 'Abrir o registro' : 'Open the record'} {selected.id}
        </Link>
      </p>
      <details className="viz-table">
        <summary><span className="disclosure-label">{pt ? 'Ver os dados em tabela' : 'View the data as a table'}</span></summary>
        <div className="viz-table-scroll" tabIndex={0} role="group" aria-label={pt ? 'Tabela de execuções' : 'Table of runs'}>
          <table>
            <caption className="sr-only">{title}</caption>
            <thead><tr>
              <th scope="col">{pt ? 'Compilação' : 'Compilation'}</th>
              <th scope="col">{pt ? 'Faixa excluída' : 'Range removed'}</th>
              <th scope="col">{pt ? 'Redução (%)' : 'Reduction (%)'}</th>
              <th scope="col">{pt ? 'Registro' : 'Record'}</th>
            </tr></thead>
            <tbody>
              {all.map(point => (
                <tr key={point.id}>
                  <td>{point.row.compilation}</td>
                  <td>{range(point.row)}</td>
                  <td>{number.format(point.value)}</td>
                  <td><Link className="text-link" href={href(locale, '/results/' + point.slug)} prefetch={false}>{point.id}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="viz-source">
        {pt
          ? `${all.length} execuções públicas. Cada ponto é o valor-chave publicado para uma execução: o corte que mais reduziu a melhora do ajuste naquela configuração de dados e priors. Os demais cortes de cada execução não constam do snapshot. As execuções não são medições independentes, e a porcentagem não é probabilidade nem significância. `
          : `${all.length} public runs. Each dot is the key figure published for one run: the cut that most reduced the fit improvement in that configuration of data and priors. The other cuts of each run are not in the snapshot. Runs are not independent measurements, and the percentage is neither a probability nor a significance. `}
        <Link className="text-link" href={href(locale, '/data')} prefetch={false}>{pt ? 'Fonte: snapshot público da Tower' : 'Source: Tower public snapshot'}</Link>
      </p>
    </figure>
  );
}
