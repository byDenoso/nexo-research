import type {Locale} from './i18n.ts';
import type {Line, Status} from './schemas.ts';
import {BRAND_NAME, BRAND_SIGNATURE} from './brand.ts';

type Pair = {pt: string; en: string};
const t = (pt: string, en: string): Pair => ({pt, en});

export const D = {
  site: t(BRAND_NAME, BRAND_NAME),
  tagline: t(`${BRAND_SIGNATURE}. Pesquisa independente sobre as leis da natureza, o setor escuro e as origens cósmicas, com dados observacionais e testes computacionais.`, `${BRAND_SIGNATURE}. Independent research on the laws of nature, the dark sector and cosmic origins, using observational data and computational tests.`),
  mission: t(
    'O NEXO testa modelos cosmológicos com dados públicos. Hipóteses, critérios e limites são registrados antes do cálculo; os resultados são classificados de acordo com o estágio de verificação.',
    'NEXO tests cosmological models against public data. Hypotheses, criteria and limits are recorded before the calculation; results are classified according to their stage of verification.'
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
    kicker: t('Cosmologia', 'Cosmology'),
    headline: t('Testes observacionais de modelos cosmológicos', 'Observational tests of cosmological models'),
    caption: t('Número de resumos públicos que mencionam cada conjunto de dados. Fonte: catálogo público do NEXO.', 'Number of public summaries mentioning each dataset. Source: NEXO public catalogue.'),
    chartTitle: t('Conjuntos de dados nos resultados públicos', 'Data sets in the public results'),
    viewData: t('Ver dados', 'View data'),
    unit: t('resumos', 'summaries')
  },
  institute: {
    scope: t('A pesquisa em números', 'Research in numbers'),
    families: t('Perguntas científicas', 'Research questions'),
    executions: t('Análises documentadas', 'Documented analyses'),
    lines: t('Linhas com registros públicos', 'Research lines with records'),
    explore: t('Áreas de pesquisa e métodos', 'Research areas and methods'),
    research: t('Linhas de pesquisa e projetos em andamento.', 'Research areas and ongoing projects.'),
    methods: t('Critérios de teste, revisão e documentação.', 'Criteria for testing, review and documentation.'),
    data: t('Fontes dos dados e versões do catálogo público.', 'Data sources and public catalogue versions.')
  },
  who: {
    kicker: t('Pesquisador responsável', 'Research lead'),
    role: t('Direção científica', 'Scientific direction'),
    affiliation: t('Universidade Federal do Rio de Janeiro', 'Federal University of Rio de Janeiro'),
    orcid: t('ORCID', 'ORCID'), profile: t('Perfil científico', 'Scientific profile'), contact: t('Contato profissional', 'Professional contact'),
    pending: t('A ser informado pelo pesquisador', 'To be provided by the researcher')
  },
  how: {
    title: t('Como a pesquisa é feita', 'How the research is done'),
    lead: t('O protocolo define os critérios de teste, a documentação dos dados e a revisão dos resultados.', 'The protocol specifies test criteria, data documentation and review of results.'),
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
    lead: t('Áreas em investigação e respectivos resultados públicos.', 'Active research areas and associated public results.'),
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
    lead: t('Os resultados são agrupados por hipótese e método, com as condições de cada teste e o respectivo estado científico.', 'Results are grouped by hypothesis and method, with the conditions of each test and its scientific status.'),
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
    defaultNote: t('Resumo público de uma análise sem validação independente confirmada.', 'Public summary of an analysis without confirmed independent validation.')
  },
  status: {
    CANDIDATE: {n: t('Candidato', 'Candidate'), d: t('Análise ainda sem validação independente confirmada.', 'Analysis without confirmed independent validation.')},
    TESTING: {n: t('Em teste', 'Testing'), d: t('Em verificação por testes adicionais.', 'Under verification by additional tests.')},
    VALIDATED: {n: t('Validado', 'Validated'), d: t('Reproduzido e revisado dentro do critério do projeto.', 'Reproduced and reviewed within the project criteria.')},
    REFUTED: {n: t('Refutado', 'Refuted'), d: t('Contrariado por um teste posterior.', 'Contradicted by a later test.')},
    PUBLISHED: {n: t('Publicado', 'Published'), d: t('Descrito em publicação autorizada.', 'Described in an authorised publication.')}
  } satisfies Record<Status, {n: Pair; d: Pair}>,
  pubState: {INTERNAL: t('Interno', 'Internal'), PREPRINT: t('Preprint', 'Preprint'), SUBMITTED: t('Submetido', 'Submitted'), ACCEPTED: t('Aceito', 'Accepted'), PUBLISHED: t('Publicado', 'Published')},
  pubs: {
    title: t('Publicações', 'Publications'),
    lead: t('Artigos, notas e preprints autorizados para divulgação, com estado editorial e DOI quando disponível.', 'Papers, notes and preprints cleared for public release, with editorial status and DOI where available.'),
    empty: t('Nenhuma publicação foi autorizada para exibição pública até agora. Manuscritos em preparação ou em avaliação permanecem privados.', 'No publication has been cleared for public display so far. Manuscripts in preparation or under review remain private.'),
    bibtex: t('Copiar BibTeX', 'Copy BibTeX'), copied: t('BibTeX copiado', 'BibTeX copied'), pdf: t('PDF', 'PDF'), related: t('Resultados relacionados', 'Related results'),
    authors: t('Autores', 'Authors'), topic: t('Tema', 'Topic'), year: t('Ano', 'Year'), type: t('Estado', 'State')
  },
  projects: {title: t('Projetos', 'Projects'), lead: t('Projetos organizados pela pergunta investigada, com os resultados disponíveis no catálogo.', 'Projects organised by research question, with available results from the catalogue.'), state: {active: t('Em andamento', 'Active'), planned: t('Em preparação', 'In preparation'), paused: t('Pausado', 'Paused')}},
  research: {title: t('Pesquisa', 'Research'), lead: t('Testes da expansão cósmica, comparações entre sondas e buscas em catálogos de galáxias.', 'Tests of cosmic expansion, comparisons across probes and searches in galaxy catalogues.')},
  filters: {search: t('Buscar', 'Search'), line: t('Linha', 'Line'), status: t('Estado', 'Status'), all: t('Todas', 'All'), year: t('Ano', 'Year'), more: t('Mostrar mais', 'Show more'), records: t('Registros exibidos', 'Displayed records'), shown: t('exibidos', 'shown'), of: t('de', 'of'), none: t('Nenhum registro encontrado.', 'No records found.'), reset: t('Limpar filtros', 'Clear filters')},
  updates: {title: t('Atualizações', 'Updates'), lead: t('Mudanças no catálogo, no software e no site, da mais recente para a mais antiga.', 'Changes to the catalogue, the software and the site, most recent first.'), latest: t('Última atualização do catálogo', 'Latest catalogue update')},
  methods: {
    title: t('Métodos de análise', 'Methods of analysis'),
    lead: t('Comparação de modelos com ΛCDM, critérios definidos antes do ajuste e revisão dos resultados.', 'Model comparisons with ΛCDM, criteria set before fitting and review of the results.'),
    contents: t('Nesta página', 'On this page'),
    equation: t('Equação', 'Equation')
  },
  data: {
    title: t('Dados e fontes', 'Data and sources'),
    lead: t('Os resultados públicos provêm de uma versão identificada do catálogo. Estão disponíveis o arquivo para download, sua referência bibliográfica e os conjuntos de dados citados nos resumos.', 'The public results come from an identified release of the catalogue. The file is available for download, together with its citation and the datasets mentioned in the summaries.'),
    snapshot: t('Versão do catálogo público', 'Public catalogue release'), contract: t('Formato dos dados', 'Data format'), tests: t('Testes', 'Tests'), visuals: t('Figuras', 'Figures'), sha: t('SHA-256 do catálogo', 'Catalogue SHA-256'),
    mentioned: t('Conjuntos de dados citados nos resumos', 'Data sets named in the summaries'), count: t('resumos', 'summaries'),
    note: t('A contagem considera menções nos resumos. Não identifica uso exclusivo nem a versão de cada conjunto.', 'Counts are based on mentions in the summaries. They do not establish exclusive use or the version of each dataset.'),
    private: t('O catálogo público não contém registros privados da base de pesquisa (Tower).', 'The public catalogue excludes private records from the research database (Tower).')
  },
  code: {title: t('Código', 'Code'), lead: t('Código público do NEXO, incluindo as regras de validação e o código-fonte do site.', 'NEXO’s public software, including validation rules and the website source code.'), site: t('Código-fonte deste site', 'Source code of this site'), partial: t('O código de análise é liberado após reexecução. Cada resultado indica o material correspondente, quando disponível.', 'Analysis code is released after it has been rerun. Each result links to the corresponding material where available.'), none: t('Código de análise ainda não publicado. Cada resultado indica quando há código ou artefatos associados.', 'Analysis code is not yet published. Each result states when associated code or artefacts exist.')},
  about: {title: t('O instituto', 'The institute'), lead: t(`${BRAND_SIGNATURE}. Investigação independente do setor escuro e da evolução cósmica, dirigida por Dener Pereira. Os testes são publicados com suas condições e limites.`, `${BRAND_SIGNATURE}. Independent investigation of the dark sector and cosmic evolution, directed by Dener Pereira. Tests are published with their conditions and limits.`)},
  contact: {title: t('Contato e colaboração', 'Contact and collaboration'), lead: t('Para propor uma verificação independente, indique o registro do catálogo e a análise que pretende repetir.', 'To propose an independent check, identify the catalogue record and the analysis you would repeat.'), none: t('O canal de contato público será divulgado aqui pelo pesquisador.', 'The public contact channel will be published here by the researcher.')},
  footer: {navigation: t('Navegação do rodapé', 'Footer navigation'), line: t('Pesquisa independente em cosmologia com dados observacionais e testes computacionais.', 'Independent cosmology research using observational data and computational tests.'), source: t('Código-fonte', 'Source code'), private: t('Área privada', 'Private area'), data: t('Dados e referências', 'Data and references')},
  notFound: {title: t('Página não encontrada', 'Page not found'), back: t('Voltar ao início', 'Back to home')}
} as const;

export const tr = (pair: Pair, locale: Locale): string => pair[locale];
