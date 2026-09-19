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
};

export type TeamConditionStatus = 'confirmado' | 'da-descricao' | 'a-confirmar';

export type TeamCondition = {
  id: string;
  label: string;
  value: string;
  status: TeamConditionStatus;
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
  clarifications: Clarification[];
  referrals: Referral[];
  history: HistoryEvent[];
  /** Ids de eventos de sincronização já aplicados (garante idempotência). */
  appliedSyncEventIds: string[];
  comparison: ComparisonSelection;
  referralList: ReferralListSelection;
  ui: DemoUiState;
};
