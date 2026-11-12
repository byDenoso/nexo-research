import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getUpdates} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale, pick} from '@/lib/i18n';
import {href, pageMeta} from '@/lib/seo';

const kinds = {
  catalogue: {pt: 'Catálogo', en: 'Catalogue'},
  software: {pt: 'Software', en: 'Software'},
  site: {pt: 'Site', en: 'Website'}
} as const;

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  return isLocale(locale) ? pageMeta(locale, '/updates', tr(D.updates.title, locale), tr(D.updates.lead, locale)) : {};
}

export default async function UpdatesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  return <>
    <PageHead kicker={tr(D.nav.updates, locale)} title={tr(D.updates.title, locale)} lead={tr(D.updates.lead, locale)} />
    <div className="wrap page-body inst-page">
      <ol className="inst-log" role="list">
        {getUpdates().map(entry => (
          <li key={entry.date + entry.title.en}>
            <p className="inst-label"><time dateTime={entry.date}>{fmtDate(entry.date, locale)}</time> · {kinds[entry.kind][locale]}</p>
            <h2>{pick(entry.title, locale)}</h2>
            <p>{pick(entry.body, locale)}</p>
            {entry.url && <p><a className="text-link" href={entry.url} target="_blank" rel="noopener noreferrer">{pt ? 'Ver no repositório' : 'View in the repository'}</a></p>}
          </li>
        ))}
      </ol>
      <p className="inst-note">{pt ? 'Para acompanhar, assine o ' : 'To follow, subscribe to the '}<a className="text-link" href="/feed.xml">{pt ? 'feed de atualizações' : 'updates feed'}</a>.</p>
      <p className="inst-actions"><Link className="text-link" href={href(locale, '/results')}>{pt ? 'Abrir o catálogo' : 'Open the catalogue'}</Link><Link className="text-link" href={href(locale, '/data')}>{pt ? 'Dados e fontes' : 'Data and sources'}</Link></p>
    </div>
  </>;
}
