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
        title: rule?.title ?? item.question,
        description: rule?.description ?? {
          'pt-BR': 'Pergunta individual do manifesto público. O método e os limites constam no registro.',
          en: 'Individual public-manifest question. The method and limitations are in its record.'
        },
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
