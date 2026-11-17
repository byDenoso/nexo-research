import type {Locale} from './i18n';
import {BAO_LEVEL, makeBaoFootprint} from './live-result-bao';

export type Text = Readonly<Record<Locale, string>>;
export type PlanePoint = Readonly<{omegaM: number; h0: number}>;
export type ProbeAnchor = Readonly<{omegaM?: number; h0?: number; sigmaOmegaM?: number; sigmaH0?: number}>;

export const LIVE_RESULT_PROBE_IDS = ['cmb', 'bao', 'des', 'pantheon', 'ladder'] as const;
export const LIVE_RESULT_SCENARIO_IDS = ['baseline', 'desOffset', 'withoutLrg2', 'shortRuler', 'masslessNeutrinos'] as const;
export type ProbeId = (typeof LIVE_RESULT_PROBE_IDS)[number];
export type ScenarioId = (typeof LIVE_RESULT_SCENARIO_IDS)[number];
export type LiveResultStatus = 'published' | 'submitted' | 'provisional';

type Source = {label: Text; href?: string};
export const LIVE_RESULT_SOURCE_LINKS = {
  planck: {
    label: {pt: 'Planck 2018 · Parâmetros cosmológicos', en: 'Planck 2018 · Cosmological parameters'},
    href: 'https://arxiv.org/abs/1807.06209',
  },
  desi: {
    label: {pt: 'DESI DR2 · Medidas de BAO e parâmetros cosmológicos', en: 'DESI DR2 · BAO measurements and cosmological constraints'},
    href: 'https://arxiv.org/abs/2503.14738',
  },
  baoMean: {
    label: {pt: 'DESI DR2 · Vetor de medidas de BAO', en: 'DESI DR2 · BAO measurement vector'},
    href: 'https://github.com/CobayaSampler/bao_data/blob/v2.6/desi_bao_dr2/desi_gaussian_bao_ALL_GCcomb_mean.txt',
  },
  baoCovariance: {
    label: {pt: 'DESI DR2 · Covariância das medidas de BAO', en: 'DESI DR2 · BAO measurement covariance'},
    href: 'https://github.com/CobayaSampler/bao_data/blob/v2.6/desi_bao_dr2/desi_gaussian_bao_ALL_GCcomb_cov.txt',
  },
  des: {
    label: {pt: 'DES-SN5YR · Resultados cosmológicos, tabela 2', en: 'DES-SN5YR · Cosmology results, table 2'},
    href: 'https://arxiv.org/html/2401.02929',
  },
  pantheon: {
    label: {pt: 'Pantheon+ · Restrições cosmológicas', en: 'Pantheon+ · Cosmological constraints'},
    href: 'https://arxiv.org/abs/2202.04077',
  },
  shoes: {
    label: {pt: 'SH0ES · Medição local de H₀ com o Hubble', en: 'SH0ES · Local H₀ measurement with Hubble'},
    href: 'https://arxiv.org/abs/2112.04510',
  },
  synthesis: {
    label: {
      pt: 'NEXO Research · Síntese do plano (Ωₘ, h) e testes de sensibilidade, resultados provisórios',
      en: 'NEXO Research · (Ωₘ, h) plane and sensitivity checks, provisional results',
    },
  },
  offset: {
    label: {
      pt: 'Dener Pereira · Análise de calibração do DES submetida à Physical Review D',
      en: 'Dener Pereira · DES calibration analysis submitted to Physical Review D',
    },
  },
} satisfies Record<string, Source>;
export type LiveResultSourceId = keyof typeof LIVE_RESULT_SOURCE_LINKS;

export const LIVE_RESULT_STATUS: Record<LiveResultStatus, Text> = {
  published: {pt: 'Referência publicada', en: 'Published reference'},
  submitted: {pt: 'Submetido à Physical Review D', en: 'Submitted to Physical Review D'},
  provisional: {pt: 'Provisório · não publicado', en: 'Provisional · unpublished'},
};

export const LIVE_RESULT_PLANCK_REFERENCE = {
  omegaMh2: 0.1430,
  sigmaOmegaMh2: 0.0011,
  theta100: 1.04110,
  sigmaTheta100: 0.00031,
} as const;

const baoStandard: PlanePoint = {omegaM: 0.2972, h0: 68.69};
const baoWithoutLrg2: PlanePoint = {omegaM: 0.2993, h0: 68.40};
const baoShort: PlanePoint = {omegaM: 0.2972, h0: 72.63};

export type LiveResultProbe = {
  label: Text;
  shortLabel: Text;
  anchor: ProbeAnchor;
  description: Text;
  sourceIds: readonly LiveResultSourceId[];
  status: LiveResultStatus;
};

export const LIVE_RESULT_PROBES: Record<ProbeId, LiveResultProbe> = {
  cmb: {
    label: {pt: 'Radiação cósmica de fundo', en: 'Cosmic microwave background'},
    shortLabel: {pt: 'CMB · Planck', en: 'CMB · Planck'},
    anchor: {omegaM: 0.3151, h0: 67.36},
    description: {
      pt: 'A faixa acompanha a densidade física da matéria, Ωₘh², inferida pelo Planck. O marcador indica o ponto adotado na síntese com base no Planck. A escala angular acústica dá uma restrição adicional.',
      en: 'The band follows the physical matter density, Ωₘh², inferred by Planck. The marker gives the point adopted in the analysis based on Planck. The angular acoustic scale supplies a further constraint.',
    },
    sourceIds: ['planck', 'synthesis'],
    status: 'published',
  },
  bao: {
    label: {pt: 'Oscilações acústicas de bárions', en: 'Baryon acoustic oscillations'},
    shortLabel: {pt: 'BAO · DESI DR2', en: 'BAO · DESI DR2'},
    anchor: baoStandard,
    description: {
      pt: 'As distâncias do DESI comparam a expansão a uma régua acústica. O ponto de referência em H₀ depende da calibração do comprimento dessa régua.',
      en: 'DESI distances compare expansion with an acoustic ruler. The reference point in H₀ depends on the calibration of that ruler’s length.',
    },
    sourceIds: ['desi', 'baoMean', 'baoCovariance', 'synthesis'],
    status: 'provisional',
  },
  des: {
    label: {pt: 'Supernovas DES-SN5YR', en: 'DES-SN5YR supernovae'},
    shortLabel: {pt: 'DES-SN5YR', en: 'DES-SN5YR'},
    anchor: {omegaM: 0.352, sigmaOmegaM: 0.017},
    description: {
      pt: 'As distâncias relativas das supernovas DES-SN5YR delimitam Ωₘ em ΛCDM plano. A faixa se estende em H₀ porque a análise das supernovas sozinhas deixa a escala de distância livre.',
      en: 'The relative distances of DES-SN5YR supernovae constrain Ωₘ in flat ΛCDM. The band extends along H₀ because the supernova-only analysis leaves the distance scale free.',
    },
    sourceIds: ['des'],
    status: 'published',
  },
  pantheon: {
    label: {pt: 'Supernovas Pantheon+', en: 'Pantheon+ supernovae'},
    shortLabel: {pt: 'Pantheon+', en: 'Pantheon+'},
    anchor: {omegaM: 0.334, sigmaOmegaM: 0.018},
    description: {
      pt: 'Pantheon+ reúne supernovas de vários levantamentos. Aqui, a faixa usa apenas as distâncias relativas dessa amostra, com a escala de distância livre.',
      en: 'Pantheon+ pools supernovae from several surveys. Here the band uses only the relative distances from this sample, with a free distance scale.',
    },
    sourceIds: ['pantheon'],
    status: 'published',
  },
  ladder: {
    label: {pt: 'Escada de distâncias SH0ES', en: 'SH0ES distance ladder'},
    shortLabel: {pt: 'Escada · SH0ES', en: 'Ladder · SH0ES'},
    anchor: {h0: 73.04, sigmaH0: 1.04},
    description: {
      pt: 'Cefeidas calibram supernovas próximas e fornecem uma medição local da taxa de expansão. A faixa se estende em Ωₘ porque a referência usada aqui mede H₀.',
      en: 'Cepheids calibrate nearby supernovae and provide a local measurement of the expansion rate. The band extends along Ωₘ because the reference used here measures H₀.',
    },
    sourceIds: ['shoes'],
    status: 'published',
  },
};

export const LIVE_RESULT_DES_OFFSET = {magnitude: 0.03, before: 7.16, after: 0.52} as const;
export const LIVE_RESULT_LRG2 = {before: 4.65, after: 1.86} as const;
export const LIVE_RESULT_SHORT_RULER = {
  soundHorizon: 143.6,
  referenceSoundHorizon: 147.5,
  omegaMh2: 0.157,
  sigmaFromPlanck: 12.6,
} as const;
export const LIVE_RESULT_MASSLESS = {chi2Improvement: 4.3} as const;

export type LiveResultMetric = {
  label: Text;
  value: number;
  decimals: number;
  previous?: number;
  unit?: string;
};
export type LiveResultScenario = {
  label: Text;
  description: Text;
  consequence: Text;
  sourceIds: readonly LiveResultSourceId[];
  status: LiveResultStatus;
  metrics: readonly LiveResultMetric[];
  bao?: PlanePoint;
  joint?: PlanePoint;
};

const fitGainLabel: Text = {pt: 'Ganho de ajuste com w₀wₐ (Δχ²)', en: 'Fit improvement with w₀wₐ (Δχ²)'};
export const LIVE_RESULT_SCENARIOS: Record<ScenarioId, LiveResultScenario> = {
  baseline: {
    label: {pt: 'Referência', en: 'Reference'},
    description: {
      pt: 'Veja onde cada sonda restringe Ωₘ e H₀ sob ΛCDM plano.',
      en: 'See how each probe constrains Ωₘ and H₀ in flat ΛCDM.',
    },
    consequence: {
      pt: 'O Planck, o BAO com régua padrão e a escada indicam taxas de expansão diferentes.',
      en: 'Planck, BAO with the standard ruler and the distance ladder point to different expansion rates.',
    },
    sourceIds: ['synthesis'],
    status: 'provisional',
    metrics: [],
  },
  desOffset: {
    label: {pt: 'Offset do DES', en: 'DES offset'},
    description: {
      pt: 'A análise aplicou à amostra DES-Dovekie um deslocamento de magnitude estimado em Pantheon+. O valor abaixo compara os ajustes de DES-Dovekie com BAO do DESI DR2. A faixa DES-SN5YR mostra a referência publicada daquela amostra.',
      en: 'The analysis applied to DES-Dovekie a magnitude offset estimated in Pantheon+. The result below compares DES-Dovekie fits with DESI DR2 BAO. The DES-SN5YR band shows the published reference for that sample.',
    },
    consequence: {
      pt: 'Ao aplicar o offset, o ganho de ajuste com energia escura variável cai fortemente.',
      en: 'Applying the offset sharply reduces the fit improvement from evolving dark energy.',
    },
    sourceIds: ['offset', 'desi'],
    status: 'submitted',
    metrics: [
      {label: {pt: 'Deslocamento de magnitude', en: 'Magnitude offset'}, value: LIVE_RESULT_DES_OFFSET.magnitude, decimals: 2, unit: 'mag'},
      {label: fitGainLabel, previous: LIVE_RESULT_DES_OFFSET.before, value: LIVE_RESULT_DES_OFFSET.after, decimals: 2},
    ],
  },
  withoutLrg2: {
    label: {pt: 'Sem o bin LRG2', en: 'Without the LRG2 bin'},
    description: {
      pt: 'O contorno exclui as duas medições do grupo LRG2 e usa a submatriz da covariância para as distâncias restantes. O Δχ² compara modelos em pontos fixos com BAO sozinho.',
      en: 'The contour drops both LRG2 measurements and uses the covariance submatrix for the retained distances. Δχ² compares models at fixed points with BAO alone.',
    },
    consequence: {
      pt: 'O corte desloca o ajuste BAO para H₀ menor e Ωₘ maior.',
      en: 'The cut shifts the BAO fit toward lower H₀ and higher Ωₘ.',
    },
    sourceIds: ['synthesis', 'desi', 'baoMean', 'baoCovariance'],
    status: 'provisional',
    metrics: [{label: fitGainLabel, value: LIVE_RESULT_LRG2.after, decimals: 2}],
    bao: baoWithoutLrg2,
  },
  shortRuler: {
    label: {pt: 'Régua acústica encurtada', en: 'Shorter acoustic ruler'},
    description: {
      pt: 'O marcador mostra o ponto informado para o cenário de régua curta. Aplicar só o fator de comprimento ao ponto de referência daria outro H₀. Por isso, este cenário apresenta o ponto informado e sua comparação com o Planck.',
      en: 'The marker shows the reported point for the short-ruler scenario. Applying only the length factor to the reference point would give a different H₀. This scenario displays the reported point and its comparison with Planck.',
    },
    consequence: {
      pt: 'O BAO se aproxima da escada em H₀, mas se afasta do Planck em densidade física da matéria.',
      en: 'BAO moves closer to the ladder in H₀, while its physical matter density moves farther from Planck.',
    },
    sourceIds: ['synthesis', 'desi', 'planck'],
    status: 'provisional',
    metrics: [
      {label: {pt: 'Comprimento da régua', en: 'Ruler length'}, previous: LIVE_RESULT_SHORT_RULER.referenceSoundHorizon, value: LIVE_RESULT_SHORT_RULER.soundHorizon, decimals: 1, unit: 'Mpc'},
      {label: {pt: 'Densidade física da matéria (Ωₘh²)', en: 'Physical matter density (Ωₘh²)'}, value: LIVE_RESULT_SHORT_RULER.omegaMh2, decimals: 3},
      {label: {pt: 'Acima da referência de densidade do Planck', en: 'Above the Planck density reference'}, value: LIVE_RESULT_SHORT_RULER.sigmaFromPlanck, decimals: 1, unit: 'σ'},
    ],
    bao: baoShort,
  },
  masslessNeutrinos: {
    label: {pt: 'Neutrinos sem massa', en: 'Massless neutrinos'},
    description: {
      pt: 'O marcador indica o ajuste conjunto Planck + DESI quando a massa dos neutrinos é fixada em zero, sem acrescentar um parâmetro livre.',
      en: 'The marker shows the joint Planck + DESI fit with neutrino mass fixed to zero, without adding a free parameter.',
    },
    consequence: {
      pt: 'O ajuste conjunto melhora sob a hipótese de massa zero. Isso mede a sensibilidade à hipótese adotada.',
      en: 'The joint fit improves under the zero-mass assumption. This illustrates the fit’s sensitivity to the assumption.',
    },
    sourceIds: ['synthesis', 'planck', 'desi'],
    status: 'provisional',
    metrics: [
      {label: {pt: 'Redução de χ² no ajuste conjunto', en: 'Lower joint-fit χ²'}, value: LIVE_RESULT_MASSLESS.chi2Improvement, decimals: 1},
    ],
    joint: {omegaM: 0.2985, h0: 68.67},
  },
};

type Comparison = {label: Text; sigma: number; scenario: ScenarioId};
export const LIVE_RESULT_COMPARISONS: readonly Comparison[] = [
  {label: {pt: 'CMB × BAO', en: 'CMB × BAO'}, sigma: 2.25, scenario: 'baseline'},
  {label: {pt: 'BAO × DES-SN5YR', en: 'BAO × DES-SN5YR'}, sigma: 2.84, scenario: 'baseline'},
  {label: {pt: 'BAO × Pantheon+', en: 'BAO × Pantheon+'}, sigma: 1.82, scenario: 'baseline'},
  {label: {pt: 'CMB × escada', en: 'CMB × ladder'}, sigma: 5.13, scenario: 'baseline'},
  {label: {pt: 'BAO × escada', en: 'BAO × ladder'}, sigma: 3.88, scenario: 'baseline'},
  {label: {pt: 'BAO com régua curta × escada', en: 'Short-ruler BAO × ladder'}, sigma: 0.34, scenario: 'shortRuler'},
];

export const LIVE_RESULT_IMPLIED: readonly {probe: ProbeId; h0: number}[] = [
  {probe: 'des', h0: 63.8},
  {probe: 'pantheon', h0: 65.4},
  {probe: 'cmb', h0: 67.4},
  {probe: 'bao', h0: 69.4},
];

export const LIVE_RESULT_BAO_CONTOUR_NOTE: Text = {
  pt: 'O contorno de BAO é reconstruído das distâncias do DESI DR2 e da covariância, sob ΛCDM plano, com r_d = 147,5 Mpc fixo. Os contornos conjuntos seguem o mínimo da verossimilhança. O ponto da síntese é indicado à parte. A régua curta mostra o ponto informado, sem contorno reconstruído.',
  en: 'The BAO contour is reconstructed from the DESI DR2 distances and covariance in flat ΛCDM at fixed r_d = 147.5 Mpc. Joint contours follow the likelihood minimum. The synthesis point is marked separately. The short ruler shows the reported point, with no reconstructed contour.',
};

const footprints = new Map<string, readonly PlanePoint[]>();
export function baoFootprint(scenario: ScenarioId, percent: 68 | 95 = 68) {
  if (scenario === 'shortRuler') return undefined;
  const cut = scenario === 'withoutLrg2';
  const key = String(cut) + '-' + percent;
  if (!footprints.has(key)) footprints.set(key, makeBaoFootprint(LIVE_RESULT_SHORT_RULER.referenceSoundHorizon, cut, BAO_LEVEL[percent]));
  return footprints.get(key);
}

export function liveResultNumber(value: number, decimals: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en', {
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(value);
}
