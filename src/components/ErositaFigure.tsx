import Link from 'next/link';
import {pairOf} from './PairChart';
import {ErositaPlot} from './ErositaPlot';
import {type Locale} from '@/lib/i18n';
import type {Result} from '@/lib/schemas';
import {href} from '@/lib/seo';

export const erositaId = 'T-0e94e9e2951b';

export function ErositaFigure({item, locale}: {item: Result; locale: Locale}) {
  const pair = pairOf(item);
  if (!pair) return null;
  const pt = locale === 'pt';
  const labels = pt
    ? ['Todos os intervalos', 'Sem o intervalo mais distante']
    : ['All bins', 'Without the highest-redshift bin'];
  const title = pt ? 'Significância nominal da inclinação de S₈' : 'Nominal significance of the S₈ slope';
  const format = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 2});
  const rows = pair.values.map((value, index) => ({label: labels[index]!, value, text: format.format(value) + ' σ'}));

  return (
    <figure className="nx-fit-figure" aria-labelledby="erosita-figure-title">
      <figcaption id="erosita-figure-title" className="nx-fit-title">{title}</figcaption>
      <div className="nx-fit-layout">
        <ErositaPlot rows={rows} locale={locale} />
        <div>
          <table className="nx-fit-table">
            <caption className="sr-only">{title}</caption>
            <thead><tr><th scope="col">{pt ? 'Ajuste' : 'Fit'}</th><th scope="col">σ</th></tr></thead>
            <tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{format.format(row.value)}</td></tr>)}</tbody>
          </table>
          <p className="nx-fit-sources">{pt ? 'Fonte dos valores' : 'Source of the values'} · <Link className="text-link" href={href(locale, '/results/' + item.slug)}>{item.id}</Link> · <a className="text-link" href="/atlas-public.json">atlas-public.json</a></p>
        </div>
      </div>
    </figure>
  );
}
