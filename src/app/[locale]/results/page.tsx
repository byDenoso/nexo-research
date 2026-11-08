import {notFound} from 'next/navigation';
import {Suspense} from 'react';
import {PageHead} from '@/components/ui';
import {ResultsBrowser} from '@/components/ResultsBrowser';
import {getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale, type Locale} from '@/lib/i18n';
import {toRows} from '@/lib/rows';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/results', tr(D.results.title, locale), tr(D.results.lead, locale));
}

export default async function ResultsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const rows = toRows(getResults(), locale as Locale);
  return (
    <>
      <PageHead kicker={tr(D.nav.results, locale)} title={tr(D.results.title, locale)} lead={tr(D.results.lead, locale)} />
      <div className="wrap mt-10">
        <Suspense fallback={null}><ResultsBrowser rows={rows} locale={locale} /></Suspense>
      </div>
    </>
  );
}
