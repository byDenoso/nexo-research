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
      <div className="wrap page-body contact-panel">
        <dl className="card contact-card">
          <div><dt>{profile.name}</dt><dd>{profile.affiliation}</dd></div>
          <div>
            <dt>E-mail</dt>
            <dd>{profile.email ? <a className="text-link" href={`mailto:${profile.email}`}>{profile.email}</a> : <span className="text-muted">{pending}</span>}</dd>
          </div>
          <div>
            <dt>ORCID</dt>
            <dd>{profile.orcid ? <a className="text-link font-mono" href={`https://orcid.org/${profile.orcid}`} rel="noopener noreferrer">{profile.orcid}</a> : <span className="text-muted">{pending}</span>}</dd>
          </div>
          <div>
            <dt>{tr(D.who.profile, locale)}</dt>
            <dd>{profile.profileUrl ? <a className="text-link" href={profile.profileUrl} rel="noopener noreferrer">{profile.profileUrl}</a> : <span className="text-muted">{pending}</span>}</dd>
          </div>
        </dl>
        {!profile.email && <p className="mt-6 text-muted">{tr(D.contact.none, locale)}</p>}
      </div>
    </>
  );
}
