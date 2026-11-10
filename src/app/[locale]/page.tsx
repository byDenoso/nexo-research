import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {CountUp} from '@/components/Motion';
import {ExpansionField, HeroReticle} from '@/components/MotionGraphics';
import {PairChart} from '@/components/PairChart';
import {Pipeline} from '@/components/Pipeline';
import {SensitivityChart} from '@/components/SensitivityChart';
import {StatusBadge} from '@/components/ui';
import {getManifest, getResults} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {fmtDate, isLocale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {compilations, sensitivityPoints, sensitivityRows} from '@/lib/sensitivity';

const HERO = {
  image: 'https://assets.science.nasa.gov/content/dam/science/missions/webb/science/2022/07/STScI-01G8H15R2PGEXQD7TYYBFJ3FT4.png/jcr:content/renditions/cq5dam.web.1280.1280.png',
  source: 'https://science.nasa.gov/asset/webb/webbs-first-deep-field-unveiled-nircam-image/'
} as const;

const topics = [
  {image:'https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2004/10/STScI-01EVVEVGZHJ2B294R1DTNZC08P.tif/jcr:content/renditions/cq5dam.web.1280.1280.jpeg', source:'https://science.nasa.gov/asset/hubble/visible-light-image-of-keplers-supernova-remnant/', credit:'NASA / ESA / R. Sankrit / W. Blair', title:{pt:'Expansão e energia escura',en:'Expansion and dark energy'}, desc:{pt:'O que muda ao variar supernovas, BAO e priors cosmológicos?',en:'What changes with supernova selection, BAO and cosmological priors?'}, caption:{pt:'Remanescente da supernova de Kepler · Hubble',en:'Kepler supernova remnant · Hubble'},anchor:'expansion'},
  {image:'https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2005/09/STScI-01EVVM9R75RVTEHV4R6SDT34D3.tif/jcr:content/renditions/cq5dam.web.1280.1280.jpeg', source:'https://science.nasa.gov/asset/hubble/hubble-ultra-deep-field/', credit:'NASA / ESA / S. Beckwith / HUDF Team / B. Mobasher (STScI)', title:{pt:'Universo primordial e galáxias',en:'Early universe and galaxies'}, desc:{pt:'Que propriedades físicas de objetos distantes resistem à seleção e à calibração?',en:'Which properties of distant sources survive selection and calibration effects?'}, caption:{pt:'Campo Ultraprofundo do Hubble',en:'Hubble Ultra Deep Field'},anchor:'galaxies'},
  {image:'https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2014/10/STScI-01EVT3178GPJ7BSGWHHVAKWMK0.tif/jcr:content/renditions/cq5dam.web.1280.1280.jpeg', source:'https://science.nasa.gov/asset/hubble/hubble-frontier-fields-image-of-abell-2744/', credit:'NASA / ESA / J. Lotz / M. Mountain / A. Koekemoer / HFF Team (STScI)', title:{pt:'Estruturas e consistência entre sondas',en:'Structure and cross-probe consistency'}, desc:{pt:'Quais hipóteses resistem às medidas de crescimento, lenteamento e CMB?',en:'Which hypotheses survive comparisons of growth, lensing and CMB?'}, caption:{pt:'Aglomerado Abell 2744 · Hubble',en:'Abell 2744 cluster · Hubble'},anchor:'probes'}
] as const;

// Lead story: one question told as question, data, result and limits. Texts restate the public
// record; the range across runs is computed from the manifest at build time.
const LEAD_ID = 'T-05ae703af393';
const lead = {
  title: {pt: 'O peso das supernovas próximas', en: 'The leverage of nearby supernovae'},
  steps: [
    {k: {pt: 'Pergunta', en: 'Question'}, v: {pt: 'A preferência por energia escura variável depende de alguma faixa de redshift das supernovas?', en: 'Does the preference for evolving dark energy depend on a particular supernova redshift range?'}},
    {k: {pt: 'Dados', en: 'Data'}, v: {pt: 'DES-SN5YR e Union3, com as restrições de BAO e CMB fixas e o prior Ωm = 0,3 ± 0,01.', en: 'DES-SN5YR and Union3, with BAO and CMB constraints held fixed and the prior Ωm = 0.3 ± 0.01.'}},
    {k: {pt: 'Resultado', en: 'Result'}, v: {pt: 'Sem as supernovas de z = 0,01–0,15, a melhora do ajuste em DES-SN5YR caiu cerca de 94%.', en: 'Without the supernovae at z = 0.01–0.15, the fit improvement in DES-SN5YR fell by about 94%.'}}
  ]
} as const;

const secondary = [
  {id: 'T-0e94e9e2951b', title: {pt: 'Uma tendência sensível ao redshift', en: 'A redshift-sensitive trend'}, summary: {pt: 'Excluir o intervalo de maior redshift enfraqueceu a tendência de S₈ em um ajuste a resumos publicados do eROSITA.', en: 'Removing the highest-redshift bin weakened an S₈ trend in a fit to published eROSITA summaries.'}},
  {id: 'T-9cdf8dcdf082', title: {pt: 'Uma escala ainda sem previsão independente', en: 'An energy scale without an independent prediction'}, summary: {pt: 'O valor usa H₀ e a densidade observada de energia escura. Nessa formulação, não é uma previsão autônoma.', en: 'The value uses H₀ and the observed dark-energy density. In this formulation it is not an independent prediction.'}, value: {pt: '2,283 meV', en: '2.283 meV'}, label: {pt: 'escala recuperada das observações', en: 'scale recovered from observations'}}
] as const;

const archives=[
  {name:'DESI',url:'https://data.desi.lbl.gov/doc/releases/',desc:{pt:'Documentação e releases espectroscópicos',en:'Spectroscopic documentation and releases'}},
  {name:'Pantheon+',url:'https://github.com/PantheonPlusSH0ES/DataRelease',desc:{pt:'Dados públicos de supernovas',en:'Public supernova data'}},
  {name:'MAST',url:'https://archive.stsci.edu/',desc:{pt:'Arquivo de observações Hubble e Webb',en:'Hubble and Webb observation archive'}}
] as const;

export default async function Home({params}:{params:Promise<{locale:string}>}){
  const {locale}=await params;
  if(!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results=getResults(), families=getFamilies(results), snapshot=getManifest().generatedFrom;
  const leadResult = results.find(item => item.id === LEAD_ID);
  const strip = sensitivityPoints(results);
  const values = strip.map(point => point.value);
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 0});
  const stories = secondary.flatMap(entry => {const result = results.find(item => item.id === entry.id); return result ? [{entry, result}] : [];});
  const caveat = pt ? 'Registro interno, sem validação independente nem significância global estabelecida.' : 'Internal record, without established independent validation or global significance.';
  return <>
    <section className="cine-hero" aria-labelledby="editorial-title">
      <figure className="hero-observation">
        <div className="cine-stage" data-pointer="">
          <div className="cine-media"><Image src={HERO.image} alt={pt?'Campo profundo SMACS 0723 observado pelo telescópio Webb':'Webb SMACS 0723 deep field showing galaxies and gravitational arcs'} fill sizes="100vw" priority quality={90} className="science-cover cine-image"/></div>
          <HeroReticle label="JWST / NIRCam" />
          <div className="wrap cine-copy">
            <p className="kicker">{pt?'Pesquisa independente em cosmologia':'Independent cosmology research'}</p>
            <h1 id="editorial-title">{(pt?'A física de um Universo em evolução.':'Exploring the physics of the evolving universe.').split(' ').map((word, index) => <span key={index}><span className="word" style={{'--i': index} as React.CSSProperties}><span>{word}</span></span>{' '}</span>)}</h1>
            <p className="cine-lead">{pt?'O NEXO testa hipóteses sobre a expansão cósmica e a energia escura com dados astronômicos públicos, e publica cada resultado com seus limites.':'NEXO tests hypotheses about cosmic expansion and dark energy with public astronomical data, and publishes every result with its limits.'}</p>
            <div className="home-actions"><Link className="btn btn-primary btn-sheen arrow-link" href={href(locale,'/results')}>{pt?'Ver os resultados':'View the results'}</Link><Link className="btn cine-ghost arrow-link" href={href(locale,'/research')}>{pt?'Explorar a pesquisa':'Explore the research'}</Link></div>
          </div>
          <span className="cine-cue" aria-hidden="true" />
        </div>
        <figcaption className="cine-credit"><div className="wrap"><span>{pt?'Campo profundo SMACS 0723 · JWST / NIRCam. Imagem observacional externa, não produzida pelo NEXO.':'SMACS 0723 deep field · JWST / NIRCam. External observation, not produced by NEXO.'}</span><a href={HERO.source} target="_blank" rel="noopener noreferrer">NASA / ESA / CSA / STScI ↗</a></div></figcaption>
      </figure>
    </section>

    {leadResult && <section className="wrap editorial-featured" aria-labelledby="featured-title">
      <div className="editorial-section-header"><div><p className="kicker">{pt?'Arquivo público':'Public archive'} · {fmtDate(snapshot.latestUpdate,locale)}</p><h2 id="featured-title">{pt?'Análises em destaque':'Selected research analyses'}</h2><p>{pt?'Testes exploratórios reais, com conclusões delimitadas. Estes destaques não representam artigos publicados.':'Real exploratory tests with qualified findings. These highlights are not published papers.'}</p></div><Link href={href(locale,'/results')} className="text-link arrow-link">{pt?'Catálogo completo':'Full catalogue'}</Link></div>
      <article className="lead-story">
        <div className="lead-story-copy">
          <div className="editorial-featured-top"><span className="kicker">01 / {pt?'Expansão e energia escura':'Expansion and dark energy'}</span><StatusBadge locale={locale} status={leadResult.status}/></div>
          <h3>{lead.title[locale]}</h3>
          <dl className="story-steps">
            {lead.steps.map(step => <div key={step.k.en}><dt>{step.k[locale]}</dt><dd>{step.v[locale]}</dd></div>)}
            <div><dt>{pt?'Limites':'Limits'}</dt><dd>{caveat} {values.length > 1 && (pt
              ? `O efeito não foi exclusivo dessa faixa e muda com a configuração: nas ${values.length} execuções públicas desta medida, vai de ${number.format(Math.min(...values))}% a ${number.format(Math.max(...values))}%.`
              : `The effect was not exclusive to that range and changes with the configuration: across the ${values.length} public runs of this measure it goes from ${number.format(Math.min(...values))}% to ${number.format(Math.max(...values))}%.`)}</dd></div>
          </dl>
          <Link href={href(locale,'/results/'+leadResult.slug)} className="btn arrow-link">{pt?'Ver método e limites':'View methods and limits'}<span className="sr-only">: {lead.title[locale]}</span></Link>
        </div>
        <SensitivityChart
          rows={sensitivityRows(strip)} series={compilations(strip)} locale={locale} highlight={LEAD_ID}
          title={pt?'Quanto da melhora do ajuste some ao excluir uma faixa de redshift':'How much of the fit improvement disappears when a redshift range is removed'}
          lead={pt?'Execuções públicas do NEXO, por compilação de supernovas e faixa excluída.':'Public NEXO runs, by supernova compilation and removed range.'}
        />
      </article>
      <div className="story-pair">{stories.map(({entry,result},i)=><article className="editorial-featured-card" key={result.id}>
        <div className="editorial-featured-top"><span className="kicker">0{i+2} / {pt?'Teste':'Test'}</span><StatusBadge locale={locale} status={result.status}/></div>
        <h3>{entry.title[locale]}</h3>
        {'value' in entry ? <div className="editorial-figure"><strong>{entry.value[locale]}</strong><small>{entry.label[locale]}</small></div> : <PairChart item={result} locale={locale} compact/>}
        <p>{entry.summary[locale]}</p>
        <p className="editorial-featured-caveat">{caveat}</p>
        <Link href={href(locale,'/results/'+result.slug)} className="text-link arrow-link">{pt?'Ver método e limites':'View methods and limits'}<span className="sr-only">: {entry.title[locale]}</span></Link>
      </article>)}</div>
    </section>}

    <section className="wrap question-section" aria-labelledby="questions-title">
      <div className="editorial-section-intro"><p className="kicker">{pt?'Perguntas científicas':'Scientific questions'}</p><h2 id="questions-title">{pt?'O que os dados realmente permitem concluir?':'What can the evidence actually tell us?'}</h2><p>{pt?'Confrontamos modelos e dados públicos, examinando escolhas de seleção, priors e explicações alternativas.':'We confront models with public observations, testing selection choices, priors and alternative explanations.'}</p></div>
      <ol className="editorial-question-list"><li><span>01</span>{pt?'A energia escura muda ao longo do tempo cósmico?':'Does dark energy evolve over cosmic time?'}</li><li><span>02</span>{pt?'Quais medições sustentam ou enfraquecem essa hipótese?':'Which observations support or weaken that hypothesis?'}</li><li><span>03</span>{pt?'Como surgem estruturas e galáxias no Universo jovem?':'How do structures and galaxies emerge in the early universe?'}</li></ol>
    </section>

    <section className="visual-research" aria-labelledby="areas-title"><div className="wrap">
      <div className="editorial-section-header"><div><p className="kicker">{pt?'Linhas de investigação':'Research areas'}</p><h2 id="areas-title">{pt?'Três frentes para estudar a evolução cósmica.':'Three directions in cosmic evolution.'}</h2></div><Link href={href(locale,'/research')} className="text-link arrow-link">{pt?'Todas as linhas':'All research areas'}</Link></div>
      <div className="research-photo-grid">{topics.map((area,i)=><article key={area.anchor} className="research-photo-card"><figure><div className="research-photo-frame"><Image src={area.image} alt={area.caption[locale]} fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw" className="science-cover"/></div><figcaption><a href={area.source} target="_blank" rel="noopener noreferrer">{area.caption[locale]} · {area.credit} ↗</a></figcaption></figure><div className="research-photo-copy"><p className="kicker">0{i+1} / {pt?'Pesquisa':'Research'}</p><h3>{area.title[locale]}</h3><p>{area.desc[locale]}</p><Link href={href(locale,'/research')+'#'+area.anchor} className="text-link arrow-link">{pt?'Explorar esta frente':'Explore this area'}<span className="sr-only">: {area.title[locale]}</span></Link></div></article>)}</div>
    </div></section>

    <section className="wrap editorial-methods" aria-labelledby="methods-title"><div className="editorial-section-header"><div><p className="kicker">{pt?'Método e rastreabilidade':'Method and traceability'}</p><h2 id="methods-title">{pt?'Como uma hipótese é testada':'How a hypothesis is tested'}</h2><p>{pt?'Hipóteses, condições de análise, testes de robustez e limites acompanham cada registro, quando disponíveis.':'Hypotheses, analysis conditions, robustness checks and limitations accompany each record when available.'}</p></div><Link href={href(locale,'/methods')} className="text-link arrow-link">{pt?'Métodos completos':'Full methods'}</Link></div><Pipeline locale={locale}/></section>

    <section className="research-method-band" aria-labelledby="sources-title"><ExpansionField /><div className="wrap research-method-grid"><div><p className="kicker">{pt?'Dados e software':'Data and software'}</p><h2 id="sources-title">{pt?'Arquivos que qualquer grupo pode abrir.':'Archives any group can open.'}</h2><p>{pt?'As análises partem de levantamentos públicos. A página de dados mostra o snapshot em uso, seu SHA-256 e os conjuntos citados nos resumos.':'The analyses start from public surveys. The data page shows the snapshot in use, its SHA-256 and the data sets named in the summaries.'}</p><Link href={href(locale,'/data')} className="btn arrow-link">{pt?'Ver dados e fontes':'View data and sources'}</Link></div><div className="research-sources"><h3>{pt?'Arquivos externos e código':'External archives and code'}</h3><ul>{archives.map(source=><li key={source.name}><a href={source.url} rel="noopener noreferrer" target="_blank"><span><strong>{source.name}</strong><small>{source.desc[locale]}</small></span><b aria-hidden="true">↗</b></a></li>)}<li><Link href={href(locale,'/code')}><span><strong>{pt?'Código do NEXO':'NEXO code'}</strong><small>{pt?'Repositórios e artefatos públicos':'Public repositories and artefacts'}</small></span><b aria-hidden="true">→</b></Link></li></ul><p className="research-source-note">{pt?'Os arquivos externos não representam afiliação ou endosso institucional.':'External archives do not imply institutional affiliation or endorsement.'}</p></div></div></section>

    <section className="wrap editorial-archive" aria-labelledby="archive-title"><div className="editorial-archive-heading"><p className="kicker">{pt?'Transparência documental':'Documentary transparency'}</p><h2 id="archive-title">{pt?'O arquivo público em contexto':'The public archive in context'}</h2><p>{pt?'Contagens descrevem perguntas e registros de teste, não artigos ou descobertas.':'Counts describe questions and test records, not papers or discoveries.'}</p></div><dl className="editorial-archive-metrics"><div><dd><CountUp value={families.length} locale={pt?'pt-BR':'en-GB'} /></dd><dt>{pt?'famílias e perguntas':'families and questions'}</dt></div><div><dd><CountUp value={results.length} locale={pt?'pt-BR':'en-GB'} /></dd><dt>{pt?'registros públicos de testes':'public test records'}</dt></div><div><dd>{fmtDate(snapshot.latestUpdate,locale)}</dd><dt>{pt?'última data do snapshot':'latest snapshot record date'}</dt></div></dl><Link href={href(locale,'/data')} className="text-link arrow-link">{pt?'Ver proveniência e SHA-256':'View provenance and SHA-256'}</Link></section>

    <section className="wrap editorial-closer" aria-labelledby="closer-title"><div><p className="kicker">{pt?'Sobre o projeto':'About the project'}</p><h2 id="closer-title">{pt?'Pesquisa independente. Evidência verificável.':'Independent research. Verifiable evidence.'}</h2><p>{pt?'O NEXO é desenvolvido sob direção científica de Dener Pereira. As atualizações editoriais são distintas das atualizações do arquivo científico.':'NEXO is developed under the scientific direction of Dener Pereira. Editorial updates are distinct from scientific archive updates.'}</p></div><div className="editorial-closer-actions"><Link className="btn btn-primary arrow-link" href={href(locale,'/about')}>{pt?'Conhecer o NEXO':'About NEXO'}</Link><Link className="btn arrow-link" href={href(locale,'/contact')}>{pt?'Contato':'Contact'}</Link><Link className="text-link" href={href(locale,'/updates')}>{pt?'Atualizações editoriais':'Editorial updates'}</Link></div></section>
  </>;
}
