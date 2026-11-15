import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {ResultsBrowser} from '@/components/ResultsBrowser';
import {getResults, getManifest} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {D, tr} from '@/lib/dict';
import {isLocale} from '@/lib/i18n';
import {toFamilyRows} from '@/lib/rows';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/results', tr(D.results.title, locale), tr(D.results.lead, locale));
}

export default async function ResultsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const rows = toFamilyRows(getFamilies(getResults()), locale);
  return (
    <>
      <PageHead kicker={tr(D.nav.results, locale)} title={locale === 'pt' ? 'O que aprendemos ao testar.' : 'What we learn by testing.'} lead={locale === 'pt' ? 'Explore o recorte público por pergunta. Abra uma família para comparar execuções ou siga até um registro para conferir método, limites e fontes.' : 'Explore the public selection by question. Open a family to compare runs, or follow an individual record to its method, limits and sources.'} />
      <div className="wrap page-body">
        <p className="snapshot-disclosure">{locale === 'pt' ? 'Catálogo atualizado em' : 'Catalogue updated on'} {new Intl.DateTimeFormat(locale === 'pt' ? 'pt-BR' : 'en-GB', {dateStyle: 'long', timeZone: 'UTC'}).format(new Date(getManifest().generatedFrom.latestUpdate))}. {locale === 'pt' ? 'Candidato indica resultado interno, ainda sem validação independente. Os estados estão descritos em' : 'Candidate marks an internal result without independent validation yet. Statuses are described in'} <a className="text-link" href={`/${locale}/methods#result`}>{locale === 'pt' ? 'Métodos' : 'Methods'}</a>.</p>
        <ResultsBrowser rows={rows} locale={locale} />
      </div>
    </>
  );
}
