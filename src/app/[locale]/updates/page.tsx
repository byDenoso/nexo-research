import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead, StatusBadge} from '@/components/ui';
import {getManifest, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale, pick} from '@/lib/i18n';
import {href, pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/updates', tr(D.updates.title, locale), tr(D.updates.lead, locale));
}

export default async function UpdatesPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const latest = getManifest().generatedFrom.latestUpdate;
  const byDay = new Map<string, ReturnType<typeof getResults>>();
  for (const item of getResults()) byDay.set(item.updatedAt.slice(0, 10), [...(byDay.get(item.updatedAt.slice(0, 10)) ?? []), item]);
  return (
    <>
      <PageHead kicker={tr(D.nav.updates, locale)} title={tr(D.updates.title, locale)} lead={tr(D.updates.lead, locale)} />
      <div className="wrap mt-10">
        <p className="font-mono text-sm text-muted">{tr(D.updates.latest, locale)}: {fmtDate(latest, locale)}</p>
        <div className="mt-6 grid gap-8">
          {[...byDay.entries()].map(([day, items]) => (
            <section key={day} aria-label={fmtDate(`${day}T00:00:00Z`, locale)}>
              <h2 className="font-mono text-sm text-accent">{fmtDate(`${day}T00:00:00Z`, locale)} · {items.length}</h2>
              <ul className="card mt-3 divide-y divide-line">
                {items.map(item => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                    <StatusBadge status={item.status} locale={locale} />
                    <Link href={href(locale, `/results/${item.slug}`)} className="min-w-0 flex-1 hover:text-accent">{pick(item.title, locale)}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
