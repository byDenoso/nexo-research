import Link from 'next/link';
import {notFound} from 'next/navigation';
import {FamilyCard, PageHead} from '@/components/ui';
import {getResults} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {D, tr} from '@/lib/dict';
import {LOCALES, isLocale} from '@/lib/i18n';
import {toFamilyRows} from '@/lib/rows';
import {PAGE_SIZE as PAGE} from '@/lib/search';
import {href, pageMeta} from '@/lib/seo';

// Server-rendered continuation of the catalogue, so every family is reachable without
// browser scripts. Page 1 is /results itself; filters stay on that page.
const pageCount = () => Math.max(1, Math.ceil(getFamilies(getResults()).length / PAGE));

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.flatMap(locale =>
  Array.from({length: pageCount() - 1}, (_, index) => ({locale, page: String(index + 2)}))
);

export async function generateMetadata({params}: {params: Promise<{locale: string; page: string}>}) {
  const {locale, page} = await params;
  if (!isLocale(locale)) return {};
  const label = locale === 'pt' ? `página ${page}` : `page ${page}`;
  return pageMeta(locale, `/results/page/${page}`, `${tr(D.results.title, locale)} · ${label}`, tr(D.results.lead, locale));
}

export default async function ResultsPageN({params}: {params: Promise<{locale: string; page: string}>}) {
  const {locale, page} = await params;
  const number = Number(page);
  const total = pageCount();
  if (!isLocale(locale) || !Number.isInteger(number) || number < 2 || number > total) notFound();
  const rows = toFamilyRows(getFamilies(getResults()), locale);
  const shown = rows.slice((number - 1) * PAGE, number * PAGE);
  const target = (value: number) => href(locale, value === 1 ? '/results' : `/results/page/${value}`);
  return (
    <>
      <PageHead kicker={tr(D.nav.results, locale)} title={tr(D.results.title, locale)} lead={tr(D.results.lead, locale)} />
      <div className="wrap page-body">
        <p className="results-count">
          {locale === 'pt'
            ? `Perguntas ${(number - 1) * PAGE + 1}–${(number - 1) * PAGE + shown.length} de ${rows.length} · página ${number} de ${total}`
            : `Questions ${(number - 1) * PAGE + 1}–${(number - 1) * PAGE + shown.length} of ${rows.length} · page ${number} of ${total}`}
        </p>
        <ul className="result-grid" role="list">
          {shown.map(row => <li key={row.slug}><FamilyCard item={row} locale={locale} /></li>)}
        </ul>
        <nav className="results-pages" aria-label={locale === 'pt' ? 'Páginas do catálogo' : 'Catalogue pages'}>
          <Link className="btn" href={target(number - 1)} rel="prev">← {locale === 'pt' ? 'Página anterior' : 'Previous page'}</Link>
          {number < total && <Link className="btn" href={target(number + 1)} rel="next">{locale === 'pt' ? 'Próxima página' : 'Next page'} →</Link>}
          <Link className="text-link" href={href(locale, '/results')}>{locale === 'pt' ? 'Buscar e filtrar o catálogo' : 'Search and filter the catalogue'}</Link>
        </nav>
      </div>
    </>
  );
}
