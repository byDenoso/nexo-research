import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ResearchObservation} from '@/components/EditorialFigures';
import {PageHead} from '@/components/ui';
import {getProjects, getResults, getPublications} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {isLocale, pick} from '@/lib/i18n';
import {LINES} from '@/lib/schemas';
import {href, pageMeta} from '@/lib/seo';
const questions = {
 expansion:['O que está acelerando a expansão do Universo?','What is accelerating cosmic expansion?'],
 models:['Uma nova teoria explica a expansão e as estruturas?','Can one new theory explain expansion and structure?'],
 probes:['Diferentes medidas contam a mesma história cósmica?','Do different measurements tell the same cosmic story?'],
 galaxies:['O que a luz das primeiras galáxias revela?','What does light from the earliest galaxies reveal?'],
 'local-group':['Como a Via Láctea e Andrômeda se movem?','How do the Milky Way and Andromeda move?'],
 anomalies:['Uma fonte incomum é física nova ou efeito da medida?','Is an unusual source new physics or a measurement effect?'],
 reproducibility:['Outra pessoa consegue chegar à mesma conclusão?','Can someone else reach the same conclusion?']
};
export async function generateMetadata({params}: {params: Promise<{locale: string}>}) { const {locale}=await params;return isLocale(locale)?pageMeta(locale,'/research',tr(D.research.title,locale),tr(D.research.lead,locale)):{}; }
export default async function ResearchPage({params}: {params: Promise<{locale:string}>}) {
 const {locale}=await params;if(!isLocale(locale))notFound();const pt=locale==='pt',results=getResults(),projects=getProjects(),publications=getPublications();
 return <><PageHead kicker={pt?'Pesquisa':'Research'} title={pt?'As perguntas que nos movem.':'The questions that move us.'} lead={pt?'Da luz que recebemos às explicações que podemos testar. Cada linha conecta uma pergunta física aos dados e aos limites dos resultados públicos.':'From the light we receive to explanations we can test. Each research area connects a physical question with data and the limits of public results.'}/><div className="wrap page-body"><ResearchObservation locale={locale}/><p className="line-overlap-note">{pt?'As linhas se sobrepõem. O catálogo é um recorte público autorizado; o número de execuções não mede a força da evidência.':'Research areas overlap. The catalogue is an authorised public selection; the number of runs does not measure evidence strength.'}</p>{LINES.map((line,i)=>{const count=results.filter(r=>r.lines.includes(line)).length;return <section key={line} id={line} className="research-question"><span className="research-question-number">{String(i+1).padStart(2,'0')}</span><div><p className="kicker">{tr(D.lines.items[line].n,locale)}</p><h2>{questions[line][pt?0:1]}</h2><Link className="text-link" href={href(locale,'/results')+'?line='+line}>{count? (pt?'Explore os testes desta pergunta':'Explore tests of this question'):(pt?'Ainda sem registros públicos':'No public records yet')} →</Link></div><div><h3>{pt?'Como investigamos':'How we investigate'}</h3><p>{projects.find(p=>p.line===line)?pick(projects.find(p=>p.line===line)!.summary,locale):tr(D.lines.items[line].d,locale)}</p><details className="research-projects"><summary>{pt?'Projetos e recorte público':'Projects and public selection'} · {count} {pt?'registros':'records'}</summary><ul>{projects.filter(p=>p.line===line).map(p=><li key={p.id}><h3>{pick(p.title,locale)}</h3><p>{pick(p.summary,locale)}</p></li>)}</ul></details></div></section>})}<section id="scientific-output" className="journal-section"><p className="kicker">{pt?'Produção científica pública':'Public scientific output'}</p><h2 className="section-editorial-title">{pt?'Do registro à publicação.':'From record to publication.'}</h2><p>{publications.length?(pt?'Trabalhos com divulgação autorizada, com estado editorial identificado.':'Works cleared for public release, with their editorial state identified.'):(pt?'Ainda não há manuscritos autorizados neste catálogo. A pesquisa pode ser consultada pelos registros de testes e suas fontes.':'No manuscripts have been cleared for this catalogue yet. Research can be explored through test records and their sources.')}</p>{publications.map(p=><p key={p.id}><Link href={href(locale,'/publications')+'#'+p.id}>{p.title}</Link></p>)}<Link className="journal-button" href={href(locale,'/methods')}>{pt?'Como avaliamos a evidência':'How we assess evidence'} →</Link></section></div></>;
}
