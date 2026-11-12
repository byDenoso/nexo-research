import type {Locale} from './i18n.ts';
import type {Line, Status} from './schemas.ts';

type Pair = {pt: string; en: string};
const t = (pt: string, en: string): Pair => ({pt, en});

export const D = {
  site: t('NEXO Research Institute', 'NEXO Research Institute'),
  tagline: t('Pesquisa independente sobre expansão cósmica e energia escura. O catálogo reúne testes com dados astronômicos públicos.', 'Independent research on cosmic expansion and dark energy. The catalogue covers tests with public astronomical data.'),
  mission: t(
    'O NEXO testa modelos cosmológicos contra dados públicos, com hipóteses, critérios e limites registrados antes do resultado. Esta página reúne o que já foi calculado, o que ainda é candidato e o que falta verificar.',
    'NEXO tests cosmological models against public data, with hypotheses, criteria and limits recorded before the result. This site collects what has been computed, what is still a candidate and what remains to be verified.'
  ),
  skip: t('Ir para o conteúdo', 'Skip to content'),
  nav: {
    research: t('Pesquisa', 'Research'), results: t('Resultados', 'Results'), publications: t('Publicações', 'Publications'),
    projects: t('Projetos', 'Projects'), methods: t('Métodos', 'Methods'), data: t('Dados', 'Data'), code: t('Código', 'Code'),
    updates: t('Atualizações', 'Updates'), about: t('Sobre', 'About'), contact: t('Contato', 'Contact')
  },
  menu: t('Menu', 'Menu'),
  navigation: t('Navegação principal', 'Main navigation'),
  moreNavigation: t('Mais páginas', 'More pages'),
  theme: t('Alternar tema', 'Toggle theme'),
  language: t('Idioma', 'Language'),
  cta: {results: t('Ver resultados', 'View results'), research: t('Explorar a pesquisa', 'Explore the research'), all: t('Ver todos', 'See all')},
  hero: {
    kicker: t('Portal científico', 'Scientific portal'),
    headline: t('O Universo sob teste', 'Putting the universe to the test'),
    caption: t('Resumos públicos que citam cada conjunto de dados, contados por menção no texto. Fonte: manifesto público da Tower.', 'Public summaries naming each data set, counted by textual mention. Source: Tower public manifest.'),
    chartTitle: t('Conjuntos de dados nos resultados públicos', 'Data sets in the public results'),
    viewData: t('Ver dados', 'View data'),
    unit: t('resumos', 'summaries')
  },
  institute: {
    scope: t('A pesquisa em números', 'Research in numbers'),
    families: t('Perguntas e famílias científicas', 'Scientific questions and families'),
    executions: t('Registros de execução', 'Execution records'),
    lines: t('Linhas com registros públicos', 'Research lines with records'),
    explore: t('Da hipótese aos dados', 'From hypothesis to data'),
    research: t('Explore as frentes científicas e os projetos em andamento.', 'Explore research areas and ongoing projects.'),
    methods: t('Veja como cada hipótese é testada, revisada e documentada.', 'See how each hypothesis is tested, reviewed and documented.'),
    data: t('Consulte as fontes, o manifesto público e suas versões.', 'Consult the sources, the public manifest and its versions.')
  },
  who: {
    kicker: t('Quem desenvolve', 'Who develops it'),
    role: t('Direção científica', 'Scientific direction'),
    affiliation: t('Universidade Federal do Rio de Janeiro', 'Federal University of Rio de Janeiro'),
    orcid: t('ORCID', 'ORCID'), profile: t('Perfil científico', 'Scientific profile'), contact: t('Contato profissional', 'Professional contact'),
    pending: t('A ser informado pelo pesquisador', 'To be provided by the researcher')
  },
  how: {
    title: t('Como a pesquisa é feita', 'How the research is done'),
    lead: t('Cada resultado percorre as mesmas etapas. Abra uma etapa para ver o critério e onde encontrar a evidência.', 'Every result goes through the same stages. Open a stage to see its criterion and where to find the evidence.'),
    steps: [
      {k: 'hypothesis', n: t('Hipótese', 'Hypothesis'), d: t('A pergunta é escrita antes do cálculo, com o resultado que a refutaria.', 'The question is written before the calculation, together with the outcome that would refute it.')},
      {k: 'data', n: t('Dados', 'Data'), d: t('Conjuntos públicos, com versão e seleção registradas.', 'Public data sets, with version and selection recorded.')},
      {k: 'model', n: t('Modelagem', 'Modelling'), d: t('Modelo, parâmetros livres e fixos e priors declarados.', 'Model, free and fixed parameters and priors are declared.')},
      {k: 'tests', n: t('Testes', 'Tests'), d: t('Ajustes, comparações com a hipótese nula e verificações numéricas.', 'Fits, comparisons with the null hypothesis and numerical checks.')},
      {k: 'review', n: t('Revisão', 'Review'), d: t('Uma segunda leitura tenta refutar o resultado antes de ele ser descrito.', 'A second reading tries to refute the result before it is described.')},
      {k: 'result', n: t('Resultado', 'Result'), d: t('O valor, a condição do teste e o estado científico aparecem juntos.', 'The value, the test conditions and the scientific status appear together.')},
      {k: 'publication', n: t('Publicação', 'Publication'), d: t('Só o que foi autorizado vira artigo, nota ou preprint.', 'Only what has been authorised becomes a paper, note or preprint.')}
    ],
    evidence: t('Ver a metodologia', 'See the methodology')
  },
  lines: {
    title: t('Linhas de pesquisa', 'Research lines'),
    lead: t('Programas ativos. Cada cartão leva aos resultados públicos associados.', 'Active programmes. Each card leads to the associated public results.'),
    items: {
      expansion: {n: t('Expansão e energia escura', 'Expansion and dark energy'), d: t('Energia escura, história da expansão e tensão de H₀.', 'Dark energy, the expansion history and the H₀ tension.')},
      models: {n: t('Modelos e perturbações', 'Models and perturbations'), d: t('Modelos cosmológicos alternativos e a evolução de suas perturbações.', 'Alternative cosmological models and the evolution of their perturbations.')},
      probes: {n: t('CMB, BAO e crescimento', 'CMB, BAO and growth'), d: t('CMB, BAO, supernovas, crescimento de estruturas e ondas gravitacionais.', 'The CMB, BAO, supernovae, structure growth and gravitational waves.')},
      galaxies: {n: t('Galáxias e objetos exóticos', 'Galaxies and exotic objects'), d: t('JWST, LRDs e objetos compactos de alto redshift.', 'JWST, LRDs and compact high-redshift sources.')},
      'local-group': {n: t('Grupo Local', 'Local Group'), d: t('Dinâmica gravitacional da Via Láctea, de M31 e do Grupo Local.', 'Gravitational dynamics of the Milky Way, M31 and the Local Group.')},
      anomalies: {n: t('Anomalias em catálogos', 'Catalogue anomalies'), d: t('Detecção de anomalias e análise de catálogos astronômicos.', 'Anomaly detection and analysis of astronomical catalogues.')},
      reproducibility: {n: t('Reprodutibilidade', 'Reproducibility'), d: t('Métodos reexecutáveis e verificação de precedentes.', 'Re-runnable methods and precedent checks.')}
    } as Record<Line, {n: Pair; d: Pair}>,
    results: t('resultados públicos', 'public results'),
    projects: t('projetos', 'projects')
  },
  results: {
    title: t('Resultados científicos', 'Scientific results'),
    lead: t('Perguntas científicas agrupadas por método e hipótese. Cada família preserva suas execuções, condições e estados originais.', 'Scientific questions grouped by method and hypothesis. Each family preserves its original runs, conditions and statuses.'),
    selected: t('Perguntas em investigação', 'Questions under investigation'),
    question: t('Pergunta investigada', 'Question investigated'), answer: t('Interpretação física', 'Physical interpretation'),
    method: t('Condições do teste', 'Test conditions'), result: t('Resultado', 'Result'), limits: t('Limitações específicas', 'Specific limitations'),
    status: t('Estado científico', 'Scientific status'), id: t('Identificador', 'Identifier'), updated: t('Atualizado', 'Updated'), publicRecordDate: t('Data do registro público', 'Public record date'),
    provenance: t('Proveniência', 'Provenance'), refs: t('Referências', 'References'), code: t('Código e artefatos', 'Code and artefacts'),
    dataset: t('Conjunto de dados', 'Dataset'), dataVersion: t('Versão dos dados', 'Data version'), model: t('Modelo', 'Model'), statMethod: t('Método estatístico', 'Statistical method'), params: t('Principais parâmetros', 'Main parameters'),
    notInSummary: t('Não consta no resumo público.', 'Not stated in the public summary.'),
    figure: t('Valor-chave', 'Key figure'), figureSource: t('Fonte', 'Source'),
    plain: t('Em linguagem direta', 'In plain language'),
    back: t('Todos os resultados', 'All results'),
    notFound: t('Resultado não encontrado.', 'Result not found.'),
    defaultNote: t('Resumo público de um teste interno, ainda sem validação independente nem publicação.', 'Public summary of an internal test, not yet independently validated or published.')
  },
  status: {
    CANDIDATE: {n: t('Candidato', 'Candidate'), d: t('Resultado interno ainda sem validação independente.', 'Internal result without independent validation yet.')},
    TESTING: {n: t('Em teste', 'Testing'), d: t('Em verificação por testes adicionais.', 'Under verification by additional tests.')},
    VALIDATED: {n: t('Validado', 'Validated'), d: t('Reproduzido e revisado dentro do critério do projeto.', 'Reproduced and reviewed within the project criteria.')},
    REFUTED: {n: t('Refutado', 'Refuted'), d: t('Contrariado por um teste posterior.', 'Contradicted by a later test.')},
    PUBLISHED: {n: t('Publicado', 'Published'), d: t('Descrito em publicação autorizada.', 'Described in an authorised publication.')}
  } satisfies Record<Status, {n: Pair; d: Pair}>,
  pubState: {INTERNAL: t('Interno', 'Internal'), PREPRINT: t('Preprint', 'Preprint'), SUBMITTED: t('Submetido', 'Submitted'), ACCEPTED: t('Aceito', 'Accepted'), PUBLISHED: t('Publicado', 'Published')},
  pubs: {
    title: t('Publicações', 'Publications'),
    lead: t('Artigos, notas e preprints cuja divulgação foi autorizada. O estado editorial é o real; nenhum DOI é gerado aqui.', 'Papers, notes and preprints cleared for public release. The editorial state is the real one; no DOI is generated here.'),
    empty: t('Nenhuma publicação foi autorizada para exibição pública até agora. Manuscritos em preparação ou em avaliação permanecem privados.', 'No publication has been cleared for public display so far. Manuscripts in preparation or under review remain private.'),
    bibtex: t('Copiar BibTeX', 'Copy BibTeX'), copied: t('BibTeX copiado', 'BibTeX copied'), pdf: t('PDF', 'PDF'), related: t('Resultados relacionados', 'Related results'),
    authors: t('Autores', 'Authors'), topic: t('Tema', 'Topic'), year: t('Ano', 'Year'), type: t('Estado', 'State')
  },
  projects: {title: t('Projetos', 'Projects'), lead: t('Programas de pesquisa, descritos pela pergunta que cada um procura responder e pelos registros que já têm no catálogo.', 'Research programmes, described by the question each one tries to answer and by the records they already have in the catalogue.'), state: {active: t('Em andamento', 'Active'), planned: t('Em preparação', 'In preparation'), paused: t('Pausado', 'Paused')}},
  research: {title: t('Pesquisa', 'Research'), lead: t('Consulte os testes de expansão, as comparações entre sondas e as buscas em catálogos de galáxias. Cada linha leva aos registros associados.', 'Find expansion tests, comparisons across probes and searches in galaxy catalogues. Each research area links to its records.')},
  filters: {search: t('Buscar', 'Search'), line: t('Linha', 'Line'), status: t('Estado', 'Status'), all: t('Todas', 'All'), year: t('Ano', 'Year'), more: t('Mostrar mais', 'Show more'), records: t('Registros exibidos', 'Displayed records'), shown: t('exibidos', 'shown'), of: t('de', 'of'), none: t('Nenhum registro encontrado.', 'No records found.'), reset: t('Limpar filtros', 'Clear filters')},
  updates: {title: t('Atualizações', 'Updates'), lead: t('Mudanças no catálogo, no software e no site, da mais recente para a mais antiga.', 'Changes to the catalogue, the software and the site, most recent first.'), latest: t('Última atualização do manifesto', 'Latest manifest update')},
  methods: {
    title: t('Métodos e reprodutibilidade', 'Methods and reproducibility'),
    lead: t('Veja como os testes comparam modelos ao ΛCDM, quais critérios entram antes do ajuste e como o resultado é revisado.', 'See how tests compare models with ΛCDM, which criteria are set before fitting and how results are reviewed.'),
    contents: t('Nesta página', 'On this page'),
    equation: t('Equação', 'Equation')
  },
  data: {
    title: t('Dados e fontes', 'Data and sources'),
    lead: t('Os números deste site vêm de um único arquivo público, o snapshot do catálogo. Esta página mostra a versão em uso, como baixá-la, como citá-la e quais conjuntos de dados aparecem nos resumos.', 'The numbers on this site come from one public file, the catalogue snapshot. This page shows the version in use, how to download it, how to cite it and which data sets appear in the summaries.'),
    snapshot: t('Snapshot público em uso', 'Public snapshot in use'), contract: t('Contrato', 'Contract'), tests: t('Testes', 'Tests'), visuals: t('Figuras', 'Figures'), sha: t('SHA-256 do snapshot', 'Snapshot SHA-256'),
    mentioned: t('Conjuntos de dados citados nos resumos', 'Data sets named in the summaries'), count: t('resumos', 'summaries'),
    note: t('Contagem por menção textual nos resumos públicos; não indica uso exclusivo nem versão.', 'Counted by textual mention in the public summaries; it does not indicate exclusive use or version.'),
    private: t('Registros internos da Tower permanecem privados e não são lidos por este site.', 'Internal Tower records remain private and are not read by this site.')
  },
  code: {title: t('Código', 'Code'), lead: t('Software público do instituto. As regras de validação e o código deste site estão abertos para leitura e teste.', 'The public software of the institute. The validation rules and the source of this site are open to read and test.'), site: t('Código-fonte deste site', 'Source code of this site'), partial: t('Os scripts de análise de cada registro ainda não estão publicados. Quando houver código ou artefatos de um resultado, eles aparecem no próprio registro.', 'The analysis scripts behind each record are not yet published. When code or artefacts exist for a result, they appear on its record.'), none: t('Código de análise ainda não publicado. Cada resultado indica quando há código ou artefatos associados.', 'Analysis code is not yet published. Each result states when associated code or artefacts exist.')},
  about: {title: t('O instituto', 'The institute'), lead: t('Instituto independente de pesquisa em cosmologia, dirigido por Dener Pereira. Testamos hipóteses com dados públicos e publicamos cada teste com suas condições e seus limites.', 'An independent research institute in cosmology, directed by Dener Pereira. We test hypotheses against public data and publish each test with its conditions and limits.')},
  contact: {title: t('Contato e colaboração', 'Contact and collaboration'), lead: t('Para propor uma verificação independente, indique o registro do catálogo e a análise que pretende repetir.', 'To propose an independent check, identify the catalogue record and the analysis you would repeat.'), none: t('O canal de contato público será divulgado aqui pelo pesquisador.', 'The public contact channel will be published here by the researcher.')},
  footer: {navigation: t('Navegação do rodapé', 'Footer navigation'), line: t('O catálogo reúne os testes autorizados para divulgação.', 'The catalogue contains the tests cleared for public release.'), source: t('Código-fonte', 'Source code'), private: t('Área privada', 'Private area'), data: t('Dados: manifesto público da Tower', 'Data: public Tower manifest')},
  notFound: {title: t('Página não encontrada', 'Page not found'), back: t('Voltar ao início', 'Back to home')}
} as const;

export const tr = (pair: Pair, locale: Locale): string => pair[locale];
