import Link from 'next/link';
import {notFound} from 'next/navigation';
import {isLocale} from '@/lib/i18n';
import {href, pageMeta} from '@/lib/seo';
import styles from './page.module.css';

const texts = {
  pt: {
    title: 'Atlas de conhecimento', lead: 'Resultados da literatura de cosmologia e astrofísica, com suas fontes e condições de validade.',
    contents: 'Perguntas', catalogue: 'Catálogo público do NEXO', atlas: 'Abrir o quadro de investigação', access: 'Acesso da equipe',
    studies: [
      {id: 'expansao', area: 'Expansão', title: 'A energia escura varia com o tempo?',
        result: 'Na análise do DESI DR2, a preferência pelo modelo de energia escura variável alcançou de 2,8 a 4,2 σ ao combinar BAO, fundo cósmico de micro-ondas e supernovas. A compilação de supernovas escolhida determina a posição nesse intervalo.'},
      {id: 'supernovas', area: 'Supernovas', title: 'Quanto a luz das supernovas restringe a densidade de matéria?',
        result: 'A análise Pantheon+ reuniu 1.701 curvas de luz de 1.550 supernovas Ia distintas. Usando apenas as supernovas, Brout e colaboradores mediram Ωₘ = 0,334 ± 0,018 no modelo ΛCDM plano.'},
      {id: 'cmb', area: 'Crescimento', title: 'Qual é a amplitude do lenteamento do fundo cósmico?',
        result: 'A reconstrução conjunta de ACT, SPT e Planck mediu uma amplitude de 1,025 ± 0,017 em relação à previsão da cosmologia de melhor ajuste aos dados primários de Planck e ACT.'},
      {id: 'aglomerados', area: 'Aglomerados', title: 'O que a distância entre a galáxia mais brilhante e o pico de raios X revela?',
        result: 'Zenteno e colaboradores mediram esse deslocamento em 3.946 aglomerados e grupos. Adotaram distâncias abaixo de 0,25 r₅₀₀ para classificar sistemas relaxados e acima de 0,5 r₅₀₀ para sistemas perturbados.'},
      {id: 'grupo-local', area: 'Grupo Local', title: 'A Via Láctea e Andrômeda vão se fundir?',
        result: 'Sawala e colaboradores estimaram cerca de 50% de probabilidade de fusão em 10 bilhões de anos. Com movimentos próprios atualizados de M31 e M33, Wu e colaboradores obtiveram 90% no modelo de referência. São previsões condicionadas à astrometria adotada.'}
    ]
  },
  en: {
    title: 'Knowledge atlas', lead: 'Results from the cosmology and astrophysics literature, with sources and the assumptions underlying each finding.',
    contents: 'Questions', catalogue: 'NEXO public catalogue', atlas: 'Open the research board', access: 'Team access',
    studies: [
      {id: 'expansao', area: 'Expansion', title: 'Does dark energy change with time?',
        result: 'In the DESI DR2 analysis, the preference for time-dependent dark energy ranged from 2.8 to 4.2 σ when baryon acoustic oscillations, the cosmic microwave background and supernovae were combined. The result depends on the supernova compilation.'},
      {id: 'supernovas', area: 'Supernovae', title: 'How tightly do supernova distances constrain matter density?',
        result: 'Pantheon+ assembled 1,701 light curves of 1,550 distinct Type Ia supernovae. From the supernova sample alone, Brout and colleagues measured Ωₘ = 0.334 ± 0.018 in flat ΛCDM.'},
      {id: 'cmb', area: 'Growth', title: 'What is the amplitude of cosmic microwave background lensing?',
        result: 'A joint reconstruction from ACT, SPT and Planck measured a lensing amplitude of 1.025 ± 0.017 relative to the prediction from the cosmology that best fits the primary Planck and ACT data.'},
      {id: 'aglomerados', area: 'Galaxy clusters', title: 'What does the offset between the brightest galaxy and the X-ray peak reveal?',
        result: 'Zenteno and colleagues measured this separation in 3,946 clusters and groups. They classified systems with offsets below 0.25 r₅₀₀ as relaxed and those above 0.5 r₅₀₀ as disturbed.'},
      {id: 'grupo-local', area: 'Local Group', title: 'Will the Milky Way and Andromeda merge?',
        result: 'Sawala and colleagues estimated roughly a 50% probability of a merger within 10 billion years. With updated M31 and M33 proper motions, Wu and colleagues obtained 90% in their fiducial model. Each forecast depends on the adopted astrometry.'}
    ]
  }
} as const;

const sources = {
  expansao: [['DESI Collaboration · 2025', 'https://doi.org/10.1103/tr6y-kpc6']],
  supernovas: [['Brout et al. · 2022', 'https://doi.org/10.3847/1538-4357/ac8e04']],
  cmb: [['Qu et al. · 2026', 'https://doi.org/10.1103/k5yr-3h6d']],
  aglomerados: [['Zenteno et al. · 2025', 'https://doi.org/10.1051/0004-6361/202452440']],
  'grupo-local': [
    ['Sawala et al. · 2025', 'https://doi.org/10.1038/s41550-025-02563-1'],
    ['Wu et al. · 2026', 'https://arxiv.org/abs/2603.22863']
  ]
} as const;

type Props = {params: Promise<{locale: string}>};

export async function generateMetadata({params}: Props) {
  const {locale} = await params;
  if (!isLocale(locale)) return {};
  return pageMeta(locale, '/conhecimento', texts[locale].title, texts[locale].lead);
}

export default async function KnowledgePage({params}: Props) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const content = texts[locale];
  return (
    <div className={`wrap ${styles.atlas}`}>
      <header className={styles.head}>
        <div>
          <h1>{content.title}</h1>
          <p>{content.lead}</p>
        </div>
        <div className={styles.access}>
          <small>{content.access}</small>
          <a className="text-link" href="https://nexo-atlas-investigacao.bydenoso.chatgpt.site/conhecimento.html">{content.atlas} ↗</a>
        </div>
      </header>
      <div className={styles.body}>
        <nav aria-label={content.contents} className={styles.index}>
          <h2>{content.contents}</h2>
          {content.studies.map(study => <a key={study.id} href={`#${study.id}`}>{study.area}</a>)}
          <Link className="text-link" href={href(locale, '/results')}>{content.catalogue} →</Link>
        </nav>
        <div>
          {content.studies.map(study => (
            <article key={study.id} id={study.id} className={styles.study}>
              <p className="kicker">{study.area}</p>
              <h2>{study.title}</h2>
              <p>{study.result}</p>
              <div className={styles.sources}>
                {sources[study.id].map(([label, url]) => <a key={url} href={url} className="text-link">{label} ↗</a>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
