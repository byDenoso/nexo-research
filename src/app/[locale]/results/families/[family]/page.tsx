import Link from 'next/link';
import {notFound} from 'next/navigation';
import {CatalogueHeading} from '@/components/CatalogueHeading';
import {CatalogueTitle} from '@/components/CatalogueTitle';
import {desiTracerAnchor, desiTracerId} from '@/components/DossierFitComparisons';
import {FamilyFigure} from '@/components/FamilyFigure';
import {D, tr} from '@/lib/dict';
import {familyQuestion, familyEntry, readResult} from '@/lib/editorial';
import {getResults} from '@/lib/data';
import {getFamilies, getFamily, isNamed, pathSlug} from '@/lib/families';
import {LOCALES, fmtDate, isLocale, pick} from '@/lib/i18n';
import {href, pageMeta} from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap(locale =>
  getFamilies(getResults()).map(family => ({locale, family: pathSlug(family, locale)}))
);

export async function generateMetadata({params}: {params: Promise<{locale: string; family: string}>}) {
  const {locale, family: slug} = await params;
  if (!isLocale(locale)) return {};
  const family = getFamily(getResults(), slug);
  const paths = family?.slugs ? {pt: '/results/families/' + family.slugs.pt, en: '/results/families/' + family.slugs.en} : undefined;
  return family ? pageMeta(locale, '/results/families/' + slug, pick(family.title, locale), pick(family.description, locale), paths) : {};
}

export default async function FamilyPage({params}: {params: Promise<{locale: string; family: string}>}) {
  const {locale, family: slug} = await params;
  if (!isLocale(locale)) notFound();
  const family = getFamily(getResults(), slug);
  if (!family) notFound();
  const entry = familyEntry(family), reading = readResult(entry, locale), pt = locale === 'pt';
  return (
    <article>
      <header className="record-head dark-chapter">
        <div className="wrap record-head-inner">
          <Link className="text-link record-back" href={href(locale, '/results')}>← {locale === 'pt' ? 'Todas as perguntas' : 'All questions'}</Link>
          <p className="kicker">{locale === 'pt' ? 'Pergunta científica' : 'Research question'}</p>
          <CatalogueTitle slug={family.slug}><CatalogueHeading title={familyQuestion(family, locale)} /></CatalogueTitle>
          <p className="record-status-note">{pick(family.description, locale)}</p>
          <p className="family-subhead">{family.records.length} {locale === 'pt' ?
            (family.records.length === 1 ? 'registro' : 'registros') :
            (family.records.length === 1 ? 'record' : 'records')} · {locale === 'pt' ? 'Último registro' : 'Latest record'}: {fmtDate(family.updatedAt, locale)}</p>
        </div>
      </header>
      <div className="wrap page-body family-layout">
        <p className="card family-method-note">{locale === 'pt' ?
          'Os testes respondem à mesma pergunta, mas podem adotar dados, priors ou métodos distintos. Cada registro conserva o identificador, os priors, o método, o resultado e o estado originais. Os valores não foram combinados. Um sinal em uma execução não prova significância global.' :
          'Tests address the same question but may use different data, priors or methods. Each record preserves its original identifier, priors, method, result and status. Values have not been combined. A signal in a single run does not establish global significance.'}</p>
        <section className="family-entry"><div><p className="kicker">{pt ? 'Resultado selecionado' : 'Selected result'}</p><h2>{reading.finding}</h2><p>{reading.why}</p><Link className="journal-button" href={href(locale, '/results/'+pathSlug(entry, locale))}>{pt ? 'Consultar análise' : 'Read the analysis'} →</Link></div><div className="visible-limit"><strong>{pt ? 'Limite desta execução' : 'Limit of this run'}</strong><p>{reading.limit}</p><p className="evidence-explained">{tr(D.status[entry.status].d, locale)}</p></div></section>
        <nav className="reading-jumps" aria-label={pt ? 'Nesta família' : 'In this family'}><a href="#family-figure">{pt ? 'Compare os valores' : 'Compare the values'} ↓</a><a href="#variants-heading">{pt ? 'Todas as execuções' : 'All runs'} ↓</a></nav>
        {family.slug === 'bao-tracer-exclusion' && (
          <p><Link className="text-link arrow-link" href={href(locale, '/results/' + desiTracerId.toLowerCase()) + '#' + desiTracerAnchor}>{pt ? 'Comparar o Δχ² após retirar cada traçador do DESI DR2' : 'Compare Δχ² after removing each DESI DR2 tracer'}</Link></p>
        )}
        <div id="family-figure"><FamilyFigure family={family} locale={locale} /></div>
        <section aria-labelledby="variants-heading">
          <h2 id="variants-heading" className="family-section-title">{locale === 'pt' ? 'Execuções e variações' : 'Runs and variants'}</h2>
          <ol className="family-records">
            {family.records.map(item => (
              <li className="card family-record" key={isNamed(item) ? item.slug : item.id}>
                {!isNamed(item) && <div className="family-record-meta"><span className="font-mono">{item.id}</span></div>}
                <h3>{pick(item.question, locale)}</h3>
                <p className="family-record-result">{pick(item.result, locale)}</p>
                <div className="family-record-foot">
                  <time dateTime={item.updatedAt}>{fmtDate(item.updatedAt, locale)}</time>
                  <Link className="text-link" href={href(locale, '/results/' + pathSlug(item, locale))}>{locale === 'pt' ? 'Detalhes da análise' : 'Analysis details'}{!isNamed(item) && <span className="sr-only"> · {item.id}</span>}</Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
