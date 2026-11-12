import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {PairChart} from '@/components/PairChart';
import {SensitivityChart} from '@/components/SensitivityChart';
import {StatusBadge} from '@/components/ui';
import {getManifest, getResults} from '@/lib/data';
import {D, tr} from '@/lib/dict';
import {getFamilies} from '@/lib/families';
import {fmtDate, isLocale} from '@/lib/i18n';
import {href} from '@/lib/seo';
import {compilations, sensitivityPoints, sensitivityRows} from '@/lib/sensitivity';

// Cover figure: NEXO's own rendering of the Pantheon+ supernovae at their sky positions.
// docs/IMAGE-CREDITS.md records the data source, and the cosmology used for distances.
const COVER = {image: '/images/pantheon-volume.jpg', width: 2560, height: 1440} as const;

const areas = [
  {anchor: 'expansion', title: {pt: 'Expansão e energia escura', en: 'Expansion and dark energy'}, desc: {pt: 'O que muda ao variar supernovas, BAO e priors cosmológicos?', en: 'What changes with supernova selection, BAO and cosmological priors?'}, data: 'DES-SN5YR · Union3 · Pantheon+ · DESI'},
  {anchor: 'probes', title: {pt: 'Estruturas e consistência entre sondas', en: 'Structure and cross-probe consistency'}, desc: {pt: 'Quais hipóteses resistem às medidas de crescimento, lenteamento e CMB?', en: 'Which hypotheses survive comparisons of growth, lensing and CMB?'}, data: 'Planck · eROSITA · DESI'},
  {anchor: 'galaxies', title: {pt: 'Universo primordial e galáxias', en: 'Early universe and galaxies'}, desc: {pt: 'Que propriedades físicas de objetos distantes resistem à seleção e à calibração?', en: 'Which properties of distant sources survive selection and calibration effects?'}, data: 'JWST · JADES'}
] as const;

// Lead analysis: one question told as question, data, result and limits. Texts restate the public
// record; the featured value and the range across runs come from the manifest figures.
const LEAD_ID = 'T-05ae703af393';
const lead = {
  title: {pt: 'O efeito de retirar supernovas próximas do ajuste', en: 'Removing nearby supernovae from the fit'},
  steps: [
    {k: {pt: 'Pergunta', en: 'Question'}, v: {pt: 'A preferência por energia escura variável depende de alguma faixa de redshift das supernovas?', en: 'Does the preference for evolving dark energy depend on a particular supernova redshift range?'}},
    {k: {pt: 'Dados', en: 'Data'}, v: {pt: 'DES-SN5YR e Union3, com as restrições de BAO e CMB fixas e o prior Ωm = 0,3 ± 0,01.', en: 'DES-SN5YR and Union3, with BAO and CMB constraints held fixed and the prior Ωm = 0.3 ± 0.01.'}}
  ]
} as const;

const secondary = [
  {id: 'T-0e94e9e2951b', area: {pt: 'Crescimento de estruturas', en: 'Structure growth'}, title: {pt: 'A tendência de S₈ no eROSITA', en: 'The S₈ trend in eROSITA'}, summary: {pt: 'Excluir o intervalo de maior redshift enfraqueceu a tendência de S₈ em um ajuste a resumos publicados do eROSITA.', en: 'Removing the highest-redshift bin weakened an S₈ trend in a fit to published eROSITA summaries.'}},
  {id: 'T-9cdf8dcdf082', area: {pt: 'Teoria', en: 'Theory'}, title: {pt: 'A escala de energia na derivação holográfica', en: 'The energy scale in the holographic derivation'}, summary: {pt: 'A derivação usa H₀ e a densidade observada de energia escura como entradas. Uma previsão independente precisaria fixar a escala sem esses dados.', en: 'The derivation takes H₀ and the observed dark-energy density as inputs. An independent prediction would need to fix the scale without those data.'}, value: {pt: '2,283 meV', en: '2.283 meV'}}
] as const;

export default async function Home({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const pt = locale === 'pt';
  const results = getResults(), families = getFamilies(results), snapshot = getManifest().generatedFrom;
  const leadResult = results.find(item => item.id === LEAD_ID);
  const strip = sensitivityPoints(results);
  const featuredRun = strip.find(point => point.id === LEAD_ID);
  const number = new Intl.NumberFormat(pt ? 'pt-BR' : 'en-GB', {maximumFractionDigits: 3});
  const values = strip.map(point => point.value);
  const stories = secondary.flatMap(entry => {const result = results.find(item => item.id === entry.id); return result ? [{entry, result}] : [];});
  return <>
    <section className="wrap inst-lead" aria-labelledby="institute-title">
      <div className="inst-lead-copy">
        <h1 id="institute-title">NEXO Research Institute</h1>
        <p className="inst-descriptor">{pt ? 'Instituto independente de pesquisa em cosmologia' : 'An independent research institute in cosmology'}</p>
        <p className="inst-intro">{pt
          ? 'Testamos modelos de expansão do Universo com dados públicos de supernovas, oscilações acústicas de bárions e radiação cósmica de fundo. Cada teste é registrado antes do cálculo e entra no catálogo com suas condições e seus limites.'
          : 'We test models of cosmic expansion against public data from supernovae, baryon acoustic oscillations and the cosmic microwave background. Each test is recorded before the calculation and enters the catalogue with its conditions and limits.'}</p>
        <p className="inst-facts">
          <span><b>{number.format(families.length)}</b> {pt ? 'famílias de resultados' : 'result families'}</span>
          <span><b>{number.format(results.length)}</b> {pt ? 'registros de testes' : 'test records'}</span>
          <span>{pt ? 'Catálogo atualizado em' : 'Catalogue updated on'} <b>{fmtDate(snapshot.latestUpdate, locale)}</b></span>
        </p>
        <p className="inst-actions"><Link className="text-link" href={href(locale, '/results')}>{pt ? 'Abrir o catálogo' : 'Open the catalogue'}</Link><Link className="text-link" href={href(locale, '/methods')}>{pt ? 'Como os testes são feitos' : 'How the tests are run'}</Link></p>
      </div>
      <figure className="inst-cover">
        <Image src={COVER.image} width={COVER.width} height={COVER.height} priority quality={88} sizes="(max-width: 56rem) 100vw, 46vw"
          alt={pt ? 'Supernovas do Pantheon+ dispostas em três dimensões em torno do observador, com cascas esféricas em redshift 0,1, 0,5, 1,0 e 2,0' : 'Pantheon+ supernovae placed in three dimensions around the observer, with spherical shells at redshift 0.1, 0.5, 1.0 and 2.0'} />
        <figcaption>{pt
          ? 'As 1.543 supernovas do Pantheon+ nas posições do céu, com cascas em z = 0,1, 0,5, 1,0 e 2,0. Distâncias comóveis em ΛCDM plano (Ωm = 0,3; H₀ = 70 km/s/Mpc). Visualização do NEXO sobre dados de '
          : 'The 1,543 Pantheon+ supernovae at their sky positions, with shells at z = 0.1, 0.5, 1.0 and 2.0. Comoving distances in flat ΛCDM (Ωm = 0.3; H₀ = 70 km/s/Mpc). NEXO visualisation of data from '}
          <a href="https://arxiv.org/abs/2112.03863" target="_blank" rel="noopener noreferrer">Scolnic et al. (2022)</a>.</figcaption>
      </figure>
    </section>

    {leadResult && <section className="wrap inst-section" aria-labelledby="featured-title">
      <div className="inst-feature">
        <article className="inst-feature-main">
          <p className="inst-label">{pt ? 'Análise em destaque' : 'Featured analysis'} · {pt ? 'Expansão e energia escura' : 'Expansion and dark energy'} <StatusBadge locale={locale} status={leadResult.status} /></p>
          <h2 id="featured-title">{lead.title[locale]}</h2>
          <dl className="inst-test">
            {lead.steps.map(step => <div key={step.k.en}><dt>{step.k[locale]}</dt><dd>{step.v[locale]}</dd></div>)}
            {featuredRun && <div><dt>{pt ? 'Resultado' : 'Result'}</dt><dd>{pt
              ? `Sem as supernovas de z = ${number.format(featuredRun.zLow)}–${number.format(featuredRun.zHigh)}, a melhora do ajuste em ${featuredRun.compilation} caiu cerca de ${number.format(featuredRun.value)}%.`
              : `Without the supernovae at z = ${number.format(featuredRun.zLow)}–${number.format(featuredRun.zHigh)}, the fit improvement in ${featuredRun.compilation} fell by about ${number.format(featuredRun.value)}%.`}</dd></div>}
            {values.length > 1 && <div><dt>{pt ? 'Limites' : 'Limits'}</dt><dd>{pt
              ? `O efeito varia entre as configurações examinadas, de ${number.format(Math.min(...values))}% a ${number.format(Math.max(...values))}%. As execuções não são medições independentes.`
              : `The effect varies across the configurations examined, from ${number.format(Math.min(...values))}% to ${number.format(Math.max(...values))}%. The runs are not independent measurements.`}</dd></div>}
          </dl>
          <SensitivityChart
            rows={sensitivityRows(strip)} series={compilations(strip)} locale={locale} highlight={LEAD_ID}
            title={pt ? 'Quanto cai a melhora do ajuste ao excluir uma faixa de redshift?' : 'How much does fit improvement fall when a redshift range is removed?'}
            lead={pt ? 'Execuções públicas do NEXO, por compilação de supernovas e faixa excluída.' : 'Public NEXO runs, by supernova compilation and removed range.'}
          />
          <p><Link href={href(locale, '/results/' + leadResult.slug)} className="text-link">{pt ? 'Método e limites deste registro' : 'Methods and limits of this record'}</Link></p>
        </article>
        <div className="inst-feature-side">
          <p className="inst-label">{pt ? 'Outras análises' : 'Other analyses'}</p>
          {stories.map(({entry, result}) => <article className="inst-side-item" key={result.id}>
            <p className="inst-label">{entry.area[locale]} <StatusBadge locale={locale} status={result.status} /></p>
            <h3><Link href={href(locale, '/results/' + result.slug)}>{entry.title[locale]}</Link></h3>
            {'value' in entry ? <p className="inst-value">{entry.value[locale]}</p> : <PairChart item={result} locale={locale} compact />}
            <p>{entry.summary[locale]}</p>
          </article>)}
          <p className="inst-note">{pt
            ? 'Candidato indica registro interno, sem validação independente nem significância global estabelecida.'
            : 'Candidate marks an internal record, without independent validation or established global significance.'}</p>
          <p><Link href={href(locale, '/results')} className="text-link">{pt ? 'Todas as análises' : 'All analyses'}</Link></p>
        </div>
      </div>
    </section>}

    <section className="wrap inst-section" aria-labelledby="areas-title">
      <h2 id="areas-title">{pt ? 'Linhas de pesquisa' : 'Research areas'}</h2>
      <ul className="inst-lines" role="list">{areas.map(area => <li key={area.anchor}><Link href={href(locale, '/research') + '#' + area.anchor}>
        <strong>{area.title[locale]}</strong><span>{area.desc[locale]}</span><small>{area.data}</small>
      </Link></li>)}</ul>
    </section>

    <section className="wrap inst-section inst-two">
      <div aria-labelledby="methods-title">
        <h2 id="methods-title">{pt ? 'Como uma hipótese é testada' : 'How a hypothesis is tested'}</h2>
        <ol className="inst-steps">{D.how.steps.map(step => <li key={step.k}><strong>{tr(step.n, locale)}.</strong> {tr(step.d, locale)}</li>)}</ol>
        <p><Link href={href(locale, '/methods')} className="text-link">{pt ? 'Métodos completos' : 'Full methods'}</Link></p>
      </div>
      <div aria-labelledby="about-title">
        <h2 id="about-title">{pt ? 'O instituto' : 'The institute'}</h2>
        <p>{pt
          ? 'O NEXO Research Institute é um projeto independente, dirigido por Dener Pereira, que responde pela interpretação dos testes e pelo conteúdo do catálogo.'
          : 'NEXO Research Institute is an independent project directed by Dener Pereira, who is responsible for interpreting the tests and for the content of the catalogue.'}</p>
        <p>{pt
          ? 'Para propor uma verificação, indique o identificador do registro e o ajuste, o corte de amostra ou a hipótese que você quer conferir.'
          : 'To propose a check, give the record identifier and the fit, sample cut or hypothesis you want to verify.'}</p>
        <p className="inst-actions"><Link href={href(locale, '/about')} className="text-link">{pt ? 'Sobre o instituto' : 'About the institute'}</Link><Link href={href(locale, '/data')} className="text-link">{pt ? 'Dados e proveniência' : 'Data and provenance'}</Link><Link href={href(locale, '/contact')} className="text-link">{pt ? 'Contato' : 'Contact'}</Link></p>
      </div>
    </section>
  </>;
}
