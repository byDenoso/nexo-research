import Link from 'next/link';
import {notFound} from 'next/navigation';
import {LOCALES, fmtDate, isLocale, pick, type Locale} from '@/lib/i18n';
import {PairChart, pairOf} from '@/components/PairChart';
import {SensitivityChart} from '@/components/SensitivityChart';
import {StatusBadge} from '@/components/ui';
import {DATASETS, getDossier, getManifest, getResult, getResults} from '@/lib/data';
import {familyFor} from '@/lib/families';
import {scientificText, sameText} from '@/lib/format';
import {D, tr} from '@/lib/dict';
import {href, pageMeta} from '@/lib/seo';
import {compilations, sensitivityPoints, sensitivityRows} from '@/lib/sensitivity';
import type {Result} from '@/lib/schemas';

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap(locale => getResults().map(item => ({locale, slug: item.slug})));

export async function generateMetadata({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params;
  const item = getResult(slug);
  if (!isLocale(locale) || !item) return {};
  return pageMeta(locale, `/results/${slug}`, pick(item.title, locale), pick(item.result, locale).slice(0, 200));
}

function Block({id, title, children, className = ''}: {id?: string; title: string; children: React.ReactNode; className?: string}) {
  return (
    <section id={id} className={`record-block ${className}`}>
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
        {!pairOf(item) && <p className="record-figure-label">{pick(figure.y.label, locale)}</p>}
      </figcaption>
      {pairOf(item) ? <PairChart item={item} locale={locale} /> : (
        <ul className="record-values" role="list">
          {series.map((point, index) => (
            <li key={index}>
              <p className="record-value">{fmt.format(point.y)}{unit}</p>
              {point.low !== undefined && point.high !== undefined && <p className="record-interval">[{fmt.format(point.low)}, {fmt.format(point.high)}]{unit}</p>}
              <p className="record-point-label">{scientificText(point.label, locale)}</p>
            </li>
          ))}
        </ul>
      )}
      {!sameText(pick(figure.caption, locale), pick(item.result, locale)) && <p className="record-figure-caption">{scientificText(pick(figure.caption, locale), locale)}</p>}
      <p className="record-source">{tr(D.results.figureSource, locale)}: <Link className="text-link" href={href(locale, '/data')}>{locale === 'pt' ? 'Snapshot público da Tower' : 'Tower public snapshot'}</Link></p>
    </figure>
  );
}

export default async function ResultPage({params}: {params: Promise<{locale: string; slug: string}>}) {
  const {locale, slug} = await params;
  const item = getResult(slug);
  if (!isLocale(locale) || !item) notFound();
  const R = D.results;
  const approval = item.approval;
  const family = familyFor(getResults(), item);
  const interpretation = pick(item.answer, locale);
  const duplicated = sameText(interpretation, pick(item.result, locale)) ||
    (item.figure?.limitations ?? []).some(limit => sameText(interpretation, pick(limit, locale)));
  const pt = locale === 'pt';
  const strip = sensitivityPoints(getResults());
  const inStrip = strip.some(point => point.id === item.id);
  const dossier = getDossier(item.id);
  const snapshot = getManifest().generatedFrom;
  const mentioned = DATASETS.filter(([, pattern]) => pattern.test(`${item.question.en} ${item.method.en} ${item.result.en}`)).map(([name]) => name);
  const missing = pt ? 'Não consta no resumo público.' : 'Not stated in the public summary.';
  const limitCount = item.figure?.limitations.length ?? 0;
  const rows: Array<[string, React.ReactNode]> = [
    ...(approval?.dataset ? [[tr(R.dataset, locale), approval.dataset] as [string, React.ReactNode]] : []),
    ...(approval?.dataVersion ? [[tr(R.dataVersion, locale), approval.dataVersion] as [string, React.ReactNode]] : []),
    ...(approval?.model ? [[tr(R.model, locale), approval.model] as [string, React.ReactNode]] : []),
    ...(approval?.statMethod ? [[tr(R.statMethod, locale), approval.statMethod] as [string, React.ReactNode]] : []),
    ...(item.publishedAt ? [[tr(R.publicRecordDate, locale), <time dateTime={item.publishedAt}>{fmtDate(item.publishedAt, locale)}</time>] as [string, React.ReactNode]] : []),
    [tr(R.updated, locale), <time dateTime={item.updatedAt}>{fmtDate(item.updatedAt, locale)}</time>]
  ];
  return (
    <article>
      <header className="record-head">
        <div className="wrap record-head-inner">
          <Link href={href(locale, family ? '/results/families/' + family.slug : '/results')} prefetch={false} className="text-link record-back">← {locale === 'pt' ? 'Voltar à pergunta científica' : 'Back to research question'}</Link>
          <div className="record-meta">
            <StatusBadge status={item.status} locale={locale} />
            <span>{item.id}</span>
          </div>
          <h1>{family ? pick(family.title, locale) : pick(item.question, locale)}</h1>
          {family && family.records.length > 1 && <p className="family-subhead">{locale === 'pt' ? 'Execução individual' : 'Individual run'} · {item.id}</p>}
          {item.statusSource !== 'default' && <p className="record-status-note">{approval?.statusNote ? pick(approval.statusNote, locale) : tr(D.status[item.status].d, locale)}</p>}
        </div>
      </header>
      <div className="wrap page-body record-layout">
        <div className="record-reading">
          <Block id="question" title={tr(R.question, locale)}><p>{scientificText(pick(item.question, locale), locale)}</p></Block>
          <Block id="method" title={tr(R.method, locale)}>
            <p>{scientificText(pick(dossier?.method ?? item.method, locale), locale)}</p>
            {dossier?.corrections?.map(entry => (
              <p key={entry.date} className="record-correction"><strong>{pt ? 'Correção de' : 'Correction of'} <time dateTime={entry.date}>{fmtDate(entry.date, locale)}</time>.</strong> {scientificText(pick(entry.note, locale), locale)}</p>
            ))}
          </Block>
          <div className="card record-evidence">
            <Block id="result" title={tr(R.result, locale)}><p>{scientificText(pick(item.result, locale), locale)}</p></Block>
            <Figure item={item} locale={locale} />
            {item.figure && item.figure.limitations.length > 0 && (
              <Block id="limits" className="record-limits" title={tr(R.limits, locale)}><ul>{item.figure.limitations.map((entry, index) => <li key={index}>{scientificText(pick(entry, locale), locale)}</li>)}</ul></Block>
            )}
          </div>
          {dossier?.rerun && (
            <Block id="rerun" title={pt ? 'Reexecução do código publicado' : 'Rerun of the published code'}>
              <p>{pt ? 'Valores obtidos ao rodar novamente o script em' : 'Values returned when the script was run again on'} <time dateTime={dossier.rerun.date}>{fmtDate(dossier.rerun.date, locale)}</time>.</p>
              <table className="record-rerun">
                <thead><tr><th scope="col">{pt ? 'Ajuste' : 'Fit'}</th><th scope="col">{pt ? 'Valor' : 'Value'}</th></tr></thead>
                <tbody>{dossier.rerun.values.map((entry, index) => <tr key={index}><th scope="row">{scientificText(pick(entry.label, locale), locale)}</th><td>{pick(entry.value, locale)}</td></tr>)}</tbody>
              </table>
            </Block>
          )}
          {inStrip && (
            <SensitivityChart
              rows={sensitivityRows(strip)} series={compilations(strip)} locale={locale} highlight={item.id}
              title={pt ? 'Esta execução entre as demais execuções públicas' : 'This run among the other public runs'}
              lead={pt ? 'O ponto destacado é este registro. As outras execuções usam outras combinações de dados e priors.' : 'The highlighted dot is this record. The other runs use other combinations of data and priors.'}
            />
          )}
          {!duplicated && <Block title={tr(R.answer, locale)}><p>{scientificText(interpretation, locale)}</p></Block>}
          {approval?.plain && <Block title={tr(R.plain, locale)}><p>{scientificText(pick(approval.plain.summary, locale), locale)}</p><p>{scientificText(pick(approval.plain.why, locale), locale)}</p></Block>}
          {approval?.references && approval.references.length > 0 && (
            <Block title={tr(R.refs, locale)}><ul>{approval.references.map(reference => <li key={reference.label}>{reference.url ? <a className="text-link" href={reference.url} rel="noopener noreferrer">{reference.label}</a> : reference.label}{reference.doi ? ` · doi:${reference.doi}` : ''}{reference.arxiv ? ` · arXiv:${reference.arxiv}` : ''}</li>)}</ul></Block>
          )}
          {approval?.code && approval.code.length > 0 && <Block title={tr(R.code, locale)}><ul>{approval.code.map(entry => <li key={entry.url}><a className="text-link" href={entry.url} rel="noopener noreferrer">{entry.label}</a></li>)}</ul></Block>}
        </div>
        <aside className="card record-provenance" aria-labelledby="record-provenance-title">
          <h2 id="record-provenance-title">{pt ? 'Dossiê de verificação' : 'Verification dossier'}</h2>
          <nav className="dossier-index" aria-label={pt ? 'Neste registro' : 'In this record'}>
            <a href="#question">{tr(R.question, locale)}</a>
            <a href="#method">{tr(R.method, locale)}</a>
            <a href="#result">{tr(R.result, locale)}</a>
            {limitCount > 0 && <a href="#limits">{tr(R.limits, locale)} ({limitCount})</a>}
          </nav>
          <dl>
            <div>
              <dt>{pt ? 'Dados usados' : 'Data used'}</dt>
              <dd>
                {dossier ? (
                  <ul role="list" className="dossier-data">
                    {dossier.datasets.map(entry => (
                      <li key={entry.name}>
                        <strong>{entry.name}</strong>
                        <span>{pick(entry.role, locale)}</span>
                        <span>Release: {entry.release ?? missing}</span>
                        {entry.table && <span>{pt ? 'Tabela' : 'Table'}: {entry.table}</span>}
                        {entry.reference && (entry.reference.url
                          ? <a className="text-link" href={entry.reference.url} target="_blank" rel="noopener noreferrer">{entry.reference.label} ↗</a>
                          : <span>{entry.reference.label}</span>)}
                      </li>
                    ))}
                  </ul>
                ) : mentioned.length > 0 ? (
                  <>{mentioned.join(', ')}<span className="dossier-note">{pt ? 'Identificados por menção no resumo; release e tabela não constam.' : 'Identified by mention in the summary; release and table are not stated.'}</span></>
                ) : missing}
              </dd>
            </div>
            <div>
              <dt>{pt ? 'Versão do registro' : 'Record version'}</dt>
              <dd>
                <span className="font-mono">{item.id}</span> · {snapshot.contract}
                <span className="dossier-note">SHA-256 {snapshot.snapshotSha256.slice(0, 12)}… · <a className="text-link" href="/atlas-public.json">atlas-public.json</a></span>
              </dd>
            </div>
            <div>
              <dt>{tr(R.code, locale)}</dt>
              <dd>
                {dossier?.code?.length || dossier?.artefacts?.length ? (
                  <ul role="list" className="dossier-data">
                    {[...(dossier.code ?? []), ...(dossier.artefacts ?? [])].map(entry => <li key={entry.url}><a className="text-link" href={entry.url} target="_blank" rel="noopener noreferrer">{entry.label} ↗</a></li>)}
                  </ul>
                ) : (pt ? 'Ainda não publicados para este registro.' : 'Not yet published for this record.')}
              </dd>
            </div>
            <div>
              <dt>{pt ? 'Data da análise' : 'Analysis date'}</dt>
              <dd>{dossier?.analysisDate ? <time dateTime={dossier.analysisDate}>{fmtDate(dossier.analysisDate, locale)}</time> : missing}</dd>
            </div>
            {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          {approval?.parameters && approval.parameters.length > 0 && (
            <>
              <h3>{tr(R.params, locale)}</h3>
              <ul role="list">{approval.parameters.map(entry => <li key={entry.name}>{entry.name} = {scientificText(entry.value, locale)}</li>)}</ul>
            </>
          )}
          <p className="record-provenance-note">{pt
            ? 'Campos sem confirmação na fonte ficam em branco e aparecem como não declarados. Nenhum campo ausente foi inferido.'
            : 'Fields not confirmed against the source are left empty and shown as not stated. No missing field has been inferred.'}</p>
          <Link href={href(locale, '/data')} prefetch={false} className="text-link arrow-link">{tr(D.data.title, locale)}</Link>
        </aside>
      </div>
    </article>
  );
}
