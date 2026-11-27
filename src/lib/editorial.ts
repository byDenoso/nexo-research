import type {Locale} from './i18n.ts';
import type {Result} from './schemas.ts';
import {getFamilies, type Family} from './families.ts';
import {pick} from './i18n.ts';

export const redshiftQuestion = {'pt-BR': 'Quanto muda o ajuste ao retirar supernovas próximas?', en: 'How much does the fit change when nearby supernovae are removed?'};

// Reading layer only: never changes source numbers, IDs, family membership or scientific status.
const questions: Record<string, [string, string]> = {
  'redshift-exclusion': [redshiftQuestion['pt-BR'], redshiftQuestion.en],
  'bao-prior': ['Quanto a resposta depende das hipóteses do ajuste?', 'How much does the answer depend on the fitting assumptions?'],
  'bao-tracer-exclusion': ['Diferentes mapas de galáxias contam a mesma história?', 'Do different galaxy tracers tell the same story?'],
  'redshift-concentration': ['Em que parte da amostra aparece o sinal?', 'Where in the sample does the signal appear?'],
  'bao-dr1-dr2': ['O resultado muda quando o mapa do Universo é atualizado?', 'Does an updated map of the Universe change the result?'],
  'foreground-directions': ['Quais partes do mapa alteram a direção do ajuste?', 'Which parts of the map change the direction of the fit?'],
  'supernova-holdout': ['A preferência sobrevive à retirada de regiões da amostra?', 'Does the preference survive removing sample regions?'],
  'desi-dr1-tracers': ['Uma mesma expansão funciona para todos os traçadores?', 'Does one expansion history work for every tracer?'],
  'fixed-expansion-growth': ['A expansão e o crescimento das estruturas são compatíveis?', 'Are expansion and structure growth compatible?']
};
export type Reading = {question: string; finding: string; why: string; limit: string};
const stories: Record<string, {pt: Reading; en: Reading}> = {
  'T-05ae703af393': {
    pt: {question: redshiftQuestion['pt-BR'], finding: 'Retirar supernovas próximas enfraquece a preferência por energia escura variável.', why: 'Supernovas funcionam como indicadores de distância. A sensibilidade a uma faixa da amostra precisa ser quantificada antes de interpretar a preferência por outra história de expansão.', limit: 'A redução de cerca de 94% vale para esta configuração de DES-SN5YR, BAO e prior de matéria. Ela não identifica a causa física nem mede a probabilidade de uma teoria.'},
    en: {question: redshiftQuestion.en, finding: 'Removing nearby supernovae weakens the preference for evolving dark energy.', why: 'Supernovae serve as distance indicators. Sensitivity to a particular part of the sample must be quantified before interpreting a preference for a different expansion history.', limit: 'The roughly 94% reduction applies to this DES-SN5YR, BAO and matter-prior configuration. It neither identifies a physical cause nor measures the probability of a theory.'}
  },
  'T-0e94e9e2951b': {
    pt: {question: 'Um único intervalo sustenta a tendência dos aglomerados?', finding: 'Sem o intervalo mais distante, a tendência de S₈ enfraquece de 2,18σ para 0,35σ.', why: 'O crescimento de estruturas permite confrontar a história da expansão com o agrupamento da matéria. A retirada do intervalo mede a influência dessa faixa de redshift no ajuste.', limit: 'Ajuste a resumos publicados do eROSITA. As significâncias são nominais; não há correção global por múltiplos testes.'},
    en: {question: 'Does one bin sustain the cluster trend?', finding: 'Without the most distant bin, the S₈ trend weakens from 2.18σ to 0.35σ.', why: 'Structure growth allows the expansion history to be tested against the clustering of matter. Excluding the bin measures the influence of that redshift range on the fit.', limit: 'A fit to published eROSITA summaries. Significances are nominal, without a global multiple-testing correction.'}
  },
  'T-9cdf8dcdf082': {
    pt: {question: 'A teoria prevê a escala da energia escura?', finding: 'A escala de 2,283 meV depende de valores observados usados como entrada.', why: 'Uma previsão independente permite confrontar a teoria com um dado que não foi usado para construí-la. Verificamos se essa independência existe na derivação.', limit: 'Nesta formulação, a escala é recuperada de H₀ e da densidade observada de energia escura.'},
    en: {question: 'Does the theory predict the dark-energy scale?', finding: 'The 2.283 meV scale depends on observed values used as inputs.', why: 'An independent prediction can be tested with a measurement that was not used to build it. We check whether the derivation has that independence.', limit: 'In this formulation, the scale is recovered from H₀ and the observed dark-energy density.'}
  },
  'T-979f49b40eea': {
    pt: {question: 'As anomalias da matéria escura têm uma causa comum?', finding: 'Os resumos comparados não estabelecem uma nova propriedade comum da matéria escura.', why: 'Uma explicação comum precisaria dar conta de anomalias independentes depois de considerar a matéria visível e os erros de medida.', limit: 'Resultado negativo nesta comparação de resumos, condicionado às calibrações e ao tratamento dos dados; não exclui toda hipótese de matéria escura.'},
    en: {question: 'Do dark-matter anomalies share a common cause?', finding: 'The compared summaries do not establish a common new dark-matter property.', why: 'A common explanation would need to account for independent anomalies after visible matter and measurement errors are considered.', limit: 'A negative result in this summary comparison, conditional on calibrations and data treatment; it does not exclude all dark-matter hypotheses.'}
  }
};
// Context explains the scientific stakes for every current family; the reported
// result remains the source text unless a reviewed reading is defined above.
const context: Record<string, [string, string]> = {
  'redshift-exclusion': ['Supernovas funcionam como marcadores de distância. Retirar faixas da amostra ajuda a localizar quais observações mais influenciam a história da expansão.', 'Supernovae act as distance markers. Removing parts of the sample helps locate the observations that most affect the inferred expansion history.'],
  'redshift-concentration': ['Uma mudança na expansão precisa ser confrontada com diferentes épocas do Universo. Este teste procura a parte da amostra que mais influencia a conclusão.', 'A change in expansion must be tested across different cosmic epochs. This test locates the part of the sample that most influences the conclusion.'],
  'bao-prior': ['Mapas de galáxias fornecem uma régua para medir a expansão. Variar as hipóteses usadas no ajuste mostra quanto da resposta depende dessas escolhas.', 'Galaxy maps provide a ruler for measuring expansion. Varying the fitting assumptions reveals how much the answer depends on those choices.'],
  'bao-tracer-exclusion': ['Populações diferentes de galáxias medem a mesma expansão. Retirar uma população por vez testa quanto cada uma pesa na interpretação.', 'Different galaxy populations measure the same expansion. Removing one population at a time tests how much each contributes to the interpretation.'],
  'bao-dr1-dr2': ['Um mapa atualizado traz mais informação e também mudanças na análise. Comparar as versões ajuda a entender se a conclusão acompanha essas mudanças.', 'An updated map brings more information and changes in analysis. Comparing releases helps establish whether the conclusion follows those changes.'],
  'foreground-directions': ['As medidas cobrem populações e épocas diferentes. A comparação após excluir partes do levantamento verifica se suas contribuições para a inferência cosmológica são consistentes.', 'Measurements cover different populations and epochs. Comparing fits after excluding parts of the survey tests whether their contributions to cosmological inference are consistent.'],
  'supernova-holdout': ['A exclusão de grupos de observações mede a sensibilidade do ajuste à composição da amostra.', 'Excluding groups of observations measures the sensitivity of the fit to the sample composition.'],
  'desi-dr1-tracers': ['Duas histórias de expansão preveem distâncias diferentes. Compará-las em uma população de galáxias mostra qual descreve melhor aquele conjunto, sob as condições fixadas.', 'Two expansion histories predict different distances. Comparing them in one galaxy population shows which better describes that dataset under the fixed conditions.'],
  'fixed-expansion-growth': ['A gravidade faz a matéria se agrupar enquanto o Universo se expande. Fixar a expansão permite comparar separadamente previsões para esse crescimento.', 'Gravity makes matter cluster as the Universe expands. Fixing expansion allows separate comparisons of structure-growth predictions.'],
  'theory': ['Uma relação entre os coeficientes de uma teoria pode perder validade quando o cálculo inclui efeitos antes omitidos. A pergunta é se a relação permanece estável.', 'A relation among theoretical coefficients may change when previously omitted effects enter the calculation. The question is whether the relation remains stable.'],
  'literature': ['Uma proposta pode reunir peças já conhecidas. Comparar a cadeia completa com a literatura ajuda a identificar o que foi acrescentado e o que já tinha sido estabelecido.', 'A proposal can combine known ingredients. Comparing the complete chain with the literature helps identify what was added and what was already established.'],
  'growth': ['A distribuição da matéria guarda a história da formação de estruturas. Comparar medidas feitas em épocas e escalas diferentes ajuda a investigar por que elas divergem.', 'The distribution of matter records the history of structure formation. Comparing measurements across epochs and scales helps investigate why they differ.'],
  'dark-matter': ['Galáxias pequenas e aglomerados sondam a matéria escura em ambientes diferentes. Uma explicação física comum precisa ser compatível com ambos.', 'Small galaxies and clusters probe dark matter in different environments. A shared physical explanation needs to be compatible with both.'],
  'map': ['Um mapa do Universo também carrega a forma como o levantamento observou o céu. Separar essa seleção da distribuição real evita confundir cobertura com estrutura.', 'A map of the Universe also reflects how the survey observed the sky. Separating selection from the actual distribution avoids mistaking coverage for structure.'],
  'calibration': ['As massas dos aglomerados conectam as observações ao crescimento de estruturas. Diferenças de calibração podem alterar essa comparação e precisam ser quantificadas.', 'Cluster masses connect observations to structure growth. Calibration differences can alter that comparison and need to be quantified.']
};
const standalone: Record<string, [string, string, string]> = {
 'T-02f7489641ed':['theory','De onde vem a relação entre os coeficientes da teoria?','Where does the relation among the theory’s coefficients come from?'],
 'T-1835cc9958da':['theory','A relação da teoria resiste aos efeitos quânticos?','Does the theoretical relation survive quantum effects?'],
 'T-da1718e2d9b8':['theory','Uma simetria consegue proteger a relação da teoria?','Can a symmetry protect the theoretical relation?'],
 'T-1ce99e7e0634':['literature','A proposta completa já apareceu na literatura?','Has the complete proposal already appeared in the literature?'],
 'T-5dd5dbe490a8':['literature','Alguém já conectou todas as etapas dessa proposta?','Has anyone connected every step of this proposal?'],
 'T-7fee1af7c420':['literature','A busca bibliográfica já é suficiente para avaliar a novidade?','Is the literature search complete enough to assess novelty?'],
 'T-bf77ab2aa7e0':['literature','O que as redes de citações revelam sobre a novidade?','What do citation networks reveal about novelty?'],
 'T-2205a23164a9':['growth','Quando a matéria começou a se agrupar menos?','When did matter begin clustering less strongly?'],
 'T-991afb0ac010':['growth','Menos crescimento aproxima as medidas de estrutura?','Does weaker growth bring structure measurements closer?'],
 'T-3357f4745632':['dark-matter','Uma mesma interação funciona em galáxias e aglomerados?','Does the same interaction work in galaxies and clusters?'],
 'T-dda8417064f4':['dark-matter','A interação da matéria escura pode depender da velocidade?','Can dark-matter interactions depend on velocity?'],
 'T-bafb08d721ba':['dark-matter','As menores estruturas revelam como a matéria escura se comporta?','Can the smallest structures reveal how dark matter behaves?'],
 'T-9537693865ff':['map','O desenho do levantamento cria estruturas artificiais no mapa?','Can the survey footprint create artificial structures in the map?'],
 'T-efe9e688a928':['calibration','As diferentes maneiras de medir massas concordam?','Do different ways of measuring masses agree?'],
 'T-1367215bcab5':['redshift-concentration','Quais supernovas mais influenciam a resposta?','Which supernovae most influence the answer?']
};
const individualBao = new Set(['T-2666d450a769','T-28160180cded','T-44aff9f2cbb1','T-6b374d4280fa','T-8de9463d750d','T-9149c53edf29','T-d9c9e3fb1f2f','T-dcb222351488']);
// Readings of records that are listed in the catalogue but not featured on the home page.
const readings: Record<string, {pt: Reading; en: Reading}> = {
  'T-e24e3635d606': {
    pt: {question: 'A preferência por energia escura dinâmica vem do alto ℓ do Planck?', finding: 'Com o ACT DR6 no lugar do alto ℓ do Planck, a parte do CMB mantém 90% do seu ganho (4,93 contra 5,47) e o Δχ² total, 93% (10,42 contra 11,25).', why: 'É no alto ℓ que o Planck mostra o excesso de suavização por lenteamento e que os primeiros planos pesam mais. Se a preferência por w0–wa nascesse ali, ela cairia ao retirar ou trocar essa faixa do espectro.', limit: 'Uma execução por variante, sem reexecução independente. Os Δχ² são locais e não levam em conta as quatro variantes testadas.'},
    en: {question: 'Does the preference for dynamical dark energy come from high-ℓ Planck?', finding: 'With ACT DR6 in place of high-ℓ Planck, the CMB part keeps 90% of its improvement (4.93 against 5.47) and the total Δχ² keeps 93% (10.42 against 11.25).', why: 'High ℓ is where Planck shows its excess lensing smoothing and where foregrounds weigh most. If the w0–wa preference came from there, it would drop when that part of the spectrum is removed or replaced.', limit: 'One run per variation, not independently rerun. The Δχ² values are local and do not account for the four variations tested.'}
  },
  'T-ce70afbc7d0f': {
    pt: {question: 'A preferência por w0–wa depende do CMB do Planck?', finding: 'Com Planck, P-ACT, SPT-3G ou ACT+SPT, o Δχ² com BAO e supernovas fica entre 12,33 e 12,81.', why: 'Planck, ACT e SPT observam o CMB com instrumentos, céus e sistemáticos diferentes. Se a preferência dependesse de um deles, o Δχ² mudaria ao trocá-lo.', limit: 'Significâncias locais, para dois parâmetros extras, de uma execução por combinação. A calibração das supernovas do DES responde por cerca de um terço do ganho, tanto com o Planck quanto com ACT+SPT.'},
    en: {question: 'Does the w0–wa preference depend on Planck CMB?', finding: 'With Planck, P-ACT, SPT-3G or ACT+SPT, Δχ² with BAO and supernovae stays between 12.33 and 12.81.', why: 'Planck, ACT and SPT observe the CMB with different instruments, skies and systematics. If the preference depended on one of them, Δχ² would change when it is swapped.', limit: 'Local significances, for two extra parameters, from one run per combination. The DES supernova calibration accounts for about a third of the improvement, with Planck and with ACT+SPT alike.'}
  },
  'T-f9a449cdf10f': {
    pt: {question: 'Galáxias pobres em metais do DESI emitem He II nebular?', finding: 'No empilhamento de 69 galáxias com 12+log(O/H) < 8,0, He II/Hβ = 0,0057 (95%: 0,0045–0,0071).', why: 'He II nebular exige fótons acima de 54 eV, que estrelas comuns produzem pouco. A razão He II/Hβ mede quanta radiação desse tipo existe em galáxias com poucos metais, onde as estrelas massivas são mais quentes.', limit: 'Uma execução, sem reexecução independente, sobre 69 galáxias selecionadas pela calibração N2, que satura abaixo de 12+log(O/H) ≈ 8,0.'},
    en: {question: 'Do metal-poor DESI galaxies emit nebular He II?', finding: 'In the stack of 69 galaxies with 12+log(O/H) < 8.0, He II/Hβ = 0.0057 (95%: 0.0045–0.0071).', why: 'Nebular He II requires photons above 54 eV, which ordinary stars produce in small numbers. The He II/Hβ ratio measures how much of this radiation exists in galaxies with few metals, where massive stars run hotter.', limit: 'One run, not independently rerun, on 69 galaxies selected with the N2 calibration, which saturates below 12+log(O/H) ≈ 8.0.'}
  }
};
export const selectedIds = Object.keys(stories);
export const isNegative = (id: string) => id === 'T-979f49b40eea' || id === 'T-6b4cb4922cd0';
export function readResult(item: Result, locale: Locale): Reading {
  if (stories[item.id]) return stories[item.id]![locale];
  if (readings[item.id]) return readings[item.id]![locale];
  const family = getFamilies([item])[0]!.slug;
  const entry = standalone[item.id];
  const key = entry?.[0] ?? (individualBao.has(item.id) ? 'bao-tracer-exclusion' : family);
  const index = locale === 'pt' ? 0 : 1;
  return {
    question: entry?.[index + 1] ?? questions[key]?.[index] ?? pick(item.question, locale),
    finding: pick(item.result, locale),
    why: context[key]?.[index] ?? (locale === 'pt' ? 'A comparação deve ser interpretada dentro das condições do teste e da evidência disponível.' : 'The comparison must be interpreted within the test conditions and available evidence.'),
    limit: item.figure?.limitations[0] ? pick(item.figure.limitations[0], locale) : locale === 'pt' ? 'A conclusão se limita ao método e aos dados declarados neste registro. Limitações adicionais não constam do resumo público.' : 'The conclusion is limited to the method and data stated in this record. Additional limitations are not stated in the public summary.'
  };
}

export function familyQuestion(family: Family, locale: Locale) {
  return questions[family.slug]?.[locale === 'pt' ? 0 : 1] ?? readResult(family.records[0]!, locale).question;
}
export function familyEntry(family: Family) {
  return family.records.find(r => selectedIds.includes(r.id)) ?? family.records[0]!;
}
