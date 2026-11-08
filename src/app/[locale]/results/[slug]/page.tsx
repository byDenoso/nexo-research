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

function Block({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 text-[1.05rem]">{children}</div>
    </section>
  );
}

function Figure({item, locale}: {item: Result; locale: Locale}) {
  const figure = item.figure;
  if (!figure) return null;
  const series = figure.series.flatMap(entry => entry.points.map(point => ({label: pick(entry.label, locale), ...point})));
  const fmt = new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 3});
  const unit = figure.y.unit ? ` ${figure.y.unit}` : '';
  return (
    <figure className="card mt-10 p-5">
      <figcaption className="kicker">{tr(D.results.figure, locale)} · {pick(figure.y.label, locale)}</figcaption>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {series.map((point, index) => (
          <li key={index} className="rounded-lg border border-line p-4">
            <p className="font-mono text-3xl font-medium text-accent">{fmt.format(point.y)}{unit}</p>
            {point.low !== undefined && point.high !== undefined && <p className="mt-1 font-mono text-xs text-muted">[{fmt.format(point.low)}, {fmt.format(point.high)}]{unit}</p>}
            <p className="mt-2 text-sm text-muted">{point.label}</p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">{pick(figure.caption, locale)}</p>
      <p className="mt-2 font-mono text-xs text-muted">{tr(D.results.figureSource, locale)}: {pick(figure.source.label, locale)}</p>
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
    [tr(R.model, locale), approval?.model ?? missing], [tr(R.statMethod, locale), approval?.statMethod ?? missing]
  ];
  return (
    <article className="wrap py-12 md:py-16">
      <Link href={href(locale, '/results')} className="text-sm text-accent underline underline-offset-4">← {tr(R.back, locale)}</Link>
      <div className="prose-nx mt-6">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={item.status} locale={locale} />
          <span className="font-mono text-sm text-muted">{item.id}</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-4xl">{pick(item.title, locale)}</h1>
        <p className="mt-3 text-sm text-muted">{item.statusSource === 'default' ? tr(R.defaultNote, locale) : approval?.statusNote ? pick(approval.statusNote, locale) : tr(D.status[item.status].d, locale)}</p>

        <Block title={tr(R.question, locale)}><p>{pick(item.question, locale)}</p></Block>
        <Block title={tr(R.method, locale)}><p>{pick(item.method, locale)}</p></Block>
        <Block title={tr(R.result, locale)}><p>{pick(item.result, locale)}</p></Block>
        <Figure item={item} locale={locale} />
        <Block title={tr(R.answer, locale)}><p>{pick(item.answer, locale)}</p></Block>
        {item.figure && item.figure.limitations.length > 0 && (
          <Block title={tr(R.limits, locale)}><ul>{item.figure.limitations.map((entry, index) => <li key={index} className="mb-2">{pick(entry, locale)}</li>)}</ul></Block>
        )}
        {approval?.plain && <Block title={tr(R.plain, locale)}><p>{pick(approval.plain.summary, locale)}</p><p>{pick(approval.plain.why, locale)}</p></Block>}

        <Block title={tr(R.provenance, locale)}>
          <dl className="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
            {rows.map(([label, value]) => <div key={label} className="contents"><dt className="text-muted">{label}</dt><dd>{value}</dd></div>)}
            <dt className="text-muted">{tr(R.published, locale)}</dt><dd className="font-mono">{item.publishedAt ? fmtDate(item.publishedAt, locale) : '—'}</dd>
            <dt className="text-muted">{tr(R.updated, locale)}</dt><dd className="font-mono">{fmtDate(item.updatedAt, locale)}</dd>
          </dl>
          {approval?.parameters && <ul className="mt-4 font-mono text-sm">{approval.parameters.map(entry => <li key={entry.name}>{entry.name} = {entry.value}</li>)}</ul>}
        </Block>
        {approval?.references && approval.references.length > 0 && (
          <Block title={tr(R.refs, locale)}><ul>{approval.references.map(reference => <li key={reference.label}>{reference.url ? <a href={reference.url} rel="noopener noreferrer">{reference.label}</a> : reference.label}{reference.doi ? ` · doi:${reference.doi}` : ''}{reference.arxiv ? ` · arXiv:${reference.arxiv}` : ''}</li>)}</ul></Block>
        )}
        {approval?.code && approval.code.length > 0 && <Block title={tr(R.code, locale)}><ul>{approval.code.map(entry => <li key={entry.url}><a href={entry.url} rel="noopener noreferrer">{entry.label}</a></li>)}</ul></Block>}
      </div>
    </article>
  );
}
