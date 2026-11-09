import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProfile} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/contact', tr(D.contact.title, locale), tr(D.contact.lead, locale));
}

export default async function ContactPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const profile = getProfile();
  const pending = tr(D.who.pending, locale);
  return (
    <>
      <PageHead kicker={tr(D.nav.contact, locale)} title={tr(D.contact.title, locale)} lead={tr(D.contact.lead, locale)} />
      <div className="wrap mt-12 max-w-2xl">
        <dl className="card grid grid-cols-1 gap-x-8 gap-y-1 p-6 sm:grid-cols-[max-content_minmax(0,1fr)] sm:gap-y-3 [&_dd]:mb-3 [&_dd]:break-words sm:[&_dd]:mb-0">
          <dt className="text-muted">{profile.name}</dt><dd>{profile.affiliation}</dd>
          <dt className="text-muted">E-mail</dt>
          <dd>{profile.email ? <a className="text-accent underline underline-offset-4" href={`mailto:${profile.email}`}>{profile.email}</a> : <span className="text-muted">{pending}</span>}</dd>
          <dt className="text-muted">ORCID</dt>
          <dd>{profile.orcid ? <a className="font-mono text-accent underline underline-offset-4" href={`https://orcid.org/${profile.orcid}`} rel="noopener noreferrer">{profile.orcid}</a> : <span className="text-muted">{pending}</span>}</dd>
          <dt className="text-muted">{tr(D.who.profile, locale)}</dt>
          <dd>{profile.profileUrl ? <a className="text-accent underline underline-offset-4" href={profile.profileUrl} rel="noopener noreferrer">{profile.profileUrl}</a> : <span className="text-muted">{pending}</span>}</dd>
        </dl>
        {!profile.email && <p className="mt-6 text-muted">{tr(D.contact.none, locale)}</p>}
      </div>
    </>
  );
}
