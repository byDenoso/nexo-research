import Link from 'next/link';
import {notFound} from 'next/navigation';
import {FamilyFigure} from '@/components/FamilyFigure';
import {StatusBadge} from '@/components/ui';
import {getResults} from '@/lib/data';
import {getFamilies, getFamily} from '@/lib/families';
import {LOCALES, fmtDate, isLocale, pick} from '@/lib/i18n';
import {href, pageMeta} from '@/lib/seo';

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap(locale =>
  getFamilies(getResults()).map(family => ({locale, family: family.slug}))
);

export async function generateMetadata({params}: {params: Promise<{locale: string; family: string}>}) {
  const {locale, family: slug} = await params;
  if (!isLocale(locale)) return {};
  const family = getFamily(getResults(), slug);
  return family ? pageMeta(locale, '/results/families/' + slug, pick(family.title, locale), pick(family.description, locale)) : {};
}

export default async function FamilyPage({params}: {params: Promise<{locale: string; family: string}>}) {
  const {locale, family: slug} = await params;
  if (!isLocale(locale)) notFound();
  const family = getFamily(getResults(), slug);
  if (!family) notFound();
  return (
    <article>
      <header className="record-head">
        <div className="wrap record-head-inner">
          <Link className="text-link record-back" href={href(locale, '/results')}>← {locale === 'pt' ? 'Todas as perguntas' : 'All questions'}</Link>
          <p className="kicker">{locale === 'pt' ? 'Família de investigação' : 'Research family'}</p>
          <h1>{pick(family.title, locale)}</h1>
          <p className="record-status-note">{pick(family.description, locale)}</p>
          <p className="family-subhead">{family.records.length} {locale === 'pt' ?
            (family.records.length === 1 ? 'registro de execução' : 'registros de execução') :
            (family.records.length === 1 ? 'execution record' : 'execution records')} · {locale === 'pt' ? 'Último registro' : 'Latest record'}: {fmtDate(family.updatedAt, locale)}</p>
        </div>
      </header>
      <div className="wrap page-body family-layout">
        <p className="card family-method-note">{locale === 'pt' ?
          'Agrupamento editorial pela pergunta investigada. Cada registro conserva o identificador, os priors, o método, o resultado e o estado originais. Os valores não foram combinados, e a presença de um sinal em uma execução não prova significância global.' :
          'Editorial grouping by research question. Each record preserves its original identifier, priors, method, result and status. Values have not been combined, and a signal in a single run is not a global detection.'}</p>
        <FamilyFigure family={family} locale={locale} />
        <section aria-labelledby="variants-heading">
          <h2 id="variants-heading" className="family-section-title">{locale === 'pt' ? 'Execuções e variações' : 'Runs and variants'}</h2>
          <ol className="family-records">
            {family.records.map(item => (
              <li className="card family-record" key={item.id}>
                <div className="family-record-meta"><span className="font-mono">{item.id}</span><StatusBadge status={item.status} locale={locale} /></div>
                <h3>{pick(item.question, locale)}</h3>
                <p className="family-record-result">{pick(item.result, locale)}</p>
                <div className="family-record-foot">
                  <time dateTime={item.updatedAt}>{fmtDate(item.updatedAt, locale)}</time>
                  <Link className="text-link" href={href(locale, '/results/' + item.slug)}>{locale === 'pt' ? 'Método, limites e proveniência' : 'Method, limits and provenance'}<span className="sr-only"> · {item.id}</span></Link>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
