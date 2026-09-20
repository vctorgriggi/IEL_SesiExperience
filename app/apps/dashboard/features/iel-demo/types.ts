import type { CultureRespondent } from './analysis/culture';
import type { CultureInviteRole } from './analysis/culture-invites';
import type { ReferralOutcome } from './analysis/devolutiva';
import type { FitAxisId } from './analysis/fit-axes';
import type { ValorDaEscala } from './analysis/instrumento';

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
  /**
   * Valor proposto para o tema, no sentido do tema (1..5). Confirmado, vira a
   * resposta da gestão em todas as frases do tema — espelhada nas de polo −1.
   */
  value: ValorDaEscala;
  /** Trecho do texto existente que sustenta a proposta. */
  excerpt: string;
  /** De onde veio o trecho, nas palavras do produto. */
  sourceLabel: string;
  sourceId: DataSourceId;
};

/**
 * Resposta registrada sobre a cultura da empresa, numa frase do instrumento.
 *
 * `count` existe porque a consulta à equipe entra agregada: dez pessoas
 * marcando "concordo" na mesma frase viram um registro com count 10, sem
 * identificar ninguém. O tema sai da frase (`getItem(itemId).tema`).
 */
export type CultureAnswer = {
  id: string;
  companyId: string;
  /** Frase do instrumento (`I01`..`I52`). */
  itemId: string;
  /** Concordância, de 1 (discordo muito) a 5 (concordo muito). */
  value: ValorDaEscala;
  respondent: CultureRespondent;
  count: number;
  answeredAt: string;
  /**
   * Convite que originou esta resposta (M2).
   *
   * Opcional porque nem toda resposta vem de convite: a gestão responde pela
   * própria tela da empresa, e a base demo traz respostas de equipe já
   * agregadas. Quando existe, é o que permite marcar o convite como usado sem
   * guardar, do lado da resposta, quem a escreveu.
   */
  inviteId?: string;
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
  /** Preferência declarada no tema, no sentido do tema (1..5). */
  value: ValorDaEscala;
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
  /**
   * Percentual de match técnico calculado pelo Empregare (M6).
   *
   * Chega pela planilha que o IEL já exporta; a central não o recalcula nem o
   * corrige. Fica ao lado da aderência cultural, nunca somado a ela: são duas
   * medidas de naturezas diferentes, e foi somar tudo numa nota só que
   * produziu o Excel de três relatórios que a mesa de seleção substitui.
   *
   * `null` quando a planilha não trouxe o valor — o filtro do Empregare
   * configurado errado expurga candidato aderente (R10), e tratar ausência
   * como zero reproduziria o problema dentro da central.
   *
   * Opcional porque há recortes de candidatura montados por contratos que não
   * leem match técnico (o pedido da análise assistida, validado por schema
   * próprio). Ausente e `null` significam a mesma coisa aqui: não veio valor.
   */
  technicalMatch?: number | null;
  externalRef: ExternalRef;
};

/**
 * Situação da resposta do candidato ao questionário de fit.
 *
 * Derivada, nunca gravada: sai da existência da resposta e do prazo. R7 diz
 * que o candidato tem 1 a 2 dias e que "quem não responde sai do processo" —
 * mas quem sai do processo por não responder não é o mesmo que quem ainda tem
 * prazo, e a mesa de seleção precisa distinguir os dois para saber se cobra
 * ou se encerra.
 */
export type FitStatus = 'respondido' | 'pendente' | 'expirado';

/**
 * O que uma pessoa respondeu ao questionário de fit numa candidatura, com o
 * aceite (M3, M7, R4).
 *
 * **A resposta é da pessoa; a candidatura é o contexto.** O fit continua
 * sendo aplicado quando a pessoa se candidata (R4, 00:39:02) — é por ali que
 * o link chega e é dali que sai qual empresa pergunta o quê. Mas o que se
 * pergunta é como a pessoa prefere trabalhar, e isso é dela: "o que eu gosto
 * ou não é o candidato" (00:19:47). Por isso o registro carrega `talentId`, e
 * a pergunta "o que esta pessoa respondeu" é respondida pelo índice de
 * `analysis/respostas-da-pessoa.ts`, que lê todos os registros dela — não por
 * este registro sozinho. Resposta dentro da validade
 * (`VALIDADE_DA_RESPOSTA_MESES`) vale nas outras candidaturas dela; fora, é
 * como se não existisse.
 *
 * Guardar um registro por candidatura, em vez de uma segunda tabela por
 * pessoa, é a modelagem menos invasiva que sustenta isso: cada frase já tem
 * dono (`talentId`), instante (`answeredAt`) e o texto de aceite sob o qual
 * foi dada (`consent.version`), e não há duas cópias do mesmo dado para
 * divergirem.
 *
 * **Não carrega empresa.** Nem `companyId`, nem nome, nem nada que permita
 * reconstruí-los a partir daqui. R5 (00:22:21, 00:38:43): o nome da empresa
 * não aparece para o candidato antes da entrevista. O que ele vê da vaga vem
 * de `getCandidateJobView`: atividade, localidade, segmento e turno.
 *
 * **O aceite mora junto da resposta.** Consentimento é base legal (LGPD, art.
 * 7º, I) e precisa ser demonstrável com a versão do texto aceito e o momento.
 * A versão importa mais do que antes: só a resposta dada sob um texto que
 * previa o reaproveitamento pode ir para outra candidatura
 * (`VERSOES_DE_ACEITE_QUE_PERMITEM_REUSO`).
 */
export type CandidateFitResponse = {
  applicationId: string;
  /** A pessoa que respondeu. Fonte de verdade do dono da resposta. */
  talentId: string;
  /**
   * Concordância por frase (`itemId → 1..5`), nas frases respondidas **nesta**
   * candidatura. A mesma escala da equipe.
   *
   * Pode ser vazio: quando tudo o que a empresa pergunta já está respondido
   * dentro da validade, a pessoa confirma o reaproveitamento e o registro
   * existe só para guardar esse ato e o aceite. O conjunto que vale para a
   * candidatura sai de `respostasResolvidas`, nunca deste campo.
   */
  answers: Record<string, ValorDaEscala>;
  answeredAt: string;
  consent: { acceptedAt: string; version: string };
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
  /**
   * O que aconteceu com esta pessoa depois (C3).
   *
   * Fica no item, e não numa tabela à parte, porque o desfecho é do par
   * pessoa-vaga: a mesma pessoa pode ser contratada por uma empresa e não
   * por outra, e é a remessa que a empresa abre para responder.
   *
   * Não se confunde com `managerDecision`: aquilo é intenção de entrevistar,
   * isto é resultado. O ciclo do IEL fechava na intenção, e era justamente o
   * resultado que faltava.
   *
   * Opcional porque encaminhamentos gravados antes desta funcionalidade — no
   * `localStorage` de quem já abriu a demonstração — não têm o campo. Ler
   * sempre por `lerDevolutiva`, que trata ausência como "pendente".
   */
  outcome?: ReferralOutcome;
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

/**
 * Convite a um colaborador para responder o traçado cultural da empresa (M2).
 *
 * A analista cadastra e-mail corporativo, área e papel de uma amostra da
 * área; cada pessoa recebe um link próprio, sem login, válido por três dias.
 * Não há campo de nome, e não por esquecimento: a média não usa o nome, e um
 * nome ao lado de "respondeu" é o primeiro passo para ligar alguém à própria
 * resposta. Ver `analysis/culture-invites.ts` para as decisões de privacidade.
 */
export type CultureRespondentInvite = {
  id: string;
  companyId: string;
  /**
   * E-mail corporativo. É a chave de unicidade dentro da empresa e o único
   * contato que o reenvio e a cobrança precisam.
   */
  corporateEmail: string;
  role: CultureInviteRole;
  /** Área da pessoa, nas palavras da empresa. Ordena a leitura, não filtra. */
  area: string;
  /** Opaco: 16 hexadecimais derivados do id. Nunca contém dado pessoal. */
  token: string;
  sentAt: string;
  /** `sentAt` + 3 dias, ou estendido por reenvio. */
  expiresAt: string;
  answeredAt: string | null;
  /** Versão do texto de aceite. `null` enquanto não houver resposta. */
  consentVersion: string | null;
  /** Quantas vezes o convite foi reenviado (S4). */
  resendCount: number;
};

/**
 * Uma importação de planilha já aplicada (M6).
 *
 * Guarda a impressão digital do arquivo porque é ela que torna a reimportação
 * um no-op explícito: o analista que sobe a mesma planilha duas vezes vê "já
 * importada", e não a base duplicada.
 */
export type SpreadsheetImportRecord = {
  id: string;
  jobId: string;
  fingerprint: string;
  at: string;
  /** Origem dos registros: hoje a planilha da Empregare. */
  origin: string;
  sourceId: DataSourceId;
  counts: {
    newTalents: number;
    newApplications: number;
    updatedMatches: number;
    ignored: number;
    errors: number;
  };
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
   * Convites da amostra de colaboradores, por empresa (M2).
   *
   * Opcional pelo mesmo motivo de `axisWeights`: há recortes parciais de
   * `DemoState` montados para operações que não leem convite nenhum. Ausente
   * equivale a "nenhuma consulta foi aberta".
   */
  cultureInvites?: CultureRespondentInvite[];
  /**
   * Talentos criados por importação de planilha (M6).
   *
   * Ficam no estado, e não no catálogo, porque o catálogo é estático: quem
   * chegou pela planilha chegou durante a demonstração e precisa sobreviver ao
   * recarregamento junto do resto do progresso.
   */
  importedTalents?: Talent[];
  /** Importações de planilha já aplicadas, em ordem de aplicação. */
  spreadsheetImports?: SpreadsheetImportRecord[];
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
  /**
   * Respostas de fit dos candidatos, por candidatura.
   *
   * Opcional pelo mesmo motivo de `axisWeights`: há recortes parciais de
   * `DemoState` montados para operações que não leem resposta nenhuma (o
   * provedor determinístico do assistente, por exemplo). Ausente equivale a
   * "ninguém respondeu ainda".
   */
  fitResponses?: CandidateFitResponse[];
  clarifications: Clarification[];
  referrals: Referral[];
  history: HistoryEvent[];
  /** Ids de eventos de sincronização já aplicados (garante idempotência). */
  appliedSyncEventIds: string[];
  comparison: ComparisonSelection;
  referralList: ReferralListSelection;
  ui: DemoUiState;
};
