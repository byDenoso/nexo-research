import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {ResultsBrowser} from '@/components/ResultsBrowser';
import {getResults, getManifest} from '@/lib/data';
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
  const latest = getManifest().generatedFrom.latestUpdate;

  return (
    <>
      <PageHead
        kicker={pt ? 'Arquivo público' : 'Public archive'}
        title={pt ? 'Catálogo de resultados' : 'Results catalogue'}
        lead={pt ? 'Explore o recorte público do NEXO por pergunta. Cada família reúne testes com resultados, limites e fontes consultáveis.' : 'Explore NEXO’s public selection by research question. Each family groups tests with results, limits and sources you can inspect.'}
      />
      <div className="catalogue-chapter">
        <div className="wrap catalogue-ribbon">
          <p><strong>{rows.length}</strong> {pt ? 'famílias' : 'families'} <span aria-hidden="true">·</span> <strong>{results.length}</strong> {pt ? 'execuções' : 'runs'}</p>
          <p>{pt ? 'Atualizado em' : 'Updated on'} <time dateTime={latest}>{fmtDate(latest, locale)}</time></p>
          <Link className="text-link arrow-link" href={href(locale, '/resultado-vivo')}>{pt ? 'Comparar sondas em 3D' : 'Compare probes in 3D'}</Link>
        </div>
      </div>
      <div className="wrap page-body">
        <ResultsBrowser rows={rows} locale={locale} />
        <p className="snapshot-disclosure">
          {pt ? 'O estado Candidato indica um resultado interno, sem validação independente. Consulte os ' : 'Candidate marks an internal result without independent validation. See the '}
          <Link className="text-link" href={href(locale, '/methods') + '#result'}>{pt ? 'estados de evidência' : 'evidence statuses'}</Link>.
        </p>
      </div>
    </>
  );
}
