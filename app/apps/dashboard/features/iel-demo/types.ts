import type { CultureOptionId, CultureRespondent } from './analysis/culture';
import type { FitAxisId } from './analysis/fit-axes';

/**
 * Domínio da Central de Seleção IEL (protótipo).
 *
 * Toda a base é fictícia e vive no cliente. Os tipos existem para que a fonte
 * mock possa ser trocada por serviços reais sem reescrever a interface: as
 * telas consomem seletores, nunca as fixtures diretamente.
 */

/** Dimensões de compatibilidade analisadas por vaga. */
export type Dimension = 'tecnica' | 'profissional' | 'organizacional';

/** Estado de um critério dentro da análise de uma candidatura. */
export type CriterionState =
  | 'alinhamento'
  | 'a-esclarecer'
  | 'divergencia'
  | 'sem-informacao'
  | 'nao-se-aplica';

/** Origem simulada de um registro. */
export type DataSourceId =
  | 'FONTE-EMPREGARE'
  | 'FONTE-AVALIACAO'
  | 'FONTE-EMPRESA'
  | 'FONTE-IEL';

export type DataSourceStatus = 'ativa' | 'indisponivel';

export type DataSource = {
  id: DataSourceId;
  name: string;
  kind: string;
  description: string;
  /** Data fixa da base demo (ISO). */
  lastSyncAt: string;
  receivedRecords: number;
  status: DataSourceStatus;
  lastError: string | null;
};

/** Natureza da informação: relato, confirmação ou resultado de avaliação. */
export type EvidenceNature =
  | 'relato-do-candidato'
  | 'confirmado-pelo-gestor'
  | 'descricao-da-vaga'
  | 'registro-iel'
  | 'avaliacao-externa'
  | 'resposta-de-esclarecimento';

/** Quem pode ver a informação num encaminhamento. */
export type EvidenceVisibility = 'compartilhavel' | 'interno';

export type CriterionRef = {
  jobId: string;
  criterionId: string;
};

export type Evidence = {
  id: string;
  /** Talento a que a informação se refere (quando aplicável). */
  talentId: string | null;
  /** Equipe a que a informação se refere (condição de trabalho). */
  teamId: string | null;
  information: string;
  sourceId: DataSourceId;
  /** Texto curto de origem, ex.: "Currículo — experiência na Loja Horizonte". */
  originLabel: string;
  nature: EvidenceNature;
  /** Data fixa (ISO) da informação na base demo. */
  updatedAt: string;
  visibility: EvidenceVisibility;
  /** Critérios que esta informação ajuda a analisar. */
  links: CriterionRef[];
  /** Leitura do analista/IA sobre o alcance da informação. */
  interpretation: string;
};

export type ExternalAssessment = {
  id: string;
  talentId: string;
  method: string;
  sourceId: DataSourceId;
  appliedAt: string;
  scale: string;
  /** Resultados preservando a escala de origem. */
  results: { label: string; value: string }[];
  note: string;
};

export type Company = {
  id: string;
  name: string;
  sector: string;
  location: string;
  /** Descrição institucional declarada pela empresa. */
  institutionalDescription: string;
  contactName: string;
  contactEmail: string;
  sourceId: DataSourceId;
  updatedAt: string;
  /** O que a análise assistida propôs a partir dos textos da empresa. */
  cultureSuggestions: CultureSuggestion[];
};

/**
 * Proposta de traçado feita pela análise assistida a partir de texto que a
 * empresa já produziu.
 *
 * Fica pendente até alguém da empresa confirmar ou corrigir: o enunciado
 * exige supervisão humana e diz que recomendações apoiam, não substituem. O
 * trecho de origem acompanha a proposta para que a confirmação seja
 * informada, e não um clique no escuro.
 */
export type CultureSuggestion = {
  axisId: FitAxisId;
  optionId: CultureOptionId;
  /** Trecho do texto existente que sustenta a proposta. */
  excerpt: string;
  /** De onde veio o trecho, nas palavras do produto. */
  sourceLabel: string;
  sourceId: DataSourceId;
};

/**
 * Resposta registrada sobre a cultura da empresa.
 *
 * `count` existe porque a consulta à equipe entra agregada: dez pessoas
 * respondendo a mesma alternativa viram um registro com count 10, sem
 * identificar ninguém.
 */
export type CultureAnswer = {
  id: string;
  companyId: string;
  axisId: FitAxisId;
  optionId: CultureOptionId;
  respondent: CultureRespondent;
  count: number;
  answeredAt: string;
};

export type TeamConditionStatus = 'confirmado' | 'da-descricao' | 'a-confirmar';

export type TeamCondition = {
  id: string;
  /** Eixo de aderência que esta condição descreve, quando há um. */
  axisId?: FitAxisId;
  label: string;
  value: string;
  status: TeamConditionStatus;
  /**
   * Se a empresa chegou a informar algo neste eixo. Falso quando o registro
   * existe apenas para marcar a pergunta em aberto — um lado vazio não pode
   * divergir do outro.
   */
  informed?: boolean;
  origin: string;
  updatedAt: string;
};

export type Team = {
  id: string;
  companyId: string;
  name: string;
  routine: string;
  managerName: string;
  managerEmail: string;
  conditions: TeamCondition[];
};

export type JobCriterion = {
  id: string;
  label: string;
  /** Pergunta de análise que o critério responde. */
  question: string;
  dimension: Dimension;
  required: boolean;
  /** Quem confirmou o requisito na base demo. */
  confirmedBy: string;
};

/**
 * Peso que a empresa dá a um eixo de aderência nesta vaga.
 *
 * Existe porque o mesmo eixo não pesa igual em toda vaga: numa operação de
 * turno sem sobreposição, o apoio inicial decide a rotina; numa vaga de
 * escritório com colega ao lado, ele é secundário. Sem essa declaração, ou a
 * leitura trata os cinco eixos como equivalentes — e some justamente o que
 * a empresa considera crítico — ou alguém inventa uma ponderação escondida.
 *
 * O peso é declarado, não calculado, e pertence à empresa. Ele ordena a
 * leitura e a atenção; nunca vira multiplicador de nota, porque nota global
 * não existe neste produto.
 */
export type AxisWeight = 'alto' | 'medio' | 'baixo';

/**
 * Proposta de peso feita pela análise assistida a partir da descrição da vaga.
 *
 * Mesmo contrato de `CultureSuggestion`: a análise lê o texto que a empresa
 * já escreveu, propõe, mostra o trecho que sustenta e fica pendente até
 * alguém confirmar ou corrigir. O enunciado exige supervisão humana; uma
 * proposta que se aplica sozinha seria o ajuste automático de pesos que
 * decidimos não reproduzir.
 */
export type AxisWeightSuggestion = {
  axisId: FitAxisId;
  weight: AxisWeight;
  /** Trecho do texto da vaga que sustenta a proposta. */
  excerpt: string;
  sourceLabel: string;
  sourceId: DataSourceId;
};

export type JobStage = 'aberta' | 'em-selecao' | 'encerrada';

export type ExternalRef = {
  system: string;
  account: string;
  id: string;
};

export type Job = {
  id: string;
  title: string;
  companyId: string;
  teamId: string;
  location: string;
  workShift: string;
  stage: JobStage;
  summary: string;
  essentialRequirements: string[];
  organizationalContext: string;
  criteria: JobCriterion[];
  /** Peso declarado pela empresa por eixo. Ausente vale como 'medio'. */
  axisWeights: Partial<Record<FitAxisId, AxisWeight>>;
  /** O que a análise assistida propôs a partir do texto da vaga. */
  axisWeightSuggestions: AxisWeightSuggestion[];
  externalRef: ExternalRef;
  /** Última atualização simulada recebida da origem. */
  updatedAt: string;
};

export type TalentExperience = {
  id: string;
  role: string;
  organization: string;
  period: string;
  activities: string;
};

/**
 * O que a pessoa declarou sobre como prefere trabalhar.
 *
 * Espelha `TeamCondition` de propósito: o fit só é legível quando os dois
 * lados são descritos nos mesmos eixos, com a mesma procedência e o mesmo
 * tratamento para o que ainda não se sabe. Antes este lado era uma lista de
 * frases soltas, e a comparação só existia porque alguém a escrevera à mão.
 */
export type TalentPreference = {
  id: string;
  axisId: FitAxisId;
  /** O que a pessoa declarou, nas palavras dela. */
  value: string;
  origin: string;
  sourceId: DataSourceId;
  updatedAt: string;
};

/**
 * Resposta do talento ao mesmo questionário respondido pelas empresas.
 *
 * Convive com `TalentPreference` em vez de substituí-la: o texto livre explica
 * e guarda a origem, a alternativa posiciona no Mapa de Cultura.
 *
 * Sem `count` e sem `respondent` porque aqui responde uma pessoa por si, ao
 * contrário da consulta à equipe, que entra agregada.
 */
export type TalentCultureAnswer = {
  id: string;
  talentId: string;
  axisId: FitAxisId;
  optionId: CultureOptionId;
  origin: string;
  sourceId: DataSourceId;
  updatedAt: string;
};

export type Talent = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  city: string;
  email: string;
  experiences: TalentExperience[];
  declaredSkills: string[];
  expectations: string[];
  /** Preferências declaradas, nos mesmos eixos das condições da equipe. */
  preferences: TalentPreference[];
  externalRefs: ExternalRef[];
};

/** Etapa oficial recebida do sistema de recrutamento. */
export type ExternalStage =
  | 'inscrito'
  | 'triagem'
  | 'analise-tecnica'
  | 'entrevista-empresa';

/** Estado local da análise conduzida pelo IEL. */
export type AnalysisStage =
  | 'nao-iniciada'
  | 'em-andamento'
  | 'pronta-para-encaminhar';

/** Estado do encaminhamento da candidatura. */
export type ReferralStage =
  | 'nao-encaminhada'
  | 'na-lista'
  | 'encaminhada'
  | 'interesse-em-entrevista'
  | 'nao-avancou';

export type Application = {
  id: string;
  talentId: string;
  jobId: string;
  appliedAt: string;
  externalStage: ExternalStage;
  analysisStage: AnalysisStage;
  referralStage: ReferralStage;
  externalRef: ExternalRef;
};

export type CriterionAnalysis = {
  state: CriterionState;
  note: string;
  evidenceIds: string[];
  /** Origem da última atualização do critério, quando veio de esclarecimento. */
  updatedBy?: string;
  updatedAt?: string;
};

/** Análise local: `applicationId` → `criterionId` → estado. */
export type AnalysisByApplication = Record<
  string,
  Record<string, CriterionAnalysis>
>;

export type ClarificationRecipientKind = 'gestor' | 'candidato';

export type ClarificationState =
  | 'rascunho'
  | 'solicitada'
  | 'respondida'
  | 'incorporada'
  | 'cancelada';

export type ClarificationRecipient = {
  kind: ClarificationRecipientKind;
  name: string;
  role: string;
  email: string;
  companyId: string | null;
  teamId: string | null;
  talentId: string | null;
};

/** Sugestão de novo estado para um critério após a resposta. */
export type ClarificationEffect = {
  applicationId: string;
  criterionId: string;
  suggestedState: CriterionState;
  note: string;
};

export type Clarification = {
  id: string;
  jobId: string;
  /** Candidatura afetada; nulo quando a pergunta é sobre a equipe. */
  applicationId: string | null;
  criterionId: string;
  recipient: ClarificationRecipient;
  question: string;
  /** O que será compartilhado com o destinatário. */
  sharedInfo: string;
  reason: string;
  state: ClarificationState;
  createdAt: string;
  answeredAt: string | null;
  answer: string | null;
  /** Resposta fictícia preparada, revisável pelo destinatário. */
  preparedAnswer: string | null;
  /** Efeitos sugeridos quando a resposta for incorporada. */
  effects: ClarificationEffect[];
  incorporatedAt: string | null;
  /** Condição da equipe que a resposta confirma, quando houver. */
  teamConditionUpdate: {
    teamId: string;
    conditionId: string;
    value: string;
  } | null;
};

export type ReferralItem = {
  applicationId: string;
  justification: string;
  /** Snapshot: evidências compartilhadas no momento do registro. */
  sharedEvidenceIds: string[];
  /** Resumo congelado enviado à empresa. */
  summary: string;
  attentionPoints: string[];
  suggestedQuestions: string[];
  managerDecision: 'pendente' | 'quero-entrevistar' | 'nao-avancar';
  managerNote: string | null;
  decidedAt: string | null;
};

export type Referral = {
  id: string;
  jobId: string;
  companyId: string;
  message: string;
  state: 'rascunho' | 'registrado';
  createdAt: string | null;
  items: ReferralItem[];
};

export type HistoryEvent = {
  id: string;
  at: string;
  /** Persona que executou a ação. */
  actor: string;
  action: string;
  description: string;
  entityRef: string | null;
};

/** Evento fixo de atualização simulada recebido das fontes. */
export type SyncEvent = {
  id: string;
  sourceId: DataSourceId;
  title: string;
  description: string;
  /** Aplicação idempotente: candidaturas/talentos criados ou atualizados. */
  payload: {
    jobId: string;
    talentId: string;
    applicationId: string;
    externalStage: ExternalStage;
  };
};

export type PersonaKind = 'analista' | 'gestor' | 'candidato';

export type Persona = {
  id: string;
  kind: PersonaKind;
  label: string;
  description: string;
  companyId: string | null;
  talentId: string | null;
};

/** Seleção temporária para comparação, por vaga. */
export type ComparisonSelection = Record<string, string[]>;

/** Lista de encaminhamento em preparação, por vaga. */
export type ReferralListSelection = Record<string, string[]>;

export type DemoUiState = {
  jobsSearch: string;
  jobsCompanyId: string | 'todas';
  jobsStage: JobStage | 'todas';
  overviewCompanyId: string | 'todas';
};

export type DemoState = {
  schemaVersion: number;
  personaId: string;
  dataSources: DataSource[];
  applications: Application[];
  analysis: AnalysisByApplication;
  evidences: Evidence[];
  teams: Team[];
  cultureAnswers: CultureAnswer[];
  /**
   * Pesos confirmados ou corrigidos pela empresa durante a demonstração,
   * por vaga. Ficam no estado, e não na fixture, porque a vaga é catálogo
   * estático: a confirmação é ação de alguém, tem autor e hora, e precisa
   * sobreviver ao recarregamento junto do resto do progresso.
   *
   * Opcional porque há recortes parciais de `DemoState` montados para
   * operações que não leem peso nenhum (o provedor determinístico do
   * assistente, por exemplo). Ausente equivale a "ninguém corrigiu nada": a
   * leitura cai no peso declarado na vaga.
   */
  axisWeights?: Record<string, Partial<Record<FitAxisId, AxisWeight>>>;
  clarifications: Clarification[];
  referrals: Referral[];
  history: HistoryEvent[];
  /** Ids de eventos de sincronização já aplicados (garante idempotência). */
  appliedSyncEventIds: string[];
  comparison: ComparisonSelection;
  referralList: ReferralListSelection;
  ui: DemoUiState;
};
