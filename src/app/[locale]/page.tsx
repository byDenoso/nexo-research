import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PairChart} from '@/components/PairChart';
import {StatusBadge} from '@/components/ui';
import {getManifest, getResults} from '@/lib/data';
import {getFamilies} from '@/lib/families';
import {readResult, selectedIds, isNegative} from '@/lib/editorial';
import {fmtDate, isLocale} from '@/lib/i18n';
import {href} from '@/lib/seo';

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt', results = getResults();
  const selected = selectedIds.flatMap(id => {const item = results.find(r => r.id === id); return item ? [item] : [];});
  const lead = selected[0]!, reading = readResult(lead, locale);
  return <>
    <div className="wrap edition-line"><span>{pt ? 'Instituto independente de cosmologia' : 'Independent institute of cosmology'}</span><span>{pt ? 'Perguntas abertas. Evidência pública.' : 'Open questions. Public evidence.'}</span></div>
    <section className="wrap journal-cover" aria-labelledby="cover-title">
      <div className="cover-copy">
        <p className="kicker">{pt ? 'Em foco / Expansão do Universo' : 'In focus / Cosmic expansion'}</p>
        <h1 id="cover-title">{pt ? <>O Universo se expande.<br/><em>Como sabemos o que o move?</em></> : <>The Universe expands.<br/><em>How do we know what drives it?</em></>}</h1>
        <p className="cover-deck">{pt ? 'A luz de estrelas e galáxias guarda pistas sobre a expansão. Investigamos quais explicações resistem quando os dados e as hipóteses são postos à prova.' : 'Light from stars and galaxies carries clues about expansion. We investigate which explanations survive when data and assumptions are put to the test.'}</p>
        <Link className="journal-button" href="#em-foco">{pt ? 'Comece por uma pergunta' : 'Start with a question'} <span aria-hidden="true">↓</span></Link>
      </div>
      <figure className="cover-observation">
        <Image src="/images/pantheon-volume.jpg" width={2560} height={1440} sizes="(max-width: 800px) 100vw, 55vw" priority alt={pt ? 'Visualização das 1.543 supernovas do Pantheon+ em suas posições no céu, em cascas de redshift.' : 'Visualisation of the 1,543 Pantheon+ supernovae at their sky positions in redshift shells.'}/>
        <figcaption><span className="image-type">{pt ? 'Visualização de dados reais' : 'Real-data visualisation'} · Pantheon+</span>{pt ? '1.543 supernovas. Distâncias calculadas em ΛCDM plano (Ωm = 0,3; H₀ = 70 km/s/Mpc).' : '1,543 supernovae. Distances computed in flat ΛCDM (Ωm = 0.3; H₀ = 70 km/s/Mpc).'} <a href="https://arxiv.org/abs/2112.03863">Scolnic et al. (2022) ↗</a></figcaption>
      </figure>
    </section>
    <section id="em-foco" className="wrap journal-section" aria-labelledby="featured-title">
      <div className="journal-section-top"><p className="kicker">01 / {pt ? 'Uma pergunta, em dois minutos' : 'One question, in two minutes'}</p><StatusBadge status={lead.status} locale={locale}/></div>
      <div className="feature-reading"><div><h2 id="featured-title">{reading.question}</h2><p className="feature-finding">{reading.finding}</p><Link className="text-link" href={href(locale, '/results/'+lead.slug)}>{pt ? 'Leia o resultado e confira a evidência' : 'Read the result and inspect the evidence'} →</Link></div><div className="feature-context"><h3>{pt ? 'Por que importa' : 'Why it matters'}</h3><p>{reading.why}</p><div className="visible-limit"><strong>{pt ? 'Até onde vai a conclusão' : 'Scope of the conclusion'}</strong><p>{reading.limit}</p></div><Link className="text-link" href={href(locale, '/results/families/redshift-exclusion')}>{pt ? 'Compare as execuções desta família' : 'Compare runs in this family'} →</Link></div></div>
    </section>
    <section className="wrap journal-section" aria-labelledby="readings-title"><div className="journal-section-top"><p className="kicker">02 / {pt ? 'Outras leituras' : 'Further reading'}</p><Link className="text-link" href={href(locale,'/results')}>{pt ? 'Explorar o catálogo' : 'Explore the catalogue'} →</Link></div><h2 id="readings-title" className="section-editorial-title">{pt ? 'O que os testes nos deixam dizer.' : 'What the tests allow us to say.'}</h2><div className="journal-stories">{selected.slice(1).map((item,i)=>{const story=readResult(item,locale);return <article key={item.id}><div className="journal-story-meta"><span>0{i+1}</span><StatusBadge status={item.status} locale={locale}/></div><h3><Link href={href(locale,'/results/'+item.slug)}>{story.question}</Link></h3>{i===0 && <PairChart item={item} locale={locale} compact/>}<p>{story.finding}</p>{isNegative(item.id)&&<span className="outcome-tag">{pt?'Resultado negativo':'Negative result'}</span>}<p className="story-limit">{story.limit}</p><Link className="text-link" href={href(locale,'/results/'+item.slug)}>{pt?'Entenda o teste':'Understand the test'} →</Link></article>})}</div></section>
    <section className="research-invitation"><div className="wrap research-invitation-inner"><div><p className="kicker">03 / {pt ? 'Além de um resultado' : 'Beyond one result'}</p><h2>{pt ? 'Uma boa pergunta precisa de mais de uma maneira de ser testada.' : 'A good question needs more than one way to be tested.'}</h2></div><div><p>{pt ? 'Conectamos a história da expansão ao crescimento de estruturas e à observação de galáxias. Resultados negativos e limitações fazem parte dessa investigação.' : 'We connect expansion history with structure growth and galaxy observations. Negative results and limitations are part of that investigation.'}</p><Link className="journal-button" href={href(locale,'/research')}>{pt?'Conheça as perguntas de pesquisa':'Explore our research questions'} →</Link></div></div></section>
    <section className="wrap journal-section catalogue-note"><div><p className="kicker">{pt?'Como ler o NEXO':'Reading NEXO'}</p><h2>{pt?'Da conclusão ao cálculo.':'From conclusion to calculation.'}</h2><p>{pt?'O catálogo público é um recorte autorizado da pesquisa. Uma família reúne testes da mesma pergunta; cada execução mantém seus dados, hipóteses e estado de evidência.':'The public catalogue is an authorised selection of the research. A family groups tests of one question; each run retains its data, assumptions and evidence status.'}</p></div><div><dl><div><dt>{pt?'Famílias no recorte':'Families in this selection'}</dt><dd>{getFamilies(results).length}</dd></div><div><dt>{pt?'Execuções documentadas':'Documented runs'}</dt><dd>{results.length}</dd></div><div><dt>{pt?'Último registro do conjunto':'Latest record in the dataset'}</dt><dd>{fmtDate(getManifest().generatedFrom.latestUpdate,locale)}</dd></div></dl><p>{pt?'Execuções relacionadas não contam como confirmações independentes.':'Related runs do not count as independent confirmations.'}</p><div className="inst-actions"><Link className="text-link" href={href(locale,'/methods')}>{pt?'Métodos e estados de evidência':'Methods and evidence states'} →</Link><Link className="text-link" href={href(locale,'/about')}>{pt?'O instituto e Dener Pereira':'The institute and Dener Pereira'} →</Link></div></div></section>
  </>;
}
