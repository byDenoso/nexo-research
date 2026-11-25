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
          <p className="nx-eyebrow">{pt ? 'Testes e análises' : 'Tests and analyses'}</p>
          <h1>{pt ? 'Catálogo de resultados' : 'Results catalogue'}</h1>
          <p>{pt ? 'Os resultados estão agrupados por pergunta científica, com os dados, as condições de cada análise e o estado da evidência.' : 'Results are grouped by research question, with the data, analysis conditions and evidence status.'}</p>
        </div>
        <dl>
          <div><dt>{pt ? 'Perguntas científicas' : 'Research questions'}</dt><dd>{rows.length}</dd></div>
          <div><dt>{pt ? 'Registros públicos' : 'Public records'}</dt><dd>{results.length}</dd></div>
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
