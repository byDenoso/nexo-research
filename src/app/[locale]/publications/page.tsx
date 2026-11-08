import {notFound} from 'next/navigation';
import {BibtexButton} from '@/components/Bibtex';
import {PageHead} from '@/components/ui';
import {getPublications, toBibtex} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale, pick} from '@/lib/i18n';
import {SITE_URL, pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/publications', tr(D.pubs.title, locale), tr(D.pubs.lead, locale));
}

export default async function PublicationsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const publications = getPublications();
  const jsonLd = publications.map(pub => ({
    '@context': 'https://schema.org', '@type': 'ScholarlyArticle', headline: pub.title, author: pub.authors.map(name => ({'@type': 'Person', name})),
    datePublished: pub.date, abstract: pick(pub.abstract, locale), url: `${SITE_URL}/${locale}/publications#${pub.id}`,
    ...(pub.doi ? {sameAs: [`https://doi.org/${pub.doi}`]} : {})
  }));
  return (
    <>
      <PageHead kicker={tr(D.nav.publications, locale)} title={tr(D.pubs.title, locale)} lead={tr(D.pubs.lead, locale)} />
      <div className="wrap mt-12">
        {publications.length === 0 ? <p className="card p-6 text-muted">{tr(D.pubs.empty, locale)}</p> : (
          <ul className="grid gap-4">
            {publications.map(pub => (
              <li key={pub.id} id={pub.id} className="card scroll-mt-24 p-6">
                <p className="font-mono text-xs text-muted">{tr(D.pubState[pub.state], locale)} · {pub.date}{pub.venue ? ` · ${pub.venue}` : ''}</p>
                <h2 className="mt-2 text-xl font-semibold">{pub.title}</h2>
                <p className="mt-1 text-sm text-muted">{pub.authors.join(', ')}</p>
                <p className="mt-3">{pick(pub.abstract, locale)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                  {pub.doi && <a className="text-accent underline underline-offset-4" href={`https://doi.org/${pub.doi}`} rel="noopener noreferrer">DOI</a>}
                  {pub.arxiv && <a className="text-accent underline underline-offset-4" href={`https://arxiv.org/abs/${pub.arxiv}`} rel="noopener noreferrer">arXiv</a>}
                  {pub.pdf && <a className="text-accent underline underline-offset-4" href={pub.pdf} rel="noopener noreferrer">{tr(D.pubs.pdf, locale)}</a>}
                  <BibtexButton bibtex={toBibtex(pub)} label={tr(D.pubs.bibtex, locale)} done={tr(D.pubs.copied, locale)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {jsonLd.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}} />}
    </>
  );
}
