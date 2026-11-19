import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ResultsBrowser} from '@/components/ResultsBrowser';
import {getResults, getManifest, getPageDates} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale} from '@/lib/i18n';
import {toFamilyRows} from '@/lib/rows';
import {href, pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/results', tr(D.results.title, locale), tr(D.results.lead, locale));
}

export default async function ResultsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results = getResults();
  const rows = toFamilyRows(getFamilies(results), locale);
  const snapshot = getManifest().generatedFrom;
  const editorialDate = getPageDates()['/results']!;

  return (
    <div className="nexo-editorial nx-catalogue">
      <header className="wrap nx-catalogue-head">
        <div>
          <p className="nx-eyebrow">{pt ? 'Descobertas e candidatos' : 'Discoveries and candidates'}</p>
          <h1>{pt ? 'Catálogo de resultados' : 'Results catalogue'}</h1>
          <p>{pt ? 'Encontre uma pergunta científica, compare as execuções da família e consulte os dados de cada ajuste.' : 'Find a research question, compare its family of runs and inspect the data for each fit.'}</p>
        </div>
        <dl>
          <div><dt>{pt ? 'Famílias de testes' : 'Test families'}</dt><dd>{rows.length}</dd></div>
          <div><dt>{pt ? 'Execuções públicas' : 'Public runs'}</dt><dd>{results.length}</dd></div>
          <div><dt>{pt ? 'Versão do catálogo' : 'Catalogue version'}</dt><dd><Link className="text-link" href={href(locale, '/data') + '#snap'}><time dateTime={snapshot.latestUpdate}>{fmtDate(snapshot.latestUpdate, locale)}</time></Link></dd></div>
          <div><dt>{pt ? 'Última revisão editorial' : 'Last editorial revision'}</dt><dd><time dateTime={editorialDate}>{fmtDate(editorialDate, locale)}</time></dd></div>
        </dl>
      </header>
      <div className="wrap nx-catalogue-content">
        <ResultsBrowser rows={rows} locale={locale} />
        <p className="snapshot-disclosure">
          {pt ? 'O estado Candidato indica um resultado interno, sem validação independente. Consulte os ' : 'Candidate marks an internal result without independent validation. See the '}
          <Link className="text-link" href={href(locale, '/methods') + '#result'}>{pt ? 'estados de evidência' : 'evidence statuses'}</Link>.
        </p>
      </div>
    </div>
  );
}
