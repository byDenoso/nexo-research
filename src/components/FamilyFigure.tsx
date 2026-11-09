import Link from 'next/link';
import type {Family} from '@/lib/families';
import {pick, type Locale} from '@/lib/i18n';
import {href} from '@/lib/seo';

// Display only genuinely supplied scalar values sharing a measured quantity.
// This is a plot of source records, not a combined inference or significance.
export function FamilyFigure({family, locale}: {family: Family; locale: Locale}) {
  const points = family.records.flatMap(item => {
    const figure = item.figure;
    if (!figure || figure.series.length !== 1 || figure.series[0]!.points.length !== 1) return [];
    const value = figure.series[0]!.points[0]!.y;
    if (!Number.isFinite(value) || value < 0) return [];
    return [{item, figure, value, label: pick(figure.series[0]!.label, locale)}];
  });
  if (points.length < 2) return null;
  const first = points[0]!.figure.y;
  const same = points.filter(point => point.figure.y.label.en === first.label.en && point.figure.y.unit === first.unit);
  if (same.length < 2) return null;
  const selected = same.slice(0, 8);
  const max = Math.max(...selected.map(point => point.value));
  if (max <= 0) return null;
  const fmt = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 3});
  return (
    <figure className="card family-figure">
      <figcaption>
        <h2>{pick(first.label, locale)}</h2>
        <p>{locale === 'pt' ?
          'Valores de figuras do manifesto, por execução. Amostra em ordem do registro, sem combinação estatística; condições e priors podem diferir.' :
          'Values from manifest figures, by run. Sample in record order, without statistical combination; conditions and priors may differ.'}</p>
      </figcaption>
      <ul role="list" className="family-chart-rows">
        {selected.map(({item, value, label}) => (
          <li key={item.id}>
            <Link href={href(locale, '/results/' + item.slug)} className="family-chart-label">{label}</Link>
            <div className="family-chart-track" aria-hidden="true"><span style={{width: String(100 * value / max) + '%'}} /></div>
            <span className="family-chart-value">{fmt.format(value)}{first.unit ? ' ' + first.unit : ''}</span>
          </li>
        ))}
      </ul>
      <p className="family-chart-note">{locale === 'pt' ?
        'Clique em cada configuração para consultar método, fonte e limitações. O gráfico não indica detecção global.' :
        'Open each configuration for its method, source and limitations. The chart does not indicate a global detection.'}</p>
    </figure>
  );
}
