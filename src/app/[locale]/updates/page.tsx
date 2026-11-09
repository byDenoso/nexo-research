import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PageHead} from '@/components/ui';
import {getManifest,getResults} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {D,tr} from '@/lib/dict';
import {fmtDate,isLocale} from '@/lib/i18n';
import {href,pageMeta} from '@/lib/seo';

export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  return isLocale(locale)?pageMeta(locale,'/updates',tr(D.updates.title,locale),tr(D.updates.lead,locale)):{};
}
export default async function UpdatesPage({params}:{params:Promise<{locale:string}>}) {
  const {locale}=await params;
  if(!isLocale(locale))notFound();
  const latest=getManifest().generatedFrom.latestUpdate;
  const families=getFamilies(getResults());
  return <>
    <PageHead kicker={tr(D.nav.updates,locale)} title={locale==='pt'?'Atualizações do NEXO':'NEXO updates'}
      lead={locale==='pt'?'Mudanças do portal e atualizações do arquivo científico são apresentadas separadamente.':'Site changes and updates to the scientific archive are reported separately.'}/>
    <div className="wrap updates-editorial-layout">
      <section className="motion-reveal" aria-labelledby="editorial-updates-h">
        <p className="kicker">{locale==='pt'?'Portal · Atualização editorial':'Website · Editorial update'}</p>
        <h2 id="editorial-updates-h">{locale==='pt'?'09 de novembro de 2026':'9 November 2026'}</h2>
        <h3>{locale==='pt'?'Nova apresentação da pesquisa e do catálogo público':'Research website and catalogue redesign'}</h3>
        <p>{locale==='pt'?
          'A página inicial passou a priorizar perguntas científicas, observações com crédito e análises documentadas. Os registros do catálogo foram organizados por família de investigação. Nenhum estado científico foi promovido por essa alteração.' :
          'The homepage now prioritises scientific questions, credited observations and documented analyses. Catalogue records are grouped by research family. This change did not promote any scientific status.'}</p>
        <a href="https://github.com/byDenoso/nexo-research/pull/5" className="text-link" target="_blank" rel="noopener noreferrer">{locale==='pt'?'Histórico de implementação':'Implementation history'} ↗</a>
      </section>
      <section className="motion-reveal" aria-labelledby="scientific-updates-h">
        <p className="kicker">{locale==='pt'?'Manifesto da Tower · Arquivo científico':'Tower manifest · Scientific archive'}</p>
        <h2 id="scientific-updates-h">{fmtDate(latest,locale)}</h2>
        <h3>{locale==='pt'?'Última data presente no snapshot público':'Latest date present in the public snapshot'}</h3>
        <p>{locale==='pt'?
          'O arquivo atual reúne '+getResults().length+' resumos de testes em '+families.length+' famílias/perguntas. Essa data é do registro, não demonstra execução científica recente. Um novo snapshot depende de atualização e revisão editorial.' :
          'The current archive contains '+getResults().length+' test summaries organised into '+families.length+' families/questions. This is a record date, not evidence of recent scientific execution. A new snapshot requires an update and editorial review.'}</p>
        <Link href={href(locale,'/results')} className="text-link arrow-link">{locale==='pt'?'Consultar o arquivo':'Browse the archive'}</Link>
        <Link href={href(locale,'/data')} className="text-link arrow-link">{locale==='pt'?'Proveniência do snapshot':'Snapshot provenance'}</Link>
      </section>
    </div>
  </>;
}
