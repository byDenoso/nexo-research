import Link from 'next/link';
import {notFound} from 'next/navigation';
import {LOCALES, fmtDate, isLocale, pick, type Locale} from '@/lib/i18n';
import {StatusBadge} from '@/components/ui';
import {getResult, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {href, pageMeta} from '@/lib/seo';
import type {Result} from '@/lib/schemas';

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap(locale => getResults().map(item => ({locale, slug: item.slug})));

export async function generateMetadata({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params;
  const item = getResult(slug);
  if (!isLocale(locale) || !item) return {};
  return pageMeta(locale, `/results/${slug}`, pick(item.title, locale), pick(item.result, locale).slice(0, 200));
}

function Block({title, children, className = ''}: {title: string; children: React.ReactNode; className?: string}) {
  return (
    <section className={`record-block ${className}`}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Figure({item, locale}: {item: Result; locale: Locale}) {
  const figure = item.figure;
  if (!figure) return null;
  const series = figure.series.flatMap(entry => entry.points.map(point => ({label: pick(entry.label, locale), ...point})));
  if (!series.length) return null;
  const fmt = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 3});
  const unit = figure.y.unit ? ` ${figure.y.unit}` : '';
  return (
    <figure className="record-figure">
      <figcaption>
        <p className="kicker">{tr(D.results.figure, locale)}</p>
        <p className="record-figure-label">{pick(figure.y.label, locale)}</p>
      </figcaption>
      <ul className="record-values" role="list">
        {series.map((point, index) => (
          <li key={index}>
            <p className="record-value">{fmt.format(point.y)}{unit}</p>
            {point.low !== undefined && point.high !== undefined && <p className="record-interval">[{fmt.format(point.low)}, {fmt.format(point.high)}]{unit}</p>}
            <p className="record-point-label">{point.label}</p>
          </li>
        ))}
      </ul>
      <p className="record-figure-caption">{pick(figure.caption, locale)}</p>
      <p className="record-source">{tr(D.results.figureSource, locale)}: {pick(figure.source.label, locale)}</p>
    </figure>
  );
}

export default async function ResultPage({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params;
  const item = getResult(slug);
  if (!isLocale(locale) || !item) notFound();
  const R = D.results;
  const approval = item.approval;
  const missing = <span className="text-muted">{tr(R.notInSummary, locale)}</span>;
  const rows: Array<[string, React.ReactNode]> = [
    [tr(R.dataset, locale), approval?.dataset ?? missing], [tr(R.dataVersion, locale), approval?.dataVersion ?? missing],
    [tr(R.model, locale), approval?.model ?? missing], [tr(R.statMethod, locale), approval?.statMethod ?? missing],
    [tr(R.publicRecordDate, locale), item.publishedAt ? <time dateTime={item.publishedAt}>{fmtDate(item.publishedAt, locale)}</time> : '—'],
    [tr(R.updated, locale), <time dateTime={item.updatedAt}>{fmtDate(item.updatedAt, locale)}</time>]
  ];
  return (
    <article>
      <header className="record-head">
        <div className="wrap record-head-inner">
          <Link href={href(locale, '/results')} prefetch={false} className="text-link record-back">← {tr(R.back, locale)}</Link>
          <div className="record-meta">
            <StatusBadge status={item.status} locale={locale} />
            <span>{item.id}</span>
          </div>
          <h1>{pick(item.title, locale)}</h1>
          <p className="record-status-note">{item.statusSource === 'default' ? tr(R.defaultNote, locale) : approval?.statusNote ? pick(approval.statusNote, locale) : tr(D.status[item.status].d, locale)}</p>
        </div>
      </header>
      <div className="wrap page-body record-layout">
        <div className="record-reading">
          <Block title={tr(R.question, locale)}><p>{pick(item.question, locale)}</p></Block>
          <Block title={tr(R.method, locale)}><p>{pick(item.method, locale)}</p></Block>
          <div className="card record-evidence">
            <Block title={tr(R.result, locale)}><p>{pick(item.result, locale)}</p></Block>
            <Figure item={item} locale={locale} />
            {item.figure && item.figure.limitations.length > 0 && (
              <Block className="record-limits" title={tr(R.limits, locale)}><ul>{item.figure.limitations.map((entry, index) => <li key={index}>{pick(entry, locale)}</li>)}</ul></Block>
            )}
          </div>
          <Block title={tr(R.answer, locale)}><p>{pick(item.answer, locale)}</p></Block>
          {approval?.plain && <Block title={tr(R.plain, locale)}><p>{pick(approval.plain.summary, locale)}</p><p>{pick(approval.plain.why, locale)}</p></Block>}
          {approval?.references && approval.references.length > 0 && (
            <Block title={tr(R.refs, locale)}><ul>{approval.references.map(reference => <li key={reference.label}>{reference.url ? <a className="text-link" href={reference.url} rel="noopener noreferrer">{reference.label}</a> : reference.label}{reference.doi ? ` · doi:${reference.doi}` : ''}{reference.arxiv ? ` · arXiv:${reference.arxiv}` : ''}</li>)}</ul></Block>
          )}
          {approval?.code && approval.code.length > 0 && <Block title={tr(R.code, locale)}><ul>{approval.code.map(entry => <li key={entry.url}><a className="text-link" href={entry.url} rel="noopener noreferrer">{entry.label}</a></li>)}</ul></Block>}
        </div>
        <aside className="card record-provenance" aria-labelledby="record-provenance-title">
          <h2 id="record-provenance-title">{tr(R.provenance, locale)}</h2>
          <dl>
            {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          {approval?.parameters && approval.parameters.length > 0 && (
            <>
              <h3>{tr(R.params, locale)}</h3>
              <ul role="list">{approval.parameters.map(entry => <li key={entry.name}>{entry.name} = {entry.value}</li>)}</ul>
            </>
          )}
          <Link href={href(locale, '/data')} prefetch={false} className="text-link arrow-link">{tr(D.data.title, locale)}</Link>
        </aside>
      </div>
    </article>
  );
}
