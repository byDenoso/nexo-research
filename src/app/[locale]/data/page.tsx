import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {datasetMentions, getManifest, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale} from '@/lib/i18n';
import {datasetMentionId, pageMeta} from '@/lib/seo';

export async function generateMetadata({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/data', tr(D.data.title, locale), tr(D.data.lead, locale));
}

export default async function DataPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const source = getManifest().generatedFrom;
  const mentions = datasetMentions(getResults());
  const d = D.data;
  return (
    <>
      <PageHead kicker={tr(D.nav.data, locale)} title={tr(d.title, locale)} lead={tr(d.lead, locale)} />
      <div className="wrap mt-12 grid gap-10">
        <section aria-labelledby="snap" className="card motion-reveal p-6">
          <h2 id="snap" className="text-xl font-semibold">{tr(d.snapshot, locale)}</h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-[max-content_minmax(0,1fr)] sm:gap-y-2 [&_dd]:mb-3 sm:[&_dd]:mb-0">
            <dt className="text-muted">{tr(d.contract, locale)}</dt><dd className="font-mono">{source.contract}</dd>
            <dt className="text-muted">{tr(d.tests, locale)}</dt><dd className="font-mono">{source.tests}</dd>
            <dt className="text-muted">{tr(d.visuals, locale)}</dt><dd className="font-mono">{source.visuals}</dd>
            <dt className="text-muted">{tr(D.updates.latest, locale)}</dt><dd className="font-mono">{fmtDate(source.latestUpdate, locale)}</dd>
            <dt className="text-muted">{tr(d.sha, locale)}</dt><dd className="break-all font-mono text-xs">{source.snapshotSha256}</dd>
          </dl>
          <p className="mt-4 text-sm text-muted">{tr(d.private, locale)}</p>
        </section>
        <section aria-labelledby="mentioned">
          <h2 id="mentioned" className="motion-reveal text-xl font-semibold">{tr(d.mentioned, locale)}</h2>
          <table className="card mt-4 w-full text-left text-sm">
            <caption className="sr-only">{tr(d.mentioned, locale)}</caption>
            <thead><tr className="border-b border-line"><th scope="col" className="p-3 font-medium">Dataset</th><th scope="col" className="p-3 font-medium">{tr(d.count, locale)}</th></tr></thead>
            <tbody>{mentions.map(entry => (
              <tr key={entry.name} id={datasetMentionId(entry.name)} tabIndex={-1} className="data-mention border-t border-line">
                <th scope="row" className="p-3 font-normal"><span className="data-mention-name">{entry.name}</span></th>
                <td className="p-3 font-mono">{entry.count}</td>
              </tr>
            ))}</tbody>
          </table>
          <p className="mt-3 text-sm text-muted">{tr(d.note, locale)}</p>
        </section>
      </div>
    </>
  );
}
