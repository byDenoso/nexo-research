import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getProfile} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale} from '@/lib/i18n';
import {pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/code', tr(D.code.title, locale), tr(D.code.lead, locale));
}

export default async function CodePage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const repositories = getProfile().repositories;
  return (
    <>
      <PageHead kicker={tr(D.nav.code, locale)} title={tr(D.code.title, locale)} lead={tr(D.code.lead, locale)} />
      <div className="wrap mt-12 grid gap-4">
        {repositories.map(repo => (
          <a key={repo.url} href={repo.url} rel="noopener noreferrer" className="card motion-reveal block p-6 hover:border-accent focus-visible:border-accent">
            <h2 className="text-xl font-semibold">{repo.label}</h2>
            {repo.description && <p className="mt-1 text-muted">{repo.description}</p>}
            <p className="mt-3 break-all font-mono text-sm text-accent">{repo.url}</p>
          </a>
        ))}
        {repositories.length === 0
          ? <p className="card motion-reveal p-6 text-muted">{tr(D.code.none, locale)}</p>
          : <p className="text-muted">{tr(D.code.partial, locale)}</p>}
      </div>
    </>
  );
}
