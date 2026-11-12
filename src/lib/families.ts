import type {Line, Result, Status} from './schemas.ts';
import type {Localized} from './i18n.ts';

type Rule = {slug: string; title: Localized; description: Localized; pattern: RegExp};

// Editorial families based on the question being tested, not on fitted values or
// scientific status. Unknown questions stay individual until reviewed.
const rules: Rule[] = [
  {
    slug: 'redshift-exclusion',
    title: {'pt-BR': 'Energia escura: exclusão de faixas de redshift', en: 'Dark energy: redshift-bin exclusion'},
    description: {'pt-BR': 'Sensibilidade da preferência por energia escura evolutiva à retirada de intervalos de redshift.', en: 'Sensitivity of evolving-dark-energy preferences to the exclusion of redshift intervals.'},
    pattern: /^(?:How sensitive is the preference for evolving dark energy|Does the preference for evolving dark energy in .* persist when the ranges z = )/i
  },
  {
    slug: 'bao-tracer-exclusion',
    title: {'pt-BR': 'Dependência dos traçadores e grupos BAO', en: 'Dependence on BAO tracer families'},
    description: {'pt-BR': 'Persistência da preferência cosmológica ao retirar famílias de traçadores ou blocos BAO.', en: 'Persistence of cosmological preferences when BAO tracer families or blocks are excluded.'},
    pattern: /^Does the preference for evolving dark energy in .* persist when .*BAO.*excluded/i
  },
  {
    slug: 'redshift-concentration',
    title: {'pt-BR': 'Concentração do sinal por redshift', en: 'Redshift localisation of the signal'},
    description: {'pt-BR': 'Busca de intervalos dominantes nas comparações entre compilações de supernovas.', en: 'Tests of whether particular redshift intervals dominate supernova comparisons.'},
    pattern: /^(?:Repeat analysis: )?is the preference for evolving dark energy in .*concentrated in/i
  },
  {
    slug: 'bao-prior',
    title: {'pt-BR': 'Priors BAO e robustez da energia escura', en: 'BAO priors and dark-energy robustness'},
    description: {'pt-BR': 'Variações da escala BAO, de Ωm e das condições de exclusão.', en: 'Variations in the BAO scale, Ωm prior and exclusion conditions.'},
    pattern: /^With a BAO scale-parameter prior of/i
  },
  {
    slug: 'bao-dr1-dr2',
    title: {'pt-BR': 'DESI DR1 e DR2: dependência do release BAO', en: 'DESI DR1 versus DR2: BAO release dependence'},
    description: {'pt-BR': 'Comparação da preferência cosmológica ao substituir o release BAO.', en: 'Comparison of cosmological preferences when switching BAO releases.'},
    pattern: /^Does replacing DESI DR2 BAO with DR1/i
  },
  {
    slug: 'foreground-directions',
    title: {'pt-BR': 'Direção do ajuste e componentes BAO', en: 'Fit direction and BAO components'},
    description: {'pt-BR': 'Impacto de subconjuntos de galáxias e floresta Lyα sobre o ajuste.', en: 'Impact of galaxy and Lyα forest subsets on the fit.'},
    pattern: /^Does the direction of the preference for evolving dark energy/i
  },
  {
    slug: 'supernova-holdout',
    title: {'pt-BR': 'Exclusões individuais e prior de matéria', en: 'Individual exclusions and matter priors'},
    description: {'pt-BR': 'Persistência da preferência por energia escura dinâmica ao excluir regiões separadamente.', en: 'Persistence of dynamical-dark-energy preferences when regions are removed separately.'},
    pattern: /^In .+does the preference for dynamical dark energy persist after the separate exclusion/i
  },
  {
    slug: 'desi-dr1-tracers',
    title: {'pt-BR': 'Traçadores do DESI DR1 e parâmetros CPL', en: 'DESI DR1 tracers and CPL parameters'},
    description: {'pt-BR': 'Comparações de pontos CPL fixados em diferentes traçadores e redshifts.', en: 'Fixed-CPL point comparisons across tracers and redshifts.'},
    pattern: /^In DESI DR1, do /i
  },
  {
    slug: 'fixed-expansion-growth',
    title: {'pt-BR': 'Crescimento sob expansão CPL fixa', en: 'Growth under fixed CPL expansion'},
    description: {'pt-BR': 'Testes de observáveis de crescimento sob valores fixos de expansão.', en: 'Growth-observable tests under fixed expansion parameters.'},
    pattern: /^With expansion fixed at /i
  }
];

// Short titles for questions that stand alone. The full question stays in the record.
const shortTitles: Record<string, Localized> = {
  'T-02f7489641ed': {'pt-BR': 'R = 1 na derivação clássica da teoria efetiva', en: 'R = 1 in the classical derivation of the effective theory'},
  'T-0e94e9e2951b': {'pt-BR': 'Tendência de S₈ com o redshift no eROSITA', en: 'The S₈–redshift trend in eROSITA'},
  'T-1367215bcab5': {'pt-BR': 'Onde o sinal de energia escura aparece nas supernovas', en: 'Where the dark-energy signal sits in the supernova data'},
  'T-1835cc9958da': {'pt-BR': 'Correções quânticas e R = 1 no modelo bosônico mínimo', en: 'Quantum corrections and R = 1 in the minimal bosonic model'},
  'T-1ce99e7e0634': {'pt-BR': 'Precedentes na literatura para a cadeia teórica completa', en: 'Literature precedents for the complete theoretical chain'},
  'T-2205a23164a9': {'pt-BR': 'Início da supressão de crescimento associada a S₈', en: 'Onset of the growth suppression associated with S₈'},
  'T-2666d450a769': {'pt-BR': 'Grupos de traçadores BAO: Pantheon+ e DES-SN5YR, Ωm = 0,315 ± 0,03', en: 'BAO tracer groups: Pantheon+ and DES-SN5YR, Ωm = 0.315 ± 0.03'},
  'T-28160180cded': {'pt-BR': 'Intervalos BAO do DESI DR2: DES-SN5YR e Union3', en: 'DESI DR2 BAO bins: DES-SN5YR and Union3'},
  'T-3357f4745632': {'pt-BR': 'Autointeração da matéria escura em anãs e aglomerados', en: 'Dark-matter self-interaction in dwarfs and clusters'},
  'T-44aff9f2cbb1': {'pt-BR': 'Grupos de traçadores BAO: Pantheon+ e DES-SN5YR, Ωm = 0,3 ± 0,01', en: 'BAO tracer groups: Pantheon+ and DES-SN5YR, Ωm = 0.3 ± 0.01'},
  'T-5dd5dbe490a8': {'pt-BR': 'Holografia, escala meV e teoria efetiva local na literatura', en: 'Holography, the meV scale and a local effective theory in the literature'},
  'T-6b374d4280fa': {'pt-BR': 'Grupos de traçadores BAO: Pantheon+ e DES-SN5YR, Ωm = 0,33 ± 0,01', en: 'BAO tracer groups: Pantheon+ and DES-SN5YR, Ωm = 0.33 ± 0.01'},
  'T-7fee1af7c420': {'pt-BR': 'Busca de referências e citações da cadeia teórica', en: 'Reference and citation search for the theoretical chain'},
  'T-8de9463d750d': {'pt-BR': 'Intervalos BAO do DESI DR2: Pantheon+ e Union3, Ωm = 0,33 ± 0,01', en: 'DESI DR2 BAO bins: Pantheon+ and Union3, Ωm = 0.33 ± 0.01'},
  'T-9149c53edf29': {'pt-BR': 'Grupos de traçadores BAO: Pantheon+ e Union3, Ωm = 0,315 ± 0,03', en: 'BAO tracer groups: Pantheon+ and Union3, Ωm = 0.315 ± 0.03'},
  'T-9537693865ff': {'pt-BR': 'Mapa tridimensional do DESI DR1 e efeitos de seleção', en: 'A three-dimensional DESI DR1 map and selection effects'},
  'T-979f49b40eea': {'pt-BR': 'Anomalias da matéria escura fria e efeitos bariônicos', en: 'Cold-dark-matter anomalies and baryonic effects'},
  'T-991afb0ac010': {'pt-BR': 'Supressão de crescimento e a diferença de S₈ entre Planck e lentes', en: 'Growth suppression and the S₈ difference between Planck and lensing'},
  'T-9cdf8dcdf082': {'pt-BR': 'A escala de 2,3 meV na derivação holográfica', en: 'The 2.3 meV scale in the holographic derivation'},
  'T-bafb08d721ba': {'pt-BR': 'Escala de corte: floresta Lyman-α e galáxias satélites', en: 'Cutoff scale: the Lyman-α forest and satellite galaxies'},
  'T-bf77ab2aa7e0': {'pt-BR': 'Redes de citações dos precedentes parciais', en: 'Citation networks of the partial precedents'},
  'T-d9c9e3fb1f2f': {'pt-BR': 'Intervalos BAO do DESI DR2: Pantheon+ e Union3, Ωm = 0,315 ± 0,007', en: 'DESI DR2 BAO bins: Pantheon+ and Union3, Ωm = 0.315 ± 0.007'},
  'T-da1718e2d9b8': {'pt-BR': 'Supersimetria e a proteção de R = 1', en: 'Supersymmetry and the protection of R = 1'},
  'T-dcb222351488': {'pt-BR': 'Intervalos BAO do DESI DR2: Pantheon+ e Union3, Ωm = 0,315 ± 0,03', en: 'DESI DR2 BAO bins: Pantheon+ and Union3, Ωm = 0.315 ± 0.03'},
  'T-dda8417064f4': {'pt-BR': 'Autointeração da matéria escura dependente da velocidade', en: 'Velocity-dependent dark-matter self-interaction'},
  'T-efe9e688a928': {'pt-BR': 'Calibrações de massa por lentes fracas no eROSITA', en: 'Weak-lensing mass calibrations in eROSITA'}
};

export type Family = {
  slug: string;
  title: Localized;
  description: Localized;
  records: Result[];
  lines: Line[];
  statuses: Status[];
  updatedAt: string;
};

export function getFamilies(results: Result[]): Family[] {
  const grouped = new Map<string, Family>();
  for (const item of results) {
    const rule = rules.find(entry => entry.pattern.test(item.question.en));
    const slug = rule?.slug ?? item.slug;
    let family = grouped.get(slug);
    if (!family) {
      family = {
        slug,
        title: rule?.title ?? shortTitles[item.id] ?? item.question,
        // A question that stands alone is described by its own result.
        description: rule?.description ?? item.result,
        records: [],
        lines: [],
        statuses: [],
        updatedAt: item.updatedAt
      };
      grouped.set(slug, family);
    }
    family.records.push(item);
    for (const line of item.lines) if (!family.lines.includes(line)) family.lines.push(line);
    if (!family.statuses.includes(item.status)) family.statuses.push(item.status);
    if (item.updatedAt > family.updatedAt) family.updatedAt = item.updatedAt;
  }
  return [...grouped.values()].sort((a, b) => b.records.length - a.records.length || a.slug.localeCompare(b.slug));
}

export function getFamily(results: Result[], slug: string): Family | undefined {
  return getFamilies(results).find(family => family.slug === slug);
}

export function familyFor(results: Result[], item: Result): Family | undefined {
  return getFamilies(results).find(family => family.records.some(record => record.id === item.id));
}
