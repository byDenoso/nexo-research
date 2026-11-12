import Link from 'next/link';
import {notFound} from 'next/navigation';
import {BibtexButton} from '@/components/Bibtex';
import {DataSequence} from '@/components/EditorialFigures';
import {PageHead} from '@/components/ui';
import {datasetMentions, getManifest, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {fmtDate, isLocale} from '@/lib/i18n';
import {SITE_URL, datasetMentionId, href, pageMeta} from '@/lib/seo';

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
  const pt = locale === 'pt';
  const day = source.latestUpdate.slice(0, 10), year = day.slice(0, 4);
  const file = `${SITE_URL}/atlas-public.json`;
  const citation = pt
    ? `NEXO Research Institute (${year}). Catálogo público de testes cosmológicos, snapshot de ${fmtDate(source.latestUpdate, locale)}. SHA-256 ${source.snapshotSha256}. ${file}`
    : `NEXO Research Institute (${year}). Public catalogue of cosmological tests, snapshot of ${fmtDate(source.latestUpdate, locale)}. SHA-256 ${source.snapshotSha256}. ${file}`;
  const bibtex = `@misc{nexo${year}catalogue,
  author = {{NEXO Research Institute}},
  title = {Public catalogue of cosmological tests},
  year = {${year}},
  note = {Snapshot of ${day}, SHA-256 ${source.snapshotSha256}},
  howpublished = {\\url{${file}}}
}`;
  return (
    <>
      <PageHead kicker={tr(D.nav.data, locale)} title={tr(d.title, locale)} lead={tr(d.lead, locale)} />
      <div className="wrap mt-12 grid gap-10">
        <DataSequence locale={locale} />
        <section className="source-access-section motion-reveal" aria-labelledby="public-sources">
          <div><p className="kicker">{locale === 'pt' ? 'Arquivos científicos' : 'Scientific archives'}</p><h2 id="public-sources">{locale === 'pt' ? 'Fontes de dados e software' : 'Data sources and software'}</h2><p>{locale === 'pt' ? 'Acesse os arquivos originais das colaborações e o código público do NEXO. Uma menção no manifesto não constitui prova de utilização de um release específico.' : 'Access original collaboration archives and NEXO public code. A mention in the manifest is not proof that a particular release was used.'}</p></div>
          <ul>
            <li><a href="https://data.desi.lbl.gov/doc/releases/" target="_blank" rel="noopener noreferrer">DESI · {locale === 'pt' ? 'Dados e documentação' : 'Data and documentation'} ↗</a></li>
            <li><a href="https://github.com/PantheonPlusSH0ES/DataRelease" target="_blank" rel="noopener noreferrer">Pantheon+ · {locale === 'pt' ? 'Release público' : 'Public release'} ↗</a></li>
            <li><a href="https://archive.stsci.edu/" target="_blank" rel="noopener noreferrer">MAST · {locale === 'pt' ? 'Arquivo espacial' : 'Space telescope archive'} ↗</a></li>
            <li><Link href={href(locale, '/code')}>NEXO Research Institute · {locale === 'pt' ? 'Validador e código do site' : 'Validator and site source'}</Link></li>
          </ul>
        </section>
        <section aria-labelledby="snap" className="card motion-reveal p-6">
          <h2 id="snap" className="text-xl font-semibold">{tr(d.snapshot, locale)}</h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-1 text-sm sm:grid-cols-[max-content_minmax(0,1fr)] sm:gap-y-2 [&_dd]:mb-3 sm:[&_dd]:mb-0">
            <dt className="text-muted">{tr(d.contract, locale)}</dt><dd className="font-mono">{source.contract}</dd>
            <dt className="text-muted">{tr(d.tests, locale)}</dt><dd className="font-mono">{source.tests}</dd>
            <dt className="text-muted">{tr(d.visuals, locale)}</dt><dd className="font-mono">{source.visuals}</dd>
            <dt className="text-muted">{tr(D.updates.latest, locale)}</dt><dd className="font-mono">{fmtDate(source.latestUpdate, locale)}</dd>
            <dt className="text-muted">{tr(d.sha, locale)}</dt><dd className="break-all font-mono text-xs">{source.snapshotSha256}</dd>
          </dl>
          <p className="mt-4"><a className="text-link" href="/atlas-public.json" download>{pt ? 'Baixar o snapshot (JSON)' : 'Download the snapshot (JSON)'}</a></p>
          <p className="mt-4 text-sm text-muted">{tr(d.private, locale)}</p>
        </section>
        <section id="cite" aria-labelledby="cite-h" className="card p-6 inst-cite">
          <h2 id="cite-h" className="text-xl font-semibold">{pt ? 'Como citar' : 'How to cite'}</h2>
          <p className="mt-3">{pt ? 'Para citar o catálogo, use a data e o hash do snapshot. Para citar um resultado, acrescente o identificador do registro, por exemplo T-05ae703af393.' : 'To cite the catalogue, use the snapshot date and hash. To cite one result, add the record identifier, for example T-05ae703af393.'}</p>
          <p className="inst-citation">{citation}</p>
          <BibtexButton bibtex={bibtex} label={tr(D.pubs.bibtex, locale)} done={tr(D.pubs.copied, locale)} />
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
