import {
  JANELA_DO_MARCO_DIAS,
  marcoAberto,
  marcoAlcancado,
  marcoPerdido,
  MARCOS_DO_ACOMPANHAMENTO,
  type CheckIn,
  type FonteDaPermanencia,
  type MarcoDoAcompanhamento,
  type SituacaoDeContratacao
} from '../analysis/acompanhamento';
import {
  ADHERENCE_THRESHOLD,
  computeAdherence,
  computeThemeAdherence,
  emptyAdherence,
  type AdherenceResult,
  type CandidateAxisValues,
  type CompanyAxisMeans,
  type CompanyItemMeans
} from '../analysis/adherence';
import {
  CANDIDATE_CONSENT_VERSION,
  validaAte,
  VALIDADE_DA_RESPOSTA_MESES
} from '../analysis/candidate-questionnaire';
import {
  CRITERION_STATE_META,
  getCoverage,
  getCriterionAnalysis,
  type CoverageSummary
} from '../analysis/criterion-states';
import {
  calcularPerfilCultural,
  marcaDaEmpresa,
  MIN_RESPOSTAS_ANONIMAS,
  MIN_TEAM_RESPONSES,
  type CultureDispersion,
  type CultureRespondent,
  type PerfilCultural,
  type PerfilDoTema,
  type PerguntaDoCandidato
} from '../analysis/culture';
import {
  getSuggestedSampleSize,
  type CultureInviteRole
} from '../analysis/culture-invites';
import {
  diasEntre,
  diasEsperando,
  estadoDaPermanencia,
  lerDevolutiva,
  temDevolutiva,
  type EstadoDaPermanencia,
  type ReferralOutcome
} from '../analysis/devolutiva';
import {
  FIT_AXES,
  FIT_AXIS_IDS,
  getFitAxis,
  MAXIMO_DE_COMPETENCIAS,
  ordenarCompetencias,
  type FitAxis,
  type FitAxisId
} from '../analysis/fit-axes';
import {
  blocoDoConvite,
  configuracaoDoInstrumento,
  discrimina,
  getItem,
  itemAtivo,
  itemPadraoDoTema,
  itensAtivosDoTema,
  rotuloDaEscala,
  type ConfiguracaoDoInstrumento,
  type ItemDoInstrumento
} from '../analysis/instrumento';
import {
  calcularEncaixeCultural,
  calcularPosicaoCultural,
  classificarCultura,
  compararRespostas,
  type ClassificacaoCultural,
  type EncaixeCultural,
  type LeituraDeEixo,
  type PosicaoCultural,
  type RespostaDeEixo
} from '../analysis/mapa-cultural';
import {
  buildReportToken,
  findMostDivergentAxis,
  formatExperienceSpan,
  initialsOf,
  readAxisMatch,
  type ReportAxisMatch
} from '../analysis/referral-report';
import {
  indexarRespostasPorPessoa,
  resolverRespostas,
  type IndiceDeRespostas,
  type RespostasDaPessoa,
  type RespostasResolvidas
} from '../analysis/respostas-da-pessoa';
import {
  ALL_COMPANIES,
  ALL_JOBS,
  ALL_TALENT_CULTURE_ANSWERS,
  ALL_TALENTS,
  DEMO_ASSESSMENTS,
  DEMO_CATALOG,
  DEMO_DATA_SOURCES,
  DEMO_PERSONAS
} from '../fixtures';
import { getOutcomesBase } from '../fixtures/outcomes';
import {
  getRegiao,
  regiaoDaLocalizacao,
  type RegiaoAtendimento
} from '../fixtures/regioes';
import { plural } from '../format';
import type {
  Application,
  AxisWeight,
  AxisWeightSuggestion,
  CandidateFitResponse,
  Clarification,
  Company,
  CriterionRef,
  CriterionState,
  CultureAnswer,
  CultureRespondentInvite,
  CultureSuggestion,
  DataSourceId,
  DemoState,
  Dimension,
  Evidence,
  ExternalAssessment,
  ExternalStage,
  FitStatus,
  Job,
  JobCriterion,
  Persona,
  Referral,
  ReferralItem,
  SpreadsheetImportRecord,
  Talent,
  TalentPreference,
  Team,
  TeamCondition
} from '../types';

export { getSuggestedSampleSize };

export const EXTERNAL_STAGE_LABEL: Record<ExternalStage, string> = {
  inscrito: 'Inscrito',
  triagem: 'Triagem',
  'analise-tecnica': 'Análise técnica',
  'entrevista-empresa': 'Entrevista na empresa'
};

export const ANALYSIS_STAGE_LABEL: Record<string, string> = {
  'nao-iniciada': 'Análise não iniciada',
  'em-andamento': 'Análise em andamento',
  'pronta-para-encaminhar': 'Análise pronta para encaminhar'
};

export const REFERRAL_STAGE_LABEL: Record<string, string> = {
  'nao-encaminhada': 'Não encaminhada',
  'na-lista': 'Na lista de encaminhamento',
  encaminhada: 'Encaminhada à empresa',
  'interesse-em-entrevista': 'Empresa quer entrevistar',
  'nao-avancou': 'Empresa não avançou'
};

export const CLARIFICATION_STATE_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  solicitada: 'Solicitada',
  respondida: 'Respondida',
  incorporada: 'Incorporada à análise',
  cancelada: 'Cancelada'
};

export const JOB_STAGE_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  'em-selecao': 'Em seleção',
  encerrada: 'Encerrada'
};

export function getPersona(state: DemoState): Persona {
  return (
    DEMO_PERSONAS.find((persona) => persona.id === state.personaId) ??
    DEMO_PERSONAS[0]!
  );
}

/*
 * Índices do catálogo estático. Com ~2.500 empresas, `find` a cada linha de
 * tabela vira custo real; o catálogo não muda em tempo de execução, então os
 * mapas são montados uma vez no carregamento do módulo.
 */
const COMPANY_BY_ID = new Map(
  ALL_COMPANIES.map((company) => [company.id, company])
);
const JOB_BY_ID = new Map(ALL_JOBS.map((job) => [job.id, job]));
const TALENT_BY_ID = new Map(ALL_TALENTS.map((talent) => [talent.id, talent]));
const JOBS_BY_COMPANY_ID = ALL_JOBS.reduce((mapa, job) => {
  const lista = mapa.get(job.companyId);
  if (lista) lista.push(job);
  else mapa.set(job.companyId, [job]);
  return mapa;
}, new Map<string, Job[]>());

export function getCompany(companyId: string): Company | null {
  return COMPANY_BY_ID.get(companyId) ?? null;
}

export function getJob(jobId: string): Job | null {
  return JOB_BY_ID.get(jobId) ?? null;
}

/**
 * O talento, no catálogo ou entre os que chegaram por importação (M6).
 *
 * `state` é opcional para não quebrar as chamadas que só precisam do catálogo
 * estático. Sem ele, quem entrou pela planilha não é encontrado — por isso
 * toda leitura que possa alcançar uma candidatura importada passa o estado.
 */
export function getTalent(talentId: string, state?: DemoState): Talent | null {
  return (
    TALENT_BY_ID.get(talentId) ??
    state?.importedTalents?.find((talent) => talent.id === talentId) ??
    null
  );
}

export function getTeam(state: DemoState, teamId: string): Team | null {
  return state.teams.find((team) => team.id === teamId) ?? null;
}

export function getTeamsByCompany(state: DemoState, companyId: string): Team[] {
  return state.teams.filter((team) => team.companyId === companyId);
}

export function getAssessments(talentId: string): ExternalAssessment[] {
  return DEMO_ASSESSMENTS.filter(
    (assessment) => assessment.talentId === talentId
  );
}

export function getApplication(
  state: DemoState,
  applicationId: string
): Application | null {
  return (
    state.applications.find(
      (application) => application.id === applicationId
    ) ?? null
  );
}

export function getApplicationsByJob(
  state: DemoState,
  jobId: string
): Application[] {
  return state.applications.filter(
    (application) => application.jobId === jobId
  );
}

export function getApplicationsByTalent(
  state: DemoState,
  talentId: string
): Application[] {
  return state.applications.filter(
    (application) => application.talentId === talentId
  );
}

export function getJobsByCompany(companyId: string): Job[] {
  return JOBS_BY_COMPANY_ID.get(companyId) ?? [];
}

export function getCriterion(
  job: Job,
  criterionId: string
): JobCriterion | null {
  return job.criteria.find((criterion) => criterion.id === criterionId) ?? null;
}

function matchesLink(link: CriterionRef, ref: CriterionRef): boolean {
  return link.jobId === ref.jobId && link.criterionId === ref.criterionId;
}

/** Evidências vinculadas a um critério, filtradas pelo talento da candidatura. */
export function getEvidencesForCriterion(
  state: DemoState,
  application: Application,
  criterionId: string
): Evidence[] {
  const ref = { jobId: application.jobId, criterionId };
  const job = getJob(application.jobId);
  const teamId = job?.teamId ?? null;

  return state.evidences.filter((evidence) => {
    if (!evidence.links.some((link) => matchesLink(link, ref))) return false;
    if (evidence.talentId) return evidence.talentId === application.talentId;
    if (evidence.teamId) return evidence.teamId === teamId;
    return false;
  });
}

export function getEvidencesByIds(state: DemoState, ids: string[]): Evidence[] {
  return ids
    .map((id) => state.evidences.find((evidence) => evidence.id === id))
    .filter((evidence): evidence is Evidence => Boolean(evidence));
}

export function getEvidencesByTalent(
  state: DemoState,
  talentId: string
): Evidence[] {
  return state.evidences.filter((evidence) => evidence.talentId === talentId);
}

export function getClarificationsByJob(
  state: DemoState,
  jobId: string
): Clarification[] {
  return state.clarifications.filter(
    (clarification) => clarification.jobId === jobId
  );
}

export function getClarificationsByApplication(
  state: DemoState,
  applicationId: string
): Clarification[] {
  return state.clarifications.filter(
    (clarification) => clarification.applicationId === applicationId
  );
}

export function getClarification(
  state: DemoState,
  clarificationId: string
): Clarification | null {
  return (
    state.clarifications.find(
      (clarification) => clarification.id === clarificationId
    ) ?? null
  );
}

export function getOpenClarifications(state: DemoState): Clarification[] {
  return state.clarifications.filter(
    (clarification) =>
      clarification.state === 'solicitada' || clarification.state === 'rascunho'
  );
}

export function getAnsweredClarifications(state: DemoState): Clarification[] {
  return state.clarifications.filter(
    (clarification) => clarification.state === 'respondida'
  );
}

export function getReferral(
  state: DemoState,
  referralId: string
): Referral | null {
  return state.referrals.find((referral) => referral.id === referralId) ?? null;
}

export function getReferralsByCompany(
  state: DemoState,
  companyId: string
): Referral[] {
  return state.referrals.filter(
    (referral) =>
      referral.companyId === companyId && referral.state === 'registrado'
  );
}

export function getRegisteredReferrals(state: DemoState): Referral[] {
  return state.referrals.filter((referral) => referral.state === 'registrado');
}

export function getComparisonSelection(
  state: DemoState,
  jobId: string
): string[] {
  return state.comparison[jobId] ?? [];
}

export function getReferralListSelection(
  state: DemoState,
  jobId: string
): string[] {
  return state.referralList[jobId] ?? [];
}

export type JobSummary = {
  job: Job;
  company: Company | null;
  applicationsCount: number;
  openClarificationsCount: number;
  answeredClarificationsCount: number;
  readyToReferCount: number;
  /** Motivo pelo qual a vaga precisa de atenção hoje. */
  actionReason: string | null;
};

export function getJobSummary(state: DemoState, job: Job): JobSummary {
  const applications = getApplicationsByJob(state, job.id);
  const clarifications = getClarificationsByJob(state, job.id);
  const open = clarifications.filter(
    (clarification) =>
      clarification.state === 'solicitada' || clarification.state === 'rascunho'
  ).length;
  const answered = clarifications.filter(
    (clarification) => clarification.state === 'respondida'
  ).length;
  const readyToRefer = applications.filter(
    (application) => application.analysisStage === 'pronta-para-encaminhar'
  ).length;

  const missingInfo = applications.filter((application) => {
    const coverage = getCoverage(job, state.analysis, application.id);
    return coverage.withInformation < coverage.total;
  }).length;

  let actionReason: string | null = null;
  if (answered > 0) {
    actionReason = `${plural(answered, 'resposta aguardando', 'respostas aguardando')} incorporação na análise`;
  } else if (open > 0) {
    actionReason = `${plural(open, 'solicitação', 'solicitações')} de esclarecimento sem resposta`;
  } else if (missingInfo > 0) {
    actionReason = `${plural(missingInfo, 'candidatura', 'candidaturas')} com critérios sem informação`;
  } else if (readyToRefer > 0) {
    actionReason =
      readyToRefer === 1
        ? '1 candidatura pronta para encaminhar'
        : `${readyToRefer} candidaturas prontas para encaminhar`;
  }

  return {
    job,
    company: getCompany(job.companyId),
    applicationsCount: applications.length,
    openClarificationsCount: open,
    answeredClarificationsCount: answered,
    readyToReferCount: readyToRefer,
    actionReason
  };
}

/**
 * Regional da persona, quando ela responde por uma.
 *
 * A gerência devolve `null` e continua vendo o estado inteiro; é o que
 * mantém o roteiro da demonstração igual ao que sempre foi.
 */
export function getRegiaoDaPersona(state: DemoState): RegiaoAtendimento | null {
  const persona = getPersona(state);
  if (persona.kind !== 'analista') return null;
  return getRegiao(persona.regionId ?? null);
}

/** A empresa pertence à regional? Decide pela cidade da localização. */
function daRegional(company: Company | null, regiaoId: string): boolean {
  return !!company && regiaoDaLocalizacao(company.location) === regiaoId;
}

export function getVisibleJobs(state: DemoState): Job[] {
  const persona = getPersona(state);
  if (persona.kind === 'gestor' && persona.companyId) {
    return getJobsByCompany(persona.companyId);
  }
  const regiao = getRegiaoDaPersona(state);
  if (regiao) {
    return ALL_JOBS.filter((job) =>
      daRegional(getCompany(job.companyId), regiao.id)
    );
  }
  return ALL_JOBS;
}

export function getVisibleCompanies(state: DemoState): Company[] {
  const persona = getPersona(state);
  if (persona.kind === 'gestor' && persona.companyId) {
    const company = getCompany(persona.companyId);
    return company ? [company] : [];
  }
  const regiao = getRegiaoDaPersona(state);
  if (regiao) {
    return ALL_COMPANIES.filter((company) => daRegional(company, regiao.id));
  }
  return ALL_COMPANIES;
}

/** Janela da meta: os 30 dias que antecedem a data de referência da base. */
const DIAS_DA_META = 30;

/**
 * Encaminhamentos da regional nos últimos 30 dias.
 *
 * É o numerador do quadro de meta da analista, e soma as duas fontes pela
 * mesma regra que o BI já usa: as remessas do histórico simulado, que têm id
 * próprio (`HIST-VAG-…`) e nunca colidem com vaga do catálogo, mais os
 * encaminhamentos registrados ao vivo durante a demonstração. Registrar um
 * encaminhamento na tela move este número na hora.
 */
export function getEncaminhamentosDaRegional(
  state: DemoState,
  regiaoId: string
): number {
  const fim = new Date(DEMO_REFERENCE_DATE);
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - DIAS_DA_META);

  const naJanela = (iso: string | null): boolean => {
    if (!iso) return false;
    const dia = new Date(iso);
    return dia >= inicio && dia <= fim;
  };

  const historico = getOutcomesBase().remessas.filter(
    (remessa) =>
      naJanela(remessa.enviadaEm) &&
      daRegional(getCompany(remessa.companyId), regiaoId)
  ).length;

  const vivos = getRegisteredReferrals(state).filter(
    (referral) =>
      naJanela(referral.createdAt) &&
      daRegional(getCompany(referral.companyId), regiaoId)
  ).length;

  return historico + vivos;
}

/** Talentos visíveis para a persona: gestor só vê quem foi compartilhado. */
export function getVisibleTalentIds(state: DemoState): string[] {
  const persona = getPersona(state);
  if (persona.kind !== 'gestor' || !persona.companyId) {
    return ALL_TALENTS.map((talent) => talent.id);
  }

  const referrals = getReferralsByCompany(state, persona.companyId);
  const ids = new Set<string>();
  for (const referral of referrals) {
    for (const item of referral.items) {
      const application = getApplication(state, item.applicationId);
      if (application) ids.add(application.talentId);
    }
  }
  return [...ids];
}

export type OverviewMetrics = {
  openJobs: number;
  applicationsInAnalysis: number;
  openClarifications: number;
  referralsAwaitingReturn: number;
};

export function getOverviewMetrics(
  state: DemoState,
  companyFilter: string | 'todas'
): OverviewMetrics {
  const jobs = getVisibleJobs(state).filter(
    (job) => companyFilter === 'todas' || job.companyId === companyFilter
  );
  const jobIds = new Set(jobs.map((job) => job.id));
  const applications = state.applications.filter((application) =>
    jobIds.has(application.jobId)
  );

  return {
    openJobs: jobs.filter((job) => job.stage !== 'encerrada').length,
    applicationsInAnalysis: applications.filter(
      (application) => application.analysisStage !== 'nao-iniciada'
    ).length,
    openClarifications: state.clarifications.filter(
      (clarification) =>
        jobIds.has(clarification.jobId) &&
        (clarification.state === 'solicitada' ||
          clarification.state === 'rascunho' ||
          clarification.state === 'respondida')
    ).length,
    referralsAwaitingReturn: state.referrals.filter(
      (referral) =>
        referral.state === 'registrado' &&
        jobIds.has(referral.jobId) &&
        referral.items.some((item) => item.managerDecision === 'pendente')
    ).length
  };
}

export type StageDistributionEntry = {
  stage: ExternalStage;
  label: string;
  count: number;
  applicationIds: string[];
};

export function getStageDistribution(
  state: DemoState,
  companyFilter: string | 'todas'
): StageDistributionEntry[] {
  const jobs = getVisibleJobs(state).filter(
    (job) => companyFilter === 'todas' || job.companyId === companyFilter
  );
  const jobIds = new Set(jobs.map((job) => job.id));
  const stages: ExternalStage[] = [
    'inscrito',
    'triagem',
    'analise-tecnica',
    'entrevista-empresa'
  ];

  return stages.map((stage) => {
    const applications = state.applications.filter(
      (application) =>
        jobIds.has(application.jobId) && application.externalStage === stage
    );
    return {
      stage,
      label: EXTERNAL_STAGE_LABEL[stage],
      count: applications.length,
      applicationIds: applications.map((application) => application.id)
    };
  });
}

export type DimensionCoverage = {
  dimension: Dimension;
  withInformation: number;
  total: number;
};

/** Cobertura agregada por dimensão em todas as candidaturas visíveis. */
export function getCoverageByDimension(
  state: DemoState,
  companyFilter: string | 'todas'
): DimensionCoverage[] {
  const jobs = getVisibleJobs(state).filter(
    (job) => companyFilter === 'todas' || job.companyId === companyFilter
  );
  const dimensions: Dimension[] = ['tecnica', 'profissional', 'organizacional'];

  return dimensions.map((dimension) => {
    let withInformation = 0;
    let total = 0;
    for (const job of jobs) {
      for (const application of getApplicationsByJob(state, job.id)) {
        const coverage = getCoverage(
          job,
          state.analysis,
          application.id,
          dimension
        );
        withInformation += coverage.withInformation;
        total += coverage.total;
      }
    }
    return { dimension, withInformation, total };
  });
}

export function getCriterionStateCounts(
  state: DemoState,
  jobId: string
): Record<string, number> {
  const job = getJob(jobId);
  if (!job) return {};
  const counts: Record<string, number> = {};
  for (const application of getApplicationsByJob(state, jobId)) {
    for (const criterion of job.criteria) {
      const analysis = getCriterionAnalysis(
        state.analysis,
        application.id,
        criterion.id
      );
      const label = CRITERION_STATE_META[analysis.state].label;
      counts[label] = (counts[label] ?? 0) + 1;
    }
  }
  return counts;
}

export function getRecentHistory(state: DemoState, limit = 8) {
  return [...state.history]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, limit);
}

export const DEMO_REFERENCE_DATE = DEMO_CATALOG.referenceDate;

export type SourceBreakdown = {
  sourceId: DataSourceId;
  name: string;
  /** Nome curto para caber numa linha de resumo. */
  shortName: string;
  count: number;
};

/** Nome da fonte sem o sufixo "— demonstração", para uso em linha. */
function shortSourceName(name: string): string {
  return name.split('—')[0]!.trim();
}

/**
 * De quantas fontes distintas um conjunto de registros se compõe.
 *
 * É o número que torna visível o trabalho de reunião que a central faz: sem
 * ela, cada fonte seria uma consulta separada do analista.
 */
export function getSourceBreakdown(evidences: Evidence[]): SourceBreakdown[] {
  const counts = new Map<DataSourceId, number>();
  for (const evidence of evidences) {
    counts.set(evidence.sourceId, (counts.get(evidence.sourceId) ?? 0) + 1);
  }

  return DEMO_DATA_SOURCES.filter((source) => counts.has(source.id))
    .map((source) => ({
      sourceId: source.id,
      name: source.name,
      shortName: shortSourceName(source.name),
      count: counts.get(source.id) ?? 0
    }))
    .sort((a, b) => b.count - a.count);
}

/** Todos os registros que sustentam a análise de uma vaga. */
export function getEvidencesForJob(state: DemoState, job: Job): Evidence[] {
  const applications = getApplicationsByJob(state, job.id);
  const seen = new Set<string>();
  const result: Evidence[] = [];

  for (const application of applications) {
    for (const criterion of job.criteria) {
      for (const evidence of getEvidencesForCriterion(
        state,
        application,
        criterion.id
      )) {
        if (seen.has(evidence.id)) continue;
        seen.add(evidence.id);
        result.push(evidence);
      }
    }
  }

  return result;
}

/** Registros que sustentam a análise de uma candidatura. */
export function getEvidencesForApplication(
  state: DemoState,
  job: Job,
  application: Application
): Evidence[] {
  const seen = new Set<string>();
  const result: Evidence[] = [];

  for (const criterion of job.criteria) {
    for (const evidence of getEvidencesForCriterion(
      state,
      application,
      criterion.id
    )) {
      if (seen.has(evidence.id)) continue;
      seen.add(evidence.id);
      result.push(evidence);
    }
  }

  return result;
}

export type CandidateFilter =
  | 'todas'
  | 'compativel'
  | 'abaixo-do-corte'
  | 'fit-pendente'
  | 'lacuna-obrigatoria'
  | 'divergencia'
  | 'a-esclarecer'
  | 'cobertura-completa';

export const CANDIDATE_FILTER_LABEL: Record<CandidateFilter, string> = {
  todas: 'Todas as candidaturas',
  compativel: `Aderência de ${ADHERENCE_THRESHOLD}% ou mais`,
  'abaixo-do-corte': `Aderência abaixo de ${ADHERENCE_THRESHOLD}%`,
  'fit-pendente': 'Sem resposta ao questionário de fit',
  'lacuna-obrigatoria': 'Requisito obrigatório sem informação',
  divergencia: 'Com divergência identificada',
  'a-esclarecer': 'Com ponto a esclarecer',
  'cobertura-completa': 'Com dados em todos os critérios'
};

/**
 * Triagem por estado da análise.
 *
 * É a operação que justifica a ferramenta quando a vaga tem dezenas de
 * candidaturas: em vez de abrir uma a uma para descobrir onde falta
 * informação, o analista pede a lista de quem tem lacuna em requisito
 * obrigatório e age só sobre ela.
 */
export function filterApplicationsByAnalysis(
  state: DemoState,
  job: Job,
  applications: Application[],
  filter: CandidateFilter
): Application[] {
  if (filter === 'todas') return applications;

  // Os três filtros de aderência não dependem da análise por critério: são o
  // corte de 35% do cliente (R3) aplicado sobre o percentual. Ficam antes
  // porque a conta é de outra natureza — não olha os critérios da vaga.
  if (
    filter === 'compativel' ||
    filter === 'abaixo-do-corte' ||
    filter === 'fit-pendente'
  ) {
    return applications.filter((application) => {
      if (filter === 'fit-pendente') {
        return getFitResponse(state, application.id) === null;
      }
      const total = getAdherence(state, application.id)?.total ?? null;
      // Sem total não há corte: quem não respondeu não é "abaixo do corte",
      // é sem medida, e cai no filtro próprio.
      if (total === null) return false;
      return filter === 'compativel'
        ? total >= ADHERENCE_THRESHOLD
        : total < ADHERENCE_THRESHOLD;
    });
  }

  return applications.filter((application) => {
    const states = job.criteria.map((criterion) => ({
      criterion,
      analysis: getCriterionAnalysis(
        state.analysis,
        application.id,
        criterion.id
      )
    }));

    switch (filter) {
      case 'lacuna-obrigatoria':
        return states.some(
          (entry) =>
            entry.criterion.required &&
            entry.analysis.state === 'sem-informacao'
        );
      case 'divergencia':
        return states.some((entry) => entry.analysis.state === 'divergencia');
      case 'a-esclarecer':
        return states.some((entry) => entry.analysis.state === 'a-esclarecer');
      case 'cobertura-completa': {
        const coverage = getCoverage(job, state.analysis, application.id);
        return coverage.withInformation === coverage.total;
      }
      default:
        return true;
    }
  });
}

/** Quantas candidaturas cairiam em cada filtro, para mostrar no seletor. */
export function getCandidateFilterCounts(
  state: DemoState,
  job: Job,
  applications: Application[]
): Record<CandidateFilter, number> {
  const filters: CandidateFilter[] = [
    'todas',
    'compativel',
    'abaixo-do-corte',
    'fit-pendente',
    'lacuna-obrigatoria',
    'divergencia',
    'a-esclarecer',
    'cobertura-completa'
  ];

  const counts = {} as Record<CandidateFilter, number>;
  for (const filter of filters) {
    counts[filter] = filterApplicationsByAnalysis(
      state,
      job,
      applications,
      filter
    ).length;
  }
  return counts;
}

export type JourneyOutcome =
  | 'em-analise'
  | 'encaminhada'
  | 'quero-entrevistar'
  | 'nao-avancou';

export const JOURNEY_OUTCOME_LABEL: Record<JourneyOutcome, string> = {
  'em-analise': 'Em análise no IEL',
  encaminhada: 'Encaminhada, aguardando retorno',
  'quero-entrevistar': 'Empresa quis entrevistar',
  'nao-avancou': 'Empresa não avançou'
};

export type JourneyEntry = {
  application: Application;
  job: Job | null;
  company: Company | null;
  outcome: JourneyOutcome;
  /** Justificativa operacional registrada pela empresa, quando houver. */
  managerNote: string | null;
  decidedAt: string | null;
  coverage: CoverageSummary;
  clarifications: Clarification[];
};

/**
 * A trajetória de uma pessoa entre processos.
 *
 * O enunciado trata como efeito do problema a "dificuldade de transformar os
 * resultados dos processos em aprendizado": cada seleção termina e o que se
 * aprendeu com ela não alcança a próxima. Aqui as candidaturas da mesma pessoa
 * aparecem em sequência, com o que cada uma produziu — o que a empresa
 * respondeu e por quê.
 *
 * Isto é o percurso da pessoa entre oportunidades. Acompanhamento após a
 * contratação está fora do escopo definido para este protótipo.
 */
export function getTalentJourney(
  state: DemoState,
  talentId: string
): JourneyEntry[] {
  const applications = getApplicationsByTalent(state, talentId);

  return applications
    .map((application) => {
      const job = getJob(application.jobId);
      const referralItem = state.referrals
        .filter((referral) => referral.state === 'registrado')
        .flatMap((referral) => referral.items)
        .find((item) => item.applicationId === application.id);

      let outcome: JourneyOutcome = 'em-analise';
      if (referralItem?.managerDecision === 'quero-entrevistar') {
        outcome = 'quero-entrevistar';
      } else if (referralItem?.managerDecision === 'nao-avancar') {
        outcome = 'nao-avancou';
      } else if (referralItem) {
        outcome = 'encaminhada';
      }

      return {
        application,
        job,
        company: job ? getCompany(job.companyId) : null,
        outcome,
        managerNote: referralItem?.managerNote ?? null,
        decidedAt: referralItem?.decidedAt ?? null,
        coverage: job
          ? getCoverage(job, state.analysis, application.id)
          : { withInformation: 0, total: 0, missing: [] },
        clarifications: getClarificationsByApplication(state, application.id)
      };
    })
    .sort((a, b) =>
      a.application.appliedAt < b.application.appliedAt ? 1 : -1
    );
}

export type ReusedEvidence = {
  evidence: Evidence;
  /** Vagas da pessoa que este mesmo registro ajuda a analisar. */
  jobs: Job[];
};

/**
 * Registros que já serviram a mais de um processo da mesma pessoa.
 *
 * É a contrapartida concreta do "não pedir à pessoa que preencha tudo de
 * novo": a informação foi coletada uma vez e sustentou análises em vagas
 * diferentes, cada uma com o seu contexto.
 */
export function getReusedEvidences(
  state: DemoState,
  talentId: string
): ReusedEvidence[] {
  const applicationJobIds = new Set(
    getApplicationsByTalent(state, talentId).map(
      (application) => application.jobId
    )
  );

  return state.evidences
    .filter((evidence) => evidence.talentId === talentId)
    .map((evidence) => {
      const jobIds = new Set(
        evidence.links
          .map((link) => link.jobId)
          .filter((jobId) => applicationJobIds.has(jobId))
      );
      return {
        evidence,
        jobs: [...jobIds]
          .map((jobId) => getJob(jobId))
          .filter((job): job is Job => job !== null)
      };
    })
    .filter((entry) => entry.jobs.length > 1);
}

/**
 * Peso de um eixo nesta vaga.
 *
 * A vaga é catálogo estático e o peso pode ser corrigido durante a
 * demonstração, então há duas camadas: o que a empresa declarou na base e o
 * que alguém confirmou ou corrigiu depois. O estado, quando informado, vence
 * — é a decisão mais recente, e tem autor e hora no histórico.
 *
 * Ausente dos dois lados, vale `'medio'`: um eixo sem peso declarado não é um
 * eixo sem importância, é um eixo sobre o qual a empresa ainda não se
 * pronunciou. Tratá-lo como baixo silenciaria o que ninguém decidiu.
 */
export function getAxisWeight(
  job: Job,
  axisId: FitAxisId,
  state?: DemoState
): AxisWeight {
  return (
    state?.axisWeights?.[job.id]?.[axisId] ?? job.axisWeights[axisId] ?? 'medio'
  );
}

export const AXIS_WEIGHT_LABEL: Record<AxisWeight, string> = {
  alto: 'peso alto',
  medio: 'peso médio',
  baixo: 'peso baixo'
};

/** Os cinco pesos da vaga, já com as correções registradas na demonstração. */
export function getAxisWeights(
  state: DemoState,
  job: Job
): Record<FitAxisId, AxisWeight> {
  const weights = {} as Record<FitAxisId, AxisWeight>;
  for (const axis of FIT_AXES) {
    weights[axis.id] = getAxisWeight(job, axis.id, state);
  }
  return weights;
}

/**
 * Proposta de peso ainda pendente num eixo.
 *
 * Deixa de ser pendente no instante em que alguém confirma ou corrige — é o
 * mesmo contrato do traçado cultural, e a razão dele: a proposta informa a
 * decisão, nunca a substitui.
 */
export function getPendingAxisWeightSuggestion(
  state: DemoState,
  job: Job,
  axisId: FitAxisId
): AxisWeightSuggestion | null {
  if (state.axisWeights?.[job.id]?.[axisId]) return null;
  return (
    job.axisWeightSuggestions.find(
      (suggestion) => suggestion.axisId === axisId
    ) ?? null
  );
}

/**
 * Quantos desfechos "não avançar" com divergência no mesmo eixo bastam para
 * a central propor um ajuste de peso.
 *
 * Em operação o limiar seria maior: dois processos não fazem um padrão, e o
 * enunciado pede que resultados virem aprendizado sem virar superstição. Na
 * base curada há um único encaminhamento recusado por vez durante o roteiro,
 * então o limiar fica em 1 para que a demonstração tenha o que mostrar. É um
 * parâmetro, explicitamente, e não uma regra escondida no código.
 */
export const WEIGHT_LEARNING_MIN_OCCURRENCES = 1;

export type WeightLearning = {
  axisId: FitAxisId;
  /** Encaminhamentos recusados que tinham divergência neste eixo. */
  occurrences: number;
  suggestedWeight: AxisWeight;
  rationale: string;
};

/**
 * O que os processos desta vaga sugerem sobre as prioridades dela.
 *
 * O enunciado pede usar "informações e resultados dos processos para
 * identificar padrões". A referência de mercado ajusta os pesos sozinha; aqui
 * não. Ajuste automático transforma um punhado de recusas em regra
 * permanente, e ninguém consegue depois explicar por que o sistema passou a
 * priorizar um eixo — que é exatamente a opacidade que o desafio manda
 * evitar. Então a central identifica o padrão, diz em quantos casos ele
 * aparece, e deixa a empresa decidir.
 *
 * A leitura de fit usada é a atual, não um retrato do momento da decisão: a
 * base demo não versiona análises. Em produção o padrão se apoiaria no
 * snapshot congelado no encaminhamento.
 */
export function getWeightLearning(
  state: DemoState,
  jobId: string
): WeightLearning[] {
  const job = getJob(jobId);
  if (!job) return [];

  const declined = state.referrals
    .filter(
      (referral) => referral.state === 'registrado' && referral.jobId === jobId
    )
    .flatMap((referral) => referral.items)
    .filter((item) => item.managerDecision === 'nao-avancar');

  if (declined.length === 0) return [];

  const occurrences = new Map<FitAxisId, number>();
  for (const item of declined) {
    const application = state.applications.find(
      (entry) => entry.id === item.applicationId
    );
    if (!application) continue;

    for (const entry of getFitReading(state, job, application.talentId)) {
      if (entry.state !== 'divergencia') continue;
      occurrences.set(entry.axis.id, (occurrences.get(entry.axis.id) ?? 0) + 1);
    }
  }

  return FIT_AXES.map((axis) => ({
    axis,
    count: occurrences.get(axis.id) ?? 0
  }))
    .filter(
      (entry) =>
        entry.count >= WEIGHT_LEARNING_MIN_OCCURRENCES &&
        // Propor o que já vale seria ruído: o eixo já está priorizado.
        getAxisWeight(job, entry.axis.id, state) !== 'alto'
    )
    .map((entry) => ({
      axisId: entry.axis.id,
      occurrences: entry.count,
      suggestedWeight: 'alto' as AxisWeight,
      rationale: `Em ${entry.count} ${entry.count === 1 ? 'encaminhamento que não avançou' : 'encaminhamentos que não avançaram'} nesta vaga, a leitura apontava divergência em ${entry.axis.label.toLowerCase()}. Elevar o peso faz esse eixo ser esclarecido antes do encaminhamento, não depois.`
    }));
}

export type FitReadingEntry = {
  axis: FitAxis;
  /** O que a equipe informou neste eixo, se informou. */
  condition: TeamCondition | null;
  /** O que a pessoa declarou neste eixo, se declarou. */
  preference: TalentPreference | null;
  /** Peso que a empresa deu a este eixo nesta vaga. */
  weight: AxisWeight;
  /** Leitura do encontro entre os dois lados. */
  state: CriterionState;
  /** De qual lado falta informação, quando falta. */
  missingSide: 'empresa' | 'candidato' | 'ambos' | null;
};

/**
 * Aderência ao contexto de trabalho, eixo a eixo.
 *
 * O enunciado trata o fit como o cerne do desafio e aponta que hoje ele vive
 * numa ferramenta externa, cara e difícil de escalar. A leitura aqui não
 * aplica avaliação nova nem produz nota: ela põe lado a lado o que a equipe
 * informou e o que a pessoa declarou, nos mesmos eixos, e nomeia o que o
 * encontro dos dois revela — inclusive quando um dos lados está vazio.
 *
 * Estados possíveis, na mesma escala usada nos critérios da vaga:
 *
 * - alinhamento: os dois lados descrevem a mesma coisa.
 * - divergência: os dois lados informaram, e o que informaram não coincide.
 * - a esclarecer: há informação dos dois lados, mas a condição da empresa
 *   ainda não foi confirmada por quem poderia confirmar.
 * - sem informação: falta um dos lados, ou os dois.
 */
export function getFitReading(
  state: DemoState,
  job: Job,
  talentId: string
): FitReadingEntry[] {
  const team = getTeam(state, job.teamId);
  const talent = getTalent(talentId, state);

  return FIT_AXES.map((axis) => {
    const weight = getAxisWeight(job, axis.id, state);
    const record =
      team?.conditions.find((entry) => entry.axisId === axis.id) ?? null;
    // Um registro que apenas marca a pergunta em aberto não é um lado
    // informado: a empresa ainda não disse nada ali.
    const condition = record?.informed === false ? null : record;
    const preference =
      talent?.preferences.find((entry) => entry.axisId === axis.id) ?? null;

    if (!condition && !preference) {
      return {
        axis,
        condition,
        preference,
        weight,
        state: 'sem-informacao' as CriterionState,
        missingSide: 'ambos' as const
      };
    }

    if (!preference) {
      return {
        axis,
        condition,
        preference,
        weight,
        state: 'sem-informacao' as CriterionState,
        missingSide: 'candidato' as const
      };
    }

    if (!condition) {
      return {
        axis,
        condition,
        preference,
        weight,
        state: 'sem-informacao' as CriterionState,
        missingSide: 'empresa' as const
      };
    }

    // Com os dois lados preenchidos, a leitura passa a depender do conteúdo.
    // A base demo marca a divergência onde ela existe de fato; fora disso, uma
    // condição ainda não confirmada pela empresa não sustenta conclusão.
    const conflicting = CONFLICTING_PAIRS.some(
      (pair) =>
        pair.conditionId === condition.id && pair.preferenceId === preference.id
    );

    if (conflicting) {
      return {
        axis,
        condition,
        preference,
        weight,
        state: 'divergencia' as CriterionState,
        missingSide: null
      };
    }

    return {
      axis,
      condition,
      preference,
      weight,
      state: (condition.status === 'confirmado'
        ? 'alinhamento'
        : 'a-esclarecer') as CriterionState,
      missingSide: null
    };
  });
}

/**
 * Pares em conflito explícito na base demo.
 *
 * Declarados, não inferidos: o briefing pede que uma divergência seja
 * mostrada quando existe informação em conflito, e não deduzida por
 * semelhança de texto.
 */
const CONFLICTING_PAIRS: { conditionId: string; preferenceId: string }[] = [
  // A equipe da vaga 1 não tem acompanhamento no turno; Ana espera orientação.
  // Só vale depois que o gestor responde: antes disso o lado da empresa está
  // vazio, e a tela mostra a lacuna em vez de inventar um conflito.
  { conditionId: 'COND-01', preferenceId: 'PREF-ANA-01' },
  // A rotina da vaga 1 é executada sem supervisão; Fábio espera treinamento.
  { conditionId: 'COND-04', preferenceId: 'PREF-FABIO-01' }
];

/** Eixos em que falta o lado da pessoa: o que uma coleta dirigida buscaria. */
export function getFitGaps(
  state: DemoState,
  job: Job,
  talentId: string
): FitReadingEntry[] {
  return getFitReading(state, job, talentId).filter(
    (entry) =>
      entry.missingSide === 'candidato' || entry.missingSide === 'ambos'
  );
}

export type CultureAxisState =
  | 'convergente'
  | 'divergente'
  | 'apenas-gestao'
  | 'consulta-insuficiente'
  | 'sem-resposta';

export const CULTURE_AXIS_STATE_LABEL: Record<CultureAxisState, string> = {
  convergente: 'Respostas convergem',
  divergente: 'Gestão e equipe divergem',
  'apenas-gestao': 'Só a gestão respondeu',
  'consulta-insuficiente': 'Consulta à equipe sem base suficiente',
  'sem-resposta': 'Ninguém respondeu ainda'
};

export type CultureVoice = {
  respondent: CultureRespondent;
  /** Média do papel no tema, no sentido do tema (1..5). */
  mean: number;
  /** A média dita na escala: "Concordo", "Tanto faz"… */
  label: string;
  /** Maior número de respostas do papel numa frase do tema. */
  total: number;
};

export type CultureAxisReading = {
  axisId: FitAxisId;
  voices: CultureVoice[];
  state: CultureAxisState;
  /** Proposta da análise ainda não confirmada por ninguém. */
  pendingSuggestion: CultureSuggestion | null;
};

/**
 * Leitura do traçado cultural de uma empresa, tema a tema.
 *
 * Nunca reduz os papéis a um valor só. Se a gestão responde uma coisa e a
 * equipe outra, as duas aparecem e o tema é marcado como divergente — média
 * entre quem manda e quem executa apaga exatamente o viés que interessa ver.
 */
export function getCultureReading(
  state: DemoState,
  companyId: string
): CultureAxisReading[] {
  const company = getCompany(companyId);
  const perfil = perfilDaEmpresa(state, companyId);

  return perfil.temas.map((tema) => {
    const voices: CultureVoice[] = [];
    for (const respondent of [
      'gestao',
      'rh',
      'equipe'
    ] as CultureRespondent[]) {
      const mean = tema.porPapel[respondent];
      if (mean === undefined) continue;
      voices.push({
        respondent,
        mean,
        label: rotuloDaEscala(mean),
        total: tema.respondentesPorPapel[respondent]
      });
    }

    const gestaoRespondeu = tema.porPapel.gestao !== undefined;
    const pendingSuggestion =
      company?.cultureSuggestions.find(
        (suggestion) => suggestion.axisId === tema.axisId && !gestaoRespondeu
      ) ?? null;

    return {
      axisId: tema.axisId,
      voices,
      state: readCultureAxisState(tema),
      pendingSuggestion
    };
  });
}

function readCultureAxisState(tema: PerfilDoTema): CultureAxisState {
  const temEquipe = tema.porPapel.equipe !== undefined;
  // Gestão e RH somados contam como liderança mesmo quando nenhum dos dois
  // pode aparecer sozinho (piso do grupo anônimo).
  const temLideranca =
    tema.lideranca !== null ||
    tema.porPapel.gestao !== undefined ||
    tema.porPapel.rh !== undefined;

  if (!temEquipe) return temLideranca ? 'apenas-gestao' : 'sem-resposta';
  if (!tema.fecha) return 'consulta-insuficiente';
  return tema.dispersao === 'divergente' ? 'divergente' : 'convergente';
}

/** Eixos em que a leitura do traçado cultural não se sustenta sozinha. */
export function getCultureAttentionPoints(
  state: DemoState,
  companyId: string
): CultureAxisReading[] {
  return getCultureReading(state, companyId).filter(
    (entry) =>
      entry.state === 'divergente' ||
      entry.state === 'apenas-gestao' ||
      entry.state === 'consulta-insuficiente'
  );
}

export type CultureMapKind = 'talento' | 'empresa';

export type CultureMapFilter = 'todos' | 'talentos' | 'empresas';

export type CultureMapPoint = {
  id: string;
  name: string;
  detail: string;
  kind: CultureMapKind;
  position: PosicaoCultural;
  culture: ClassificacaoCultural;
  /**
   * Como a equipe descreve o mesmo ambiente, quando difere do que a empresa
   * declara. O mapa desenha os dois: escolher um lado apagaria justamente a
   * diferença que a pessoa vai encontrar no primeiro mês.
   */
  teamPosition: PosicaoCultural | null;
  divergentAxes: number;
};

export function getTalentCultureAnswers(talentId: string): RespostaDeEixo[] {
  return ALL_TALENT_CULTURE_ANSWERS.filter(
    (answer) => answer.talentId === talentId
  ).map((answer) => ({ axisId: answer.axisId, value: answer.value }));
}

export type CompanyCultureAnswers = {
  /** O que gestão ou RH respondeu: a versão que a empresa declara. */
  declared: RespostaDeEixo[];
  /** O que a equipe respondeu, só onde a consulta alcançou base suficiente. */
  team: RespostaDeEixo[];
  divergentAxes: number;
};

export function getCompanyCultureAnswers(
  state: DemoState,
  companyId: string
): CompanyCultureAnswers {
  const declared: RespostaDeEixo[] = [];
  const team: RespostaDeEixo[] = [];
  let divergentAxes = 0;

  for (const tema of perfilDaEmpresa(state, companyId).temas) {
    const equipeFecha = tema.fecha && tema.equipe !== null;
    const doTime = equipeFecha ? (tema.porPapel.equipe ?? null) : null;

    if (tema.lideranca !== null) {
      declared.push({ axisId: tema.axisId, value: tema.lideranca });
    } else if (doTime !== null) {
      declared.push({ axisId: tema.axisId, value: doTime });
    }

    if (doTime !== null) team.push({ axisId: tema.axisId, value: doTime });
    if (tema.dispersao === 'divergente') divergentAxes += 1;
  }

  return { declared, team, divergentAxes };
}

function buildCompanyPoint(
  state: DemoState,
  company: Company
): CultureMapPoint | null {
  const answers = getCompanyCultureAnswers(state, company.id);
  const position = calcularPosicaoCultural(answers.declared);
  if (!position) return null;

  const teamPosition =
    answers.divergentAxes > 0 ? calcularPosicaoCultural(answers.team) : null;

  return {
    id: company.id,
    name: company.name,
    detail: company.sector,
    kind: 'empresa',
    position,
    culture: classificarCultura(position),
    teamPosition,
    divergentAxes: answers.divergentAxes
  };
}

function buildTalentPoint(talent: Talent): CultureMapPoint | null {
  const position = calcularPosicaoCultural(getTalentCultureAnswers(talent.id));
  if (!position) return null;

  return {
    id: talent.id,
    name: talent.name,
    detail: talent.headline,
    kind: 'talento',
    position,
    culture: classificarCultura(position),
    teamPosition: null,
    divergentAxes: 0
  };
}

export function getCultureMapPoints(
  state: DemoState,
  filter: CultureMapFilter = 'todos'
): CultureMapPoint[] {
  const points: CultureMapPoint[] = [];

  if (filter !== 'talentos') {
    for (const company of ALL_COMPANIES) {
      const point = buildCompanyPoint(state, company);
      if (point) points.push(point);
    }
  }

  if (filter !== 'empresas') {
    for (const talent of ALL_TALENTS) {
      const point = buildTalentPoint(talent);
      if (point) points.push(point);
    }
  }

  return points;
}

/** Talentos e empresas que ainda não respondem por nenhum eixo. */
export function getCultureMapGaps(state: DemoState): {
  talents: Talent[];
  companies: Company[];
} {
  return {
    talents: ALL_TALENTS.filter(
      (talent) => getTalentCultureAnswers(talent.id).length === 0
    ),
    companies: ALL_COMPANIES.filter(
      (company) =>
        getCompanyCultureAnswers(state, company.id).declared.length === 0
    )
  };
}

export type CultureFitReading = {
  talentPosition: PosicaoCultural;
  companyPosition: PosicaoCultural;
  teamPosition: PosicaoCultural | null;
  fit: EncaixeCultural;
  /** Encaixe com o ambiente que a equipe descreve, quando ele difere. */
  teamFit: EncaixeCultural | null;
  /**
   * Aderência em percentual pelo motor de `adherence.ts`. `total` vem `null`
   * quando nenhum eixo foi respondido pelos dois lados.
   */
  aderencia: AdherenceResult;
  axes: LeituraDeEixo[];
  divergentAxes: number;
};

export function getCultureFit(
  state: DemoState,
  talentId: string,
  companyId: string
): CultureFitReading | null {
  const talentAnswers = getTalentCultureAnswers(talentId);
  const companyAnswers = getCompanyCultureAnswers(state, companyId);

  const talentPosition = calcularPosicaoCultural(talentAnswers);
  const companyPosition = calcularPosicaoCultural(companyAnswers.declared);
  if (!talentPosition || !companyPosition) return null;

  const teamPosition =
    companyAnswers.divergentAxes > 0
      ? calcularPosicaoCultural(companyAnswers.team)
      : null;

  return {
    talentPosition,
    companyPosition,
    teamPosition,
    fit: calcularEncaixeCultural(talentPosition, companyPosition),
    teamFit: teamPosition
      ? calcularEncaixeCultural(talentPosition, teamPosition)
      : null,
    aderencia: getTalentCompanyAdherence(state, talentId, companyId),
    axes: compararRespostas(talentAnswers, companyAnswers.declared),
    divergentAxes: companyAnswers.divergentAxes
  };
}

/**
 * Quem aparece como marcador no trilho de um ponto. `lideranca` é gestão e RH
 * juntos, quando um dos dois sozinho seria uma pessoa só.
 */
export type CultureDisplayRespondent = 'gestao' | 'rh' | 'lideranca' | 'equipe';

export const CULTURE_DISPLAY_RESPONDENT_LABEL: Record<
  CultureDisplayRespondent,
  string
> = {
  gestao: 'Gestão',
  rh: 'RH',
  lideranca: 'Gestão/RH',
  equipe: 'Equipe'
};

/** Menos que isso num papel e o papel é uma pessoa: não aparece sozinho. */
export const MIN_ROLE_RESPONSES_TO_SHOW = MIN_RESPOSTAS_ANONIMAS;

export type CultureDisplayVoice = {
  respondent: CultureDisplayRespondent;
  /** Média do grupo no tema, no sentido do tema (1..5). */
  mean: number;
  label: string;
  /** Maior número de respostas do grupo numa frase do tema. */
  total: number;
  /**
   * Dispersão das respostas no tema, de 0 (todos iguais) a 1 (desvio de dois
   * pontos ou mais). Só a equipe tem: gestão e RH são poucas pessoas.
   */
  spread: number;
};

export type CultureDisplayVoices = {
  voices: CultureDisplayVoice[];
  /**
   * Respostas que entram na média mas não viram marcador porque, sozinhas,
   * identificariam quem respondeu.
   */
  withheld: number;
};

/** Média do grupo no tema, a partir das frases que o grupo respondeu. */
function mediaDoGrupo(
  state: DemoState,
  companyId: string,
  axisId: FitAxisId,
  roles: CultureRespondent[]
): { mean: number; total: number } | null {
  const perfil = perfilDaEmpresa(state, companyId);
  const valores: number[] = [];
  let total = 0;
  for (const item of Object.values(perfil.itens)) {
    if (item.tema !== axisId) continue;
    let soma = 0;
    let n = 0;
    for (const role of roles) {
      const doPapel = item.porPapel[role];
      if (!doPapel) continue;
      soma += doPapel.media * doPapel.n;
      n += doPapel.n;
    }
    if (n === 0) continue;
    const frase = getItem(item.itemId)!;
    valores.push(frase.polo === 1 ? soma / n : 6 - soma / n);
    total = Math.max(total, n);
  }
  if (valores.length === 0) return null;
  return {
    mean: valores.reduce((a, b) => a + b, 0) / valores.length,
    total
  };
}

/** Desvio médio das frases do tema, em fração de dois pontos da escala. */
function dispersaoDoTema(
  state: DemoState,
  companyId: string,
  axisId: FitAxisId
): number {
  const desvios = Object.values(perfilDaEmpresa(state, companyId).itens)
    .filter((item) => item.tema === axisId && item.nEquipe > 0)
    .map((item) => item.desvio);
  if (desvios.length === 0) return 0;
  const medio = desvios.reduce((a, b) => a + b, 0) / desvios.length;
  return Math.min(1, medio / 2);
}

/**
 * O que a tela pode desenhar de cada papel num tema (PRODUTO.md §5.1).
 *
 * A analista vê a dispersão gestão × equipe, mas nunca uma resposta
 * individual — e "a gestão" quase sempre é uma pessoa só. Por isso:
 *
 * - **Equipe** só vira marcador com `MIN_TEAM_RESPONSES` ou mais respostas;
 *   abaixo disso, a posição seria a de uma ou duas pessoas identificáveis.
 * - **Gestão** e **RH** aparecem separados só quando cada um tem pelo menos
 *   `MIN_ROLE_RESPONSES_TO_SHOW` respostas. Senão os dois viram um grupo só,
 *   "Gestão/RH"; se nem juntos chegam a dois, o marcador não aparece.
 *
 * O que não vira marcador continua na média e no diagnóstico ("gestão e
 * equipe respondem diferente") — o dado não some, só deixa de ter rosto.
 */
export function getCultureDisplayVoices(
  state: DemoState,
  companyId: string,
  axisId: FitAxisId
): CultureDisplayVoices {
  const tema = perfilDaEmpresa(state, companyId).temas.find(
    (entry) => entry.axisId === axisId
  );
  const gestaoN = tema?.respondentesPorPapel.gestao ?? 0;
  const rhN = tema?.respondentesPorPapel.rh ?? 0;
  const equipeN = tema?.respondentesPorPapel.equipe ?? 0;

  const voices: CultureDisplayVoice[] = [];
  let withheld = 0;

  const push = (
    respondent: CultureDisplayRespondent,
    roles: CultureRespondent[]
  ) => {
    const grupo = mediaDoGrupo(state, companyId, axisId, roles);
    if (grupo) {
      voices.push({
        respondent,
        mean: grupo.mean,
        label: rotuloDaEscala(grupo.mean),
        total: grupo.total,
        spread:
          respondent === 'equipe'
            ? dispersaoDoTema(state, companyId, axisId)
            : 0
      });
    }
  };

  const separados =
    (gestaoN === 0 || gestaoN >= MIN_ROLE_RESPONSES_TO_SHOW) &&
    (rhN === 0 || rhN >= MIN_ROLE_RESPONSES_TO_SHOW);

  if (separados) {
    if (gestaoN > 0) push('gestao', ['gestao']);
    if (rhN > 0) push('rh', ['rh']);
  } else if (gestaoN + rhN >= MIN_ROLE_RESPONSES_TO_SHOW) {
    push('lideranca', ['gestao', 'rh']);
  } else {
    withheld += gestaoN + rhN;
  }

  if (equipeN >= MIN_TEAM_RESPONSES) push('equipe', ['equipe']);
  else withheld += equipeN;

  return { voices, withheld };
}

/**
 * Um envio do perfil, como o candidato pode vê-lo.
 *
 * Sem `companyName`, e não por esquecimento: R5 (00:22:21, 00:38:43) diz que
 * o nome da empresa não aparece para o candidato antes da entrevista. Antes
 * este tipo carregava o nome e a devolutiva o exibia — era o item 8.1 da
 * lista de onde o protótipo contrariava o cliente. O que fica é o que a regra
 * permite: atividade, localidade, segmento e turno, vindos de
 * `getCandidateJobView`.
 */
export type SharedWithCompany = {
  /** A vaga como o candidato pode vê-la. Nunca o nome da empresa. */
  jobView: CandidateJobView | null;
  jobTitle: string;
  sharedAt: string | null;
  /** Quantos registros foram compartilhados naquele encaminhamento. */
  recordCount: number;
};

export type TalentTransparency = {
  /** Registros compartilháveis a respeito da pessoa, com procedência. */
  records: Evidence[];
  /** O que ela declarou sobre como prefere trabalhar. */
  preferences: TalentPreference[];
  /** Empresas que receberam o perfil, e quando. */
  sharedWith: SharedWithCompany[];
  /** Registros marcados como internos, apenas contados. */
  internalCount: number;
};

/**
 * O que a pessoa pode ver sobre os próprios dados.
 *
 * As exigências normativas do desafio pedem LGPD com "transparência e
 * controle de acesso": quem é analisado precisa alcançar o que foi registrado
 * a respeito de si e para onde isso foi. A solução externa que o enunciado
 * descreve devolve ao candidato um laudo de perfil; aqui a devolutiva é de
 * outra natureza — ela mostra procedência e destino, que é o que permite
 * contestar um registro errado.
 *
 * O recorte do candidato é estreito por desenho: o briefing determina que ele
 * não veja avaliações internas nem nada sobre outras pessoas. Anotações
 * internas do analista entram apenas como contagem, para que a existência
 * delas seja transparente sem expor conteúdo de terceiros ou juízo em
 * elaboração.
 */
export function getTalentTransparency(
  state: DemoState,
  talentId: string
): TalentTransparency {
  const evidences = state.evidences.filter(
    (evidence) => evidence.talentId === talentId
  );

  const applicationIds = new Set(
    getApplicationsByTalent(state, talentId).map(
      (application) => application.id
    )
  );

  const sharedWith: SharedWithCompany[] = [];
  for (const referral of state.referrals) {
    if (referral.state !== 'registrado') continue;
    for (const item of referral.items) {
      if (!applicationIds.has(item.applicationId)) continue;
      const job = getJob(referral.jobId);
      sharedWith.push({
        jobView: getCandidateJobView(state, item.applicationId),
        jobTitle: job?.title ?? referral.jobId,
        sharedAt: referral.createdAt,
        recordCount: item.sharedEvidenceIds.length
      });
    }
  }

  return {
    records: evidences.filter(
      (evidence) => evidence.visibility === 'compartilhavel'
    ),
    preferences: getTalent(talentId, state)?.preferences ?? [],
    sharedWith,
    internalCount: evidences.filter(
      (evidence) => evidence.visibility === 'interno'
    ).length
  };
}

/* ------------------------------------------------------------------ *
 * Perfil cultural da empresa como média (M1, R2)
 * ------------------------------------------------------------------ */

export type { CultureDispersion };

export type CompanyCultureAxisProfile = {
  axisId: FitAxisId;
  /**
   * Média do tema, no sentido do tema (1..5): a das frases que fecham, ou,
   * enquanto nenhuma fecha, a provisória de todas as frases com resposta.
   * `null` sem resposta nenhuma.
   */
  mean: number | null;
  /** Maior número de respostas numa frase do tema, somados os papéis. */
  respondents: number;
  /** Média de cada papel, para a tela mostrar de onde vem a média geral. */
  byRole: { gestao?: number; rh?: number; equipe?: number };
  /** Diagnóstico gestão × equipe. `null` quando não há como comparar. */
  dispersion: CultureDispersion | null;
  /** O perfil fecha neste tema? Falso não é zero: é perfil em aberto. */
  ready: boolean;
};

/**
 * Memória do perfil por empresa, válida enquanto a lista de respostas for a
 * mesma. O reducer nunca muta a lista — toda resposta nova cria outra —, então
 * a identidade do array basta para saber se o perfil mudou. Sem isto a mesa de
 * seleção recalcularia o perfil da empresa uma vez por candidatura.
 */
/*
 * A chave é dupla: a lista de respostas **e** a configuração do instrumento
 * (`state.instrumento`), porque uma frase desligada pela analista sai da
 * conta do perfil. Ausente, a configuração é a de fábrica — uma referência
 * só, o que mantém a memória válida entre renderizações.
 */
const PERFIL_CACHE = new WeakMap<
  DemoState['cultureAnswers'],
  WeakMap<ConfiguracaoDoInstrumento, Map<string, PerfilCultural>>
>();
const RESPOSTAS_POR_EMPRESA = new WeakMap<
  DemoState['cultureAnswers'],
  Map<string, CultureAnswer[]>
>();

function respostasDaEmpresa(
  state: DemoState,
  companyId: string
): CultureAnswer[] {
  let indice = RESPOSTAS_POR_EMPRESA.get(state.cultureAnswers);
  if (!indice) {
    indice = new Map();
    for (const answer of state.cultureAnswers) {
      const lista = indice.get(answer.companyId) ?? [];
      lista.push(answer);
      indice.set(answer.companyId, lista);
    }
    RESPOSTAS_POR_EMPRESA.set(state.cultureAnswers, indice);
  }
  return indice.get(companyId) ?? [];
}

/**
 * As competências que a empresa escolheu medir no questionário.
 *
 * Porta única de leitura da escolha (`DemoState.competenciasEscolhidas`).
 * Empresa que nunca escolheu mede **as 11**: é o que valia antes do pedido do
 * IEL, e tratar a ausência como "nenhuma" apagaria o critério de toda a base
 * ao subir o esquema. A ordem é sempre a de `FIT_AXES`.
 */
export function competenciasDaEmpresa(
  state: DemoState,
  companyId: string
): FitAxisId[] {
  const escolhidas = state.competenciasEscolhidas?.[companyId];
  if (!escolhidas) return FIT_AXIS_IDS;
  return ordenarCompetencias(escolhidas);
}

/** A empresa pediu esta competência no questionário? */
export function competenciaPedida(
  state: DemoState,
  companyId: string,
  axisId: FitAxisId
): boolean {
  return competenciasDaEmpresa(state, companyId).includes(axisId);
}

/** "8 de 11", com as retiradas nomeadas — o que a tela precisa numa linha. */
export type ResumoDeCompetencias = {
  escolhidas: FitAxisId[];
  retiradas: FitAxisId[];
  total: typeof MAXIMO_DE_COMPETENCIAS;
  /** Todas as 11 foram pedidas? Então a linha não precisa aparecer. */
  completo: boolean;
};

export function resumoDeCompetencias(
  state: DemoState,
  companyId: string
): ResumoDeCompetencias {
  const escolhidas = competenciasDaEmpresa(state, companyId);
  const retiradas = FIT_AXIS_IDS.filter((id) => !escolhidas.includes(id));
  return {
    escolhidas,
    retiradas,
    total: MAXIMO_DE_COMPETENCIAS,
    completo: retiradas.length === 0
  };
}

/**
 * O perfil da empresa por frase e por tema (M1, R2).
 *
 * "O fit cultural é a média do que a empresa entende" (00:41:44). Por frase:
 * média, n, desvio e se fecha (`MIN_TEAM_RESPONSES` respostas da equipe). Por
 * tema: a média das frases que fecham, e `fecha` quando ao menos uma frase
 * discriminante fecha. A separação gestão/RH × equipe e o diagnóstico de
 * divergência vêm junto: a média é o perfil, a dispersão é o diagnóstico.
 */
export function perfilDaEmpresa(
  state: DemoState,
  empresaId: string
): PerfilCultural {
  const config = configuracaoDoInstrumento(state);
  let porConfig = PERFIL_CACHE.get(state.cultureAnswers);
  if (!porConfig) {
    porConfig = new WeakMap();
    PERFIL_CACHE.set(state.cultureAnswers, porConfig);
  }
  let porEmpresa = porConfig.get(config);
  if (!porEmpresa) {
    porEmpresa = new Map();
    porConfig.set(config, porEmpresa);
  }
  const guardado = porEmpresa.get(empresaId);
  if (guardado) return guardado;
  // Resposta a uma frase desligada continua guardada (é dado de quem
  // respondeu), mas não entra na média enquanto a frase estiver desligada.
  const respostas = respostasDaEmpresa(state, empresaId).filter((answer) =>
    itemAtivo(answer.itemId, config)
  );
  const perfil = calcularPerfilCultural(respostas);
  porEmpresa.set(empresaId, perfil);
  return perfil;
}

/**
 * As 10 frases do candidato, uma por tema, respeitando o que a analista
 * ajustou no instrumento.
 *
 * É a mesma regra de `escolherPerguntasDoCandidato` (`analysis/culture.ts`):
 * em cada tema, a frase que separa pessoas, fecha na empresa e em que a
 * equipe é mais marcante; sem base, a padrão do tema. A diferença é que
 * "separa pessoas" e "padrão" leem a configuração — uma frase desligada
 * nunca é escolhida, e a padrão pode ter sido substituída.
 */
function escolherPerguntasComConfig(
  perfil: PerfilCultural,
  config: ConfiguracaoDoInstrumento,
  // Uma frase por competência **pedida**: de 3 a 11, nunca as 11 fixas.
  temas: readonly FitAxisId[] = FIT_AXIS_IDS
): PerguntaDoCandidato[] {
  return temas.map((axisId) => {
    const axis = getFitAxis(axisId);
    let melhor: { itemId: string; marca: number } | null = null;
    for (const item of itensAtivosDoTema(axis.id, config)) {
      if (!discrimina(item, config)) continue;
      const doItem = perfil.itens[item.id];
      if (!doItem?.fecha) continue;
      const marca = marcaDaEmpresa(doItem);
      if (!melhor || marca > melhor.marca) {
        melhor = { itemId: item.id, marca };
      }
    }
    return melhor
      ? { itemId: melhor.itemId, axisId: axis.id, semBaseDaEmpresa: false }
      : {
          itemId: itemPadraoDoTema(axis.id, config),
          axisId: axis.id,
          semBaseDaEmpresa: true
        };
  });
}

/**
 * Onde cada frase do instrumento está sendo usada: em quantas empresas com
 * perfil fechado ela é a escolhida para o candidato (com base), e quantas
 * empresas têm perfil fechado em ao menos um tema.
 *
 * Percorre só as empresas com alguma resposta de cultura — com ~2.500
 * empresas, calcular o perfil de todas para descartar quase todas custaria
 * cada renderização. Memorizado por identidade das respostas e da
 * configuração, como o perfil.
 */
export type UsoDoInstrumento = {
  /** Quantas empresas com perfil fechado escolheram a frase (por id). */
  escolhidaEm: Record<string, number>;
  /** Empresas em que ao menos um tema fecha. */
  empresasComPerfil: number;
};

const USO_CACHE = new WeakMap<
  DemoState['cultureAnswers'],
  WeakMap<ConfiguracaoDoInstrumento, UsoDoInstrumento>
>();

export function usoDoInstrumento(state: DemoState): UsoDoInstrumento {
  const config = configuracaoDoInstrumento(state);
  let porConfig = USO_CACHE.get(state.cultureAnswers);
  if (!porConfig) {
    porConfig = new WeakMap();
    USO_CACHE.set(state.cultureAnswers, porConfig);
  }
  const guardado = porConfig.get(config);
  if (guardado) return guardado;

  const escolhidaEm: Record<string, number> = {};
  let empresasComPerfil = 0;
  const comResposta = new Set(
    state.cultureAnswers.map((answer) => answer.companyId)
  );
  for (const companyId of comResposta) {
    const perfil = perfilDaEmpresa(state, companyId);
    if (!perfil.temas.some((tema) => tema.fecha)) continue;
    empresasComPerfil += 1;
    for (const pergunta of escolherPerguntasComConfig(
      perfil,
      config,
      competenciasDaEmpresa(state, companyId)
    )) {
      if (pergunta.semBaseDaEmpresa) continue;
      escolhidaEm[pergunta.itemId] = (escolhidaEm[pergunta.itemId] ?? 0) + 1;
    }
  }

  const uso = { escolhidaEm, empresasComPerfil };
  porConfig.set(config, uso);
  return uso;
}

/**
 * O perfil cultural da empresa, tema a tema, no formato que as telas leem.
 *
 * `ready` é falso enquanto nenhuma frase discriminante do tema alcança
 * `MIN_TEAM_RESPONSES` respostas da equipe: abaixo do mínimo o perfil não
 * fecha e a tela diz isso, em vez de tratar duas pessoas como "a empresa".
 */
export function getCompanyCultureProfile(
  state: DemoState,
  companyId: string
): CompanyCultureAxisProfile[] {
  return perfilDaEmpresa(state, companyId).temas.map((tema) => ({
    axisId: tema.axisId,
    mean: tema.media ?? tema.mediaProvisoria,
    respondents: tema.respondentes,
    byRole: tema.porPapel,
    dispersion: tema.dispersao,
    ready: tema.fecha
  }));
}

/** Médias por frase, no formato que o motor de aderência consome. */
function toItemMeans(perfil: PerfilCultural): CompanyItemMeans {
  const means: CompanyItemMeans = {};
  for (const [itemId, item] of Object.entries(perfil.itens)) {
    means[itemId] = { media: item.media, fecha: item.fecha };
  }
  return means;
}

/** Médias por tema já filtradas pelo que fechou (o Mapa de Cultura). */
function toAdherenceProfile(perfil: PerfilCultural): CompanyAxisMeans {
  const means: CompanyAxisMeans = {};
  for (const tema of perfil.temas) {
    means[tema.axisId] = tema.fecha ? tema.media : null;
  }
  return means;
}

/**
 * As 10 frases que o candidato desta vaga responde (M3, R4).
 *
 * Em cada tema, a frase discriminante em que a equipe da empresa é mais
 * marcante; sem base no tema, a frase padrão, marcada `semBaseDaEmpresa`.
 */
export function perguntasDoCandidato(
  state: DemoState,
  jobId: string
): (PerguntaDoCandidato & { item: ItemDoInstrumento })[] {
  const job = getJob(jobId);
  const perfil = job
    ? perfilDaEmpresa(state, job.companyId)
    : calcularPerfilCultural([]);
  return escolherPerguntasComConfig(
    perfil,
    configuracaoDoInstrumento(state),
    job ? competenciasDaEmpresa(state, job.companyId) : FIT_AXIS_IDS
  ).map((pergunta) => ({
    ...pergunta,
    item: getItem(pergunta.itemId)!
  }));
}

/* ------------------------------------------------------------------ *
 * Questionário do candidato (M3, R4, R5)
 * ------------------------------------------------------------------ */

export type CandidateJobView = {
  /** A atividade da vaga — o que a pessoa vai fazer. */
  activity: string;
  location: string;
  sector: string;
  shift: string;
};

/**
 * Tudo o que o candidato pode ver sobre a vaga.
 *
 * R5, dito duas vezes na reunião (00:22:21, 00:38:43): o nome da empresa não
 * aparece para o candidato antes da entrevista; ele vê atividade, localidade e
 * segmento. O turno entra porque é a informação que ele precisa para decidir
 * se se candidata, e não identifica ninguém.
 *
 * Este seletor é a única porta: qualquer superfície do candidato monta o que
 * mostra a partir daqui. Um `companyName` que escapasse por outro caminho
 * violaria a regra em silêncio, e é por isso que o retorno é um tipo fechado
 * de quatro campos, e não a vaga inteira.
 */
export function getCandidateJobView(
  state: DemoState,
  applicationId: string
): CandidateJobView | null {
  const application = getApplication(state, applicationId);
  if (!application) return null;

  const job = getJob(application.jobId);
  if (!job) return null;

  const company = getCompany(job.companyId);

  return {
    activity: job.title,
    location: job.location,
    sector: company?.sector ?? 'Segmento não informado',
    shift: job.workShift
  };
}

/** O registro de questionário desta candidatura, se houver. */
export function getFitResponse(
  state: DemoState,
  applicationId: string
): CandidateFitResponse | null {
  return (
    state.fitResponses?.find(
      (response) => response.applicationId === applicationId
    ) ?? null
  );
}

/* ------------------------------------------------------------------ *
 * A resposta é da pessoa e vale 12 meses
 * ------------------------------------------------------------------ */

/**
 * Memória do índice pessoa → frase, válida enquanto a lista de respostas for
 * a mesma. Mesmo contrato de `PERFIL_CACHE`: o reducer nunca muta a lista.
 *
 * Sem isto, resolver as respostas de uma candidatura varreria as milhares de
 * respostas da base, e a mesa de seleção faria isso uma vez por linha — O(n²)
 * por render, na tela em que a escala precisa aparecer.
 */
const RESPOSTAS_CACHE = new WeakMap<
  CandidateFitResponse[],
  IndiceDeRespostas
>();

const INDICE_VAZIO: IndiceDeRespostas = new Map();

/** Índice pessoa → frase → resposta mais recente, memorizado. */
export function indiceDeRespostas(state: DemoState): IndiceDeRespostas {
  const responses = state.fitResponses;
  if (!responses) return INDICE_VAZIO;

  let indice = RESPOSTAS_CACHE.get(responses);
  if (!indice) {
    indice = indexarRespostasPorPessoa(responses);
    RESPOSTAS_CACHE.set(responses, indice);
  }
  return indice;
}

/** Tudo o que esta pessoa já respondeu, em qualquer candidatura. */
export function getRespostasDaPessoa(
  state: DemoState,
  talentId: string
): RespostasDaPessoa | undefined {
  return indiceDeRespostas(state).get(talentId);
}

/**
 * O conjunto resolvido desta candidatura: o que vale, o que veio de antes e o
 * que ainda falta perguntar.
 *
 * É o contrato que as telas do candidato e a aderência consomem. `null` só
 * quando a candidatura ou a vaga não existem — sem resposta nenhuma, o
 * retorno vem com as 10 frases em `faltantes`, que é informação, não erro.
 */
export function respostasResolvidas(
  state: DemoState,
  applicationId: string
): RespostasResolvidas | null {
  const application = getApplication(state, applicationId);
  if (!application) return null;

  const job = getJob(application.jobId);
  if (!job) return null;

  return resolverRespostas({
    itemIds: perguntasDoCandidato(state, application.jobId).map(
      (pergunta) => pergunta.itemId
    ),
    applicationId,
    propria: getFitResponse(state, applicationId),
    daPessoa: getRespostasDaPessoa(state, application.talentId),
    agoraIso: DEMO_REFERENCE_DATE
  });
}

/**
 * As frases que ainda faltam perguntar nesta candidatura.
 *
 * É o que o questionário mostra: as frases que **aquela empresa** escolheu
 * menos as que a pessoa **já respondeu dentro da validade**. Vazio é estado
 * legítimo e tem nome próprio — ver `reaproveitamentoDaCandidatura` —, não um
 * formulário em branco.
 */
export function perguntasQueFaltam(
  state: DemoState,
  applicationId: string
): (PerguntaDoCandidato & { item: ItemDoInstrumento })[] {
  const application = getApplication(state, applicationId);
  if (!application) return [];

  const resolvidas = respostasResolvidas(state, applicationId);
  if (!resolvidas) return [];

  const faltantes = new Set(resolvidas.faltantes);
  return perguntasDoCandidato(state, application.jobId).filter((pergunta) =>
    faltantes.has(pergunta.itemId)
  );
}

/**
 * Esta pessoa precisa responder alguma coisa para esta vaga?
 *
 * Falso quando as respostas que ela já deu cobrem tudo o que esta empresa
 * pergunta e continuam dentro da validade.
 */
export function precisaResponderQuestionario(
  state: DemoState,
  applicationId: string
): boolean {
  const resolvidas = respostasResolvidas(state, applicationId);
  return resolvidas === null ? false : resolvidas.faltantes.length > 0;
}

/** O reaproveitamento desta candidatura, no formato que a tela mostra. */
export type ReaproveitamentoDaCandidatura = {
  /** Quantas frases esta empresa pergunta. */
  perguntadas: number;
  /** Quantas vêm de resposta anterior da própria pessoa. */
  reaproveitadas: number;
  /** Quantas foram respondidas nesta candidatura mesmo. */
  novas: number;
  /** Quantas ainda faltam. */
  faltantes: number;
  /** Data da resposta reaproveitada mais antiga (ISO), ou `null`. */
  desde: string | null;
  /** Até quando essas respostas valem (YYYY-MM-DD), ou `null`. */
  valemAte: string | null;
  /** Quantas respostas existiam e venceram — o caminho do "responda de novo". */
  vencidas: number;
  /**
   * Nada a perguntar: as respostas que a pessoa já deu cobrem esta vaga.
   * É o estado "suas respostas de <desde> ainda valem para esta vaga".
   */
  nadaAPerguntar: boolean;
};

/**
 * Quantas frases desta candidatura vêm de resposta reaproveitada, e de quando.
 *
 * Existe para a tela poder dizer à pessoa o que está acontecendo com o dado
 * dela — "usamos 6 respostas suas de 6 de setembro" — em vez de simplesmente
 * mostrar menos perguntas do que ela esperava. Transparência é o que torna o
 * reuso legítimo: LGPD, art. 6º, VI.
 */
export function reaproveitamentoDaCandidatura(
  state: DemoState,
  applicationId: string
): ReaproveitamentoDaCandidatura | null {
  const resolvidas = respostasResolvidas(state, applicationId);
  if (!resolvidas) return null;

  return {
    perguntadas: resolvidas.perguntadas.length,
    reaproveitadas: resolvidas.reaproveitadas.length,
    novas: resolvidas.novas.length,
    faltantes: resolvidas.faltantes.length,
    desde: resolvidas.reaproveitadasDesde,
    valemAte: resolvidas.reaproveitadasValemAte,
    vencidas: resolvidas.descartadas.filter(
      (descartada) => descartada.motivo === 'vencida'
    ).length,
    nadaAPerguntar:
      resolvidas.faltantes.length === 0 && resolvidas.respondidas.length > 0
  };
}

/** Até quando as respostas desta pessoa valem. */
export type ValidadeDasRespostas = {
  talentId: string;
  /** Frases com resposta dentro da validade. */
  validas: number;
  /** Frases cuja resposta já venceu. */
  vencidas: number;
  /** A resposta válida mais recente (ISO), ou `null`. */
  respondidoEm: string | null;
  /**
   * Último dia em que a resposta mais recente vale (YYYY-MM-DD).
   *
   * É a data que a pessoa lê: "suas respostas valem até 5 de setembro de
   * 2027". Sai da resposta mais nova porque é ela que a pessoa acabou de dar.
   */
  validaAte: string | null;
  meses: typeof VALIDADE_DA_RESPOSTA_MESES;
};

/**
 * Até quando a resposta desta pessoa vale (M7, §5.6).
 *
 * Fora de qualquer candidatura, de propósito: o prazo é da pessoa, e é isso
 * que a tela dela precisa dizer. Devolve `null` para quem nunca respondeu.
 */
export function validadeDasRespostas(
  state: DemoState,
  talentId: string
): ValidadeDasRespostas | null {
  const daPessoa = getRespostasDaPessoa(state, talentId);
  if (!daPessoa || daPessoa.porFrase.size === 0) return null;

  const hoje = DEMO_REFERENCE_DATE.slice(0, 10);
  let validas = 0;
  let vencidas = 0;
  let respondidoEm: string | null = null;

  for (const resposta of daPessoa.porFrase.values()) {
    if (hoje <= resposta.validaAte) {
      validas += 1;
      if (respondidoEm === null || resposta.answeredAt > respondidoEm) {
        respondidoEm = resposta.answeredAt;
      }
    } else {
      vencidas += 1;
    }
  }

  return {
    talentId,
    validas,
    vencidas,
    respondidoEm,
    validaAte: respondidoEm === null ? null : validaAte(respondidoEm),
    meses: VALIDADE_DA_RESPOSTA_MESES
  };
}

/**
 * A versão de aceite que esta candidatura precisa registrar.
 *
 * Uma só, e sempre a vigente: quem responde agora responde sob o texto atual.
 * Existe como seletor para que nenhuma tela decida isso por conta própria.
 */
export function versaoDoAceiteVigente(): string {
  return CANDIDATE_CONSENT_VERSION;
}

/**
 * Prazo do candidato para responder o fit, em dias (R7, 00:45:28).
 *
 * "1 a 2 dias para o candidato; quem não responde sai do processo." Fica no
 * limite superior: cortar antes de 2 dias seria mais severo do que o cliente
 * descreveu.
 */
export const CANDIDATE_FIT_DEADLINE_DAYS = 2;

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso.slice(0, 10)}T00:00:00.000Z`);
  const to = Date.parse(`${toIso.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.floor((to - from) / 86_400_000);
}

/**
 * Situação da resposta desta candidatura.
 *
 * Derivada, nunca gravada, e sempre contra a data de referência da base — a
 * demonstração precisa ser idêntica hoje e amanhã, então nada de relógio.
 * Quem não respondeu dentro do prazo aparece como `expirado` em vez de sumir:
 * R7 diz que essa pessoa sai do processo, e sair do processo é uma decisão
 * do analista, não um desaparecimento silencioso da lista.
 *
 * Desde que a resposta passou a ser da pessoa, `respondido` não quer dizer
 * "preencheu um formulário nesta candidatura": quer dizer que esta vaga tem
 * as 10 respostas de que precisa. Quem já havia respondido tudo dentro da
 * validade está respondido sem ter feito nada — é justamente o atrito que a
 * mudança tirou do caminho. A tela distingue os dois casos por
 * `reaproveitamentoDaCandidatura`; a mesa de seleção não precisa.
 */
export function getFitStatus(
  state: DemoState,
  application: Application
): FitStatus {
  const resolvidas = respostasResolvidas(state, application.id);
  if (
    resolvidas &&
    resolvidas.faltantes.length === 0 &&
    resolvidas.respondidas.length > 0
  )
    return 'respondido';
  return daysBetween(application.appliedAt, DEMO_REFERENCE_DATE) >
    CANDIDATE_FIT_DEADLINE_DAYS
    ? 'expirado'
    : 'pendente';
}

export const FIT_STATUS_LABEL: Record<FitStatus, string> = {
  respondido: 'Questionário respondido',
  pendente: 'Questionário pendente',
  expirado: 'Prazo do questionário vencido'
};

/* ------------------------------------------------------------------ *
 * Aderência (M4, R3)
 * ------------------------------------------------------------------ */

/**
 * A aderência desta candidatura, montada a partir do estado.
 *
 * Junta os três insumos que a conta precisa: a média da empresa da vaga (só
 * dos eixos cujo perfil fechou), a resposta do candidato àquela candidatura e
 * os pesos que a empresa declarou para a vaga. `computeAdherence` faz a
 * conta; aqui só se resolve de onde vem cada lado.
 *
 * Devolve `null` apenas quando a candidatura ou a vaga não existem. Faltando
 * um dos lados, o resultado vem com `total: null` — que é informação, e
 * diferente de "não sei do que você está falando".
 */
/**
 * Aderência entre uma pessoa e uma empresa, fora de qualquer candidatura.
 *
 * `getAdherence` responde "esta pessoa, nesta vaga" e precisa da candidatura
 * para achar a resposta do questionário e os pesos daquela vaga. O Mapa de
 * Cultura faz outra pergunta — "esta pessoa, nesta empresa" — e precisa
 * responder para a base inteira, inclusive quem nunca se candidatou ali.
 *
 * O motor é o mesmo de propósito: um segundo cálculo faria a mesma pessoa
 * aparecer com dois percentuais diferentes em duas telas. O que muda é de onde
 * vem o lado do candidato (as preferências declaradas, não o questionário da
 * candidatura) e os pesos, que sem vaga ficam todos iguais — não há vaga para
 * declarar prioridade.
 */
export function getTalentCompanyAdherence(
  state: DemoState,
  talentId: string,
  companyId: string
): AdherenceResult {
  const valores: CandidateAxisValues = {};
  for (const resposta of getTalentCultureAnswers(talentId)) {
    valores[resposta.axisId] = resposta.value;
  }

  return computeThemeAdherence(
    toAdherenceProfile(perfilDaEmpresa(state, companyId)),
    valores,
    {},
    competenciasDaEmpresa(state, companyId)
  );
}

export function getAdherence(
  state: DemoState,
  applicationId: string
): AdherenceResult | null {
  const application = getApplication(state, applicationId);
  if (!application) return null;

  const job = getJob(application.jobId);
  if (!job) return null;

  // O lado da pessoa é o conjunto **resolvido**: o que ela respondeu nesta
  // candidatura mais o que ela já havia respondido dentro da validade. Ler o
  // registro desta candidatura sozinho faria a pessoa que não precisou
  // responder aparecer sem aderência — ausência tratada como falta de dado
  // quando o dado existe.
  const resolvidas = respostasResolvidas(state, applicationId);

  return computeAdherence(
    toItemMeans(perfilDaEmpresa(state, job.companyId)),
    resolvidas && Object.keys(resolvidas.valores).length > 0
      ? resolvidas.valores
      : null,
    getAxisWeights(state, job),
    configuracaoDoInstrumento(state),
    competenciasDaEmpresa(state, job.companyId)
  );
}

/* ------------------------------------------------------------------ *
 * Ranking por vaga e limite de encaminhamento (M5, R6)
 * ------------------------------------------------------------------ */

export type JobRankingEntry = {
  application: Application;
  talent: Talent | null;
  technicalMatch: number | null;
  adherence: AdherenceResult;
  /** Posição na vaga, a partir de 1. */
  rank: number;
  belowThreshold: boolean;
  fitStatus: FitStatus;
};

/**
 * O ranking da vaga: técnico e aderência lado a lado (M5).
 *
 * É a cena do pitch — "o analista abre uma vaga e enxerga o ranking com fit" —
 * e substitui o Excel que juntava três relatórios à mão. Duas escolhas
 * merecem registro.
 *
 * **Ordena por aderência, não por uma nota combinada.** Somar técnico e
 * aderência numa medida só exigiria decidir quanto cada um vale, e ninguém
 * decidiu isso; pior, esconderia o caso que o cliente descreveu como dor
 * (R10): técnico baixo por filtro mal configurado e aderência alta. As duas
 * colunas ficam visíveis e o analista cruza.
 *
 * **Quem não respondeu vai para o fim, nunca para o zero.** Sem resposta não
 * há medida; ordenar ausência como se fosse aderência mínima seria punir pelo
 * silêncio. O desempate é o match técnico, que é a outra informação de fato
 * disponível.
 */
export function getJobRanking(
  state: DemoState,
  jobId: string
): JobRankingEntry[] {
  const job = getJob(jobId);
  if (!job) return [];

  return getApplicationsByJob(state, jobId)
    .map((application) => {
      const adherence = getAdherence(state, application.id);
      return {
        application,
        talent: getTalent(application.talentId, state),
        technicalMatch: application.technicalMatch ?? null,
        adherence: adherence ?? emptyAdherence(),
        fitStatus: getFitStatus(state, application)
      };
    })
    .sort((a, b) => {
      const left = a.adherence.total;
      const right = b.adherence.total;
      if (left !== right) {
        if (left === null) return 1;
        if (right === null) return -1;
        return right - left;
      }
      return (b.technicalMatch ?? -1) - (a.technicalMatch ?? -1);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      belowThreshold: entry.adherence.compatible === false
    }));
}

/**
 * Quantos currículos vão por vaga (R6, 00:33:30).
 *
 * "Máximo de 5 currículos por vaga. Sem banco de vagas." É limite do processo
 * do IEL com a indústria, não configuração de tela: a empresa recebe uma
 * remessa curta que consegue ler, e uma nova remessa só depois da devolutiva
 * (R9). Por isso o limite vive no reducer, que recusa o sexto e registra a
 * recusa, e não numa validação de formulário que outro caminho contornaria.
 */
export const REFERRAL_LIMIT = 5;

/**
 * Candidatos que o filtro técnico descartaria e a aderência resgata (S2).
 *
 * O cliente descreveu a dor com todas as letras (R10): o filtro técnico do
 * Empregare configurado errado expurga candidato aderente. Esta lista é
 * pequena de propósito — ela não reabre a vaga inteira, só mostra quem ficou
 * abaixo do corte técnico e, ainda assim, respondeu e ficou acima do corte de
 * aderência. A decisão de reabrir continua sendo do analista.
 */
export const RESCUE_TECHNICAL_CEILING = 50;

export function getRescueCandidates(
  state: DemoState,
  jobId: string
): JobRankingEntry[] {
  return getJobRanking(state, jobId).filter(
    (entry) =>
      entry.technicalMatch !== null &&
      entry.technicalMatch < RESCUE_TECHNICAL_CEILING &&
      entry.adherence.total !== null &&
      entry.adherence.total >= ADHERENCE_THRESHOLD
  );
}

/* ------------------------------------------------------------------ *
 * Amostra de colaboradores da empresa (M2, R2)
 * ------------------------------------------------------------------ */

/** Convites daquela empresa, na ordem em que foram enviados. */
export function getCultureInvites(
  state: DemoState,
  companyId: string
): CultureRespondentInvite[] {
  return (state.cultureInvites ?? []).filter(
    (invite) => invite.companyId === companyId
  );
}

export type CultureInviteStatus = 'aberto' | 'respondido' | 'expirado';

export type CultureSampleRoleProgress = {
  answered: number;
  total: number;
};

export type CultureSampleProgress = {
  answered: number;
  total: number;
  /** Prazo que a tela mostra: o do convite em aberto que vence por último. */
  deadline: string | null;
  /** Dias até o prazo, contra a data de referência. Negativo quando venceu. */
  daysLeft: number | null;
  overdue: boolean;
  byRole: Record<CultureInviteRole, CultureSampleRoleProgress>;
  requiredForProfile: typeof MIN_TEAM_RESPONSES;
  /** A consulta já sustenta o perfil da empresa? */
  ready: boolean;
};

function readInviteStatus(
  invite: CultureRespondentInvite,
  referenceDate: string
): CultureInviteStatus {
  if (invite.answeredAt) return 'respondido';
  return referenceDate > invite.expiresAt ? 'expirado' : 'aberto';
}

/**
 * "N de M responderam", com prazo e leitura por papel (M2).
 *
 * O prazo exibido é o do convite **em aberto** que vence por último, e não o
 * maior prazo de todos: a consulta pode sair em levas — três pessoas
 * acrescentadas depois têm prazo próprio —, e mostrar o prazo de quem já
 * respondeu faria a tela cobrar um vencimento que não cobra mais ninguém.
 * Sem nenhum convite em aberto, o prazo é o último que existiu, só para a
 * tela ter data; `overdue` já é falso porque não há o que esperar.
 *
 * `ready` olha para as respostas de **equipe**, não para o total: é o piso de
 * `MIN_TEAM_RESPONSES` que impede tratar duas pessoas como "a equipe", e é
 * ele que `getCompanyCultureProfile` usa para fechar ou não o perfil.
 */
export function getCultureSampleProgress(
  state: DemoState,
  companyId: string
): CultureSampleProgress {
  const invites = getCultureInvites(state, companyId);

  const byRole: Record<CultureInviteRole, CultureSampleRoleProgress> = {
    gestao: { answered: 0, total: 0 },
    rh: { answered: 0, total: 0 },
    equipe: { answered: 0, total: 0 }
  };

  let answered = 0;
  let latestOpenDeadline: string | null = null;
  let latestDeadline: string | null = null;

  for (const invite of invites) {
    byRole[invite.role].total += 1;
    if (invite.answeredAt) {
      byRole[invite.role].answered += 1;
      answered += 1;
    } else if (!latestOpenDeadline || invite.expiresAt > latestOpenDeadline) {
      latestOpenDeadline = invite.expiresAt;
    }
    if (!latestDeadline || invite.expiresAt > latestDeadline) {
      latestDeadline = invite.expiresAt;
    }
  }

  const deadline = latestOpenDeadline ?? latestDeadline;

  return {
    answered,
    total: invites.length,
    deadline,
    daysLeft: deadline ? daysBetween(DEMO_REFERENCE_DATE, deadline) : null,
    overdue:
      latestOpenDeadline !== null && DEMO_REFERENCE_DATE > latestOpenDeadline,
    byRole,
    requiredForProfile: MIN_TEAM_RESPONSES,
    ready: byRole.equipe.answered >= MIN_TEAM_RESPONSES
  };
}

/** Estado de um convite contra a data da demonstração, para a linha da tela. */
export function getCultureInviteStatus(
  invite: CultureRespondentInvite
): CultureInviteStatus {
  return readInviteStatus(invite, DEMO_REFERENCE_DATE);
}

/**
 * Uma empresa na lista do analista, já com o que a tabela mostra.
 *
 * O IEL atende mais de 2.500 empresas; a lista precisa filtrar e paginar sem
 * refazer, por linha, varreduras sobre todas as vagas e todos os convites.
 * Por isso a leitura agrupa vagas, convites e respostas por empresa uma vez e
 * só calcula perfil e amostra de quem tem consulta.
 */
export type CompanyListRow = {
  company: Company;
  /** Vagas que não estão encerradas. */
  openJobs: number;
  /** `null` quando nenhum colaborador foi convidado. */
  sample: CultureSampleProgress | null;
  /** Pontos do dia a dia que ainda não fecham. `null` sem consulta. */
  openPoints: number | null;
};

export function getCompanyListRows(state: DemoState): CompanyListRow[] {
  const openJobs = new Map<string, number>();
  for (const job of ALL_JOBS) {
    if (job.stage === 'encerrada') continue;
    openJobs.set(job.companyId, (openJobs.get(job.companyId) ?? 0) + 1);
  }
  const withInvites = new Set(
    (state.cultureInvites ?? []).map((invite) => invite.companyId)
  );
  const withAnswers = new Set(
    state.cultureAnswers.map((answer) => answer.companyId)
  );

  return getVisibleCompanies(state).map((company) => {
    const temConsulta =
      withInvites.has(company.id) || withAnswers.has(company.id);
    return {
      company,
      openJobs: openJobs.get(company.id) ?? 0,
      sample: withInvites.has(company.id)
        ? getCultureSampleProgress(state, company.id)
        : null,
      openPoints: temConsulta
        ? getCompanyCultureProfile(state, company.id).filter(
            (axis) => !axis.ready
          ).length
        : null
    };
  });
}

/**
 * O convite como a tela do colaborador pode vê-lo (PRODUTO.md §5).
 *
 * É deliberadamente magro. Quem abre o link responde sobre o próprio ambiente
 * de trabalho: não precisa — e não pode — ver quem mais foi convidado, quem já
 * respondeu ou o que responderam. Nem o e-mail para o qual o convite foi
 * enviado volta daqui; o token não o carrega, e devolvê-lo transformaria um
 * link vazado em vazamento de dado pessoal.
 *
 * Também não há nome: o convite não guarda nome nenhum. A tela se apresenta
 * pela empresa ("Consulta à equipe · Cerrado Distribuição"), que é o que a
 * pessoa precisa para reconhecer o link.
 */
export type CultureInviteView = {
  inviteId: string;
  /** Para o atalho da equipe de volta à empresa; não identifica pessoa. */
  companyId: string;
  companyName: string;
  expiresAt: string;
  daysLeft: number;
  status: CultureInviteStatus;
  /**
   * As frases que este link responde (amostragem em matriz, cerca de 15 das
   * 52). O texto é o original da planilha: quem responde é da empresa.
   */
  bloco: ItemDoInstrumento[];
};

export function getInviteByToken(
  state: DemoState,
  token: string
): CultureInviteView | null {
  const invite = (state.cultureInvites ?? []).find(
    (entry) => entry.token === token
  );
  if (!invite) return null;

  return {
    inviteId: invite.id,
    companyId: invite.companyId,
    companyName: getCompany(invite.companyId)?.name ?? invite.companyId,
    expiresAt: invite.expiresAt,
    daysLeft: daysBetween(DEMO_REFERENCE_DATE, invite.expiresAt),
    status: readInviteStatus(invite, DEMO_REFERENCE_DATE),
    bloco: blocoDoConvite(
      invite,
      configuracaoDoInstrumento(state),
      competenciasDaEmpresa(state, invite.companyId)
    )
  };
}

/* ------------------------------------------------------------------ *
 * Importação de planilha (M6)
 * ------------------------------------------------------------------ */

/** Importações já aplicadas naquela vaga, da mais recente para a mais antiga. */
export function getImportHistory(
  state: DemoState,
  jobId: string
): SpreadsheetImportRecord[] {
  return (state.spreadsheetImports ?? [])
    .filter((record) => record.jobId === jobId)
    .slice()
    .reverse();
}

/* ------------------------------------------------------------------ *
 * Relatório da empresa por link (S3)
 * ------------------------------------------------------------------ */

/** Uma pessoa enviada, como a empresa pode vê-la. */
export type ReferralReportPerson = {
  /** Posição na remessa, a partir de 1. Ordena por quanto combina. */
  position: number;
  /** Chave da devolutiva: é por ela que a empresa responde o desfecho (C3). */
  applicationId: string;
  /** O que a empresa já respondeu sobre esta pessoa. */
  outcome: ReferralOutcome;
  /** Onde está o segundo momento hoje (permanência aos 90 dias). */
  retentionState: EstadoDaPermanencia;
  name: string;
  initials: string;
  headline: string;
  city: string;
  /** "3 anos de experiência", ou `null` quando o currículo não permite dizer. */
  experienceSpan: string | null;
  /** Resumo congelado no momento do envio, nunca o que foi escrito depois. */
  summary: string;
  attentionPoints: string[];
  suggestedQuestions: string[];
  /** Percentual total de aderência. `null` sem base dos dois lados. */
  adherenceTotal: number | null;
  byAxis: { axisId: FitAxisId; match: ReportAxisMatch }[];
  technicalMatch: number | null;
};

export type ReferralReport = {
  /** Id do encaminhamento: a empresa responde a devolutiva contra ele. */
  referralId: string;
  company: Company;
  job: Job;
  sentAt: string | null;
  sentBy: string;
  people: ReferralReportPerson[];
  sampleProgress: CultureSampleProgress;
  /** Quantos candidatos daquela vaga responderam o questionário de fit. */
  evaluatedCount: number;
  mostDivergentAxis: FitAxisId | null;
};

/** Quem assina o envio na página da empresa. */
const REPORT_SENDER = 'Analista IEL';

/** O endereço do relatório daquela vaga, para copiar e enviar à empresa. */
export function getReportTokenForJob(jobId: string): string {
  return buildReportToken(jobId);
}

/**
 * O relatório de uma vaga, resolvido pelo token do link (S3).
 *
 * Monta o recorte **mínimo** que a empresa pode ver: as pessoas registradas
 * naquele encaminhamento, a aderência delas por ponto em faixa, o agregado da
 * consulta à equipe e nada mais. Outros candidatos da vaga não entram, resposta
 * individual de colaborador não entra e a alternativa que o candidato marcou
 * não entra (PRODUTO.md §5.1).
 *
 * Devolve `null` quando o token não corresponde a nenhuma vaga com
 * encaminhamento registrado — inclusive quando a vaga existe mas nada foi
 * enviado ainda: sem envio não há o que a empresa possa abrir.
 */
export function getReferralReport(
  state: DemoState,
  token: string,
  /** "Hoje" para derivar o estado do segundo momento (C3). */
  hoje: string = DEMO_REFERENCE_DATE
): ReferralReport | null {
  const job = ALL_JOBS.find((entry) => buildReportToken(entry.id) === token);
  if (!job) return null;

  const company = getCompany(job.companyId);
  if (!company) return null;

  const referral = state.referrals.find(
    (entry) => entry.jobId === job.id && entry.state === 'registrado'
  );
  if (!referral) return null;

  const people = referral.items
    .map((item) => {
      const application = getApplication(state, item.applicationId);
      const talent = application
        ? getTalent(application.talentId, state)
        : null;
      if (!application || !talent) return null;

      const adherence = getAdherence(state, application.id);
      const outcome = lerDevolutiva(item.outcome);

      return {
        applicationId: item.applicationId,
        outcome,
        retentionState: estadoDaPermanencia(outcome, hoje),
        name: talent.name,
        initials: initialsOf(talent.name),
        headline: talent.headline,
        city: talent.city,
        experienceSpan: formatExperienceSpan(
          talent.experiences.map((experience) => experience.period)
        ),
        summary: item.summary,
        attentionPoints: item.attentionPoints,
        suggestedQuestions: item.suggestedQuestions,
        adherenceTotal: adherence?.total ?? null,
        byAxis: (adherence?.byAxis ?? []).map((entry) => ({
          axisId: entry.axisId,
          match: readAxisMatch(entry.adherence)
        })),
        technicalMatch: application.technicalMatch ?? null
      };
    })
    .filter((person): person is Omit<ReferralReportPerson, 'position'> =>
      Boolean(person)
    )
    // A ordem é a do quanto combina, como a página promete no texto de
    // abertura. Quem não tem medida vai para o fim, nunca para o zero.
    .sort((left, right) => {
      if (left.adherenceTotal === right.adherenceTotal) {
        return (right.technicalMatch ?? -1) - (left.technicalMatch ?? -1);
      }
      if (left.adherenceTotal === null) return 1;
      if (right.adherenceTotal === null) return -1;
      return right.adherenceTotal - left.adherenceTotal;
    })
    .map((person, index) => ({ ...person, position: index + 1 }));

  const evaluatedCount = getApplicationsByJob(state, job.id).filter(
    (application) => getFitStatus(state, application) === 'respondido'
  ).length;

  return {
    referralId: referral.id,
    company,
    job,
    sentAt: referral.createdAt,
    sentBy: REPORT_SENDER,
    people,
    sampleProgress: getCultureSampleProgress(state, company.id),
    evaluatedCount,
    mostDivergentAxis: findMostDivergentAxis(people)
  };
}

/* ------------------------------------------------------------------ *
 * Devolutiva da empresa, do lado da analista (C3)
 * ------------------------------------------------------------------ */

/** Uma pessoa encaminhada e o que a empresa respondeu sobre ela. */
export type ReferralOutcomeRow = {
  referralId: string;
  jobId: string;
  companyId: string;
  applicationId: string;
  /** Nome só do lado do IEL: a agregação por empresa não usa nome. */
  talentName: string;
  outcome: ReferralOutcome;
  retentionState: EstadoDaPermanencia;
  /** Há quantos dias esta pessoa espera resposta; `null` se não espera. */
  waitingDays: number | null;
};

/** O que uma remessa devolveu, para a analista saber o que cobrar. */
export type ReferralOutcomeSummary = {
  total: number;
  respondidos: number;
  contratados: number;
  naoContratados: number;
  pendentes: number;
  /** Quantos contratados saíram antes de 90 dias. */
  saidasAntes90: number;
  /** Maior espera em aberto, em dias. `null` quando nada está pendente. */
  maiorEsperaDias: number | null;
  linhas: ReferralOutcomeRow[];
};

/**
 * O retrato da devolutiva de uma remessa (C3).
 *
 * É o que permite cobrar, que é o trabalho real da analista — "a gente tem
 * que ficar em cima" (00:44:09). Sem isto, a tela mostrava a intenção de
 * entrevistar e parava ali; quem precisa saber se a vaga fechou não tinha
 * onde olhar.
 */
export function getReferralOutcomeSummary(
  state: DemoState,
  referralId: string,
  hoje: string = DEMO_REFERENCE_DATE
): ReferralOutcomeSummary | null {
  const referral = getReferral(state, referralId);
  if (!referral) return null;

  const linhas: ReferralOutcomeRow[] = referral.items.map((item) => {
    const application = getApplication(state, item.applicationId);
    const talent = application ? getTalent(application.talentId, state) : null;
    const outcome = lerDevolutiva(item.outcome);
    return {
      referralId: referral.id,
      jobId: referral.jobId,
      companyId: referral.companyId,
      applicationId: item.applicationId,
      talentName: talent?.name ?? item.applicationId,
      outcome,
      retentionState: estadoDaPermanencia(outcome, hoje),
      waitingDays: diasEsperando(outcome, referral.createdAt, hoje)
    };
  });

  const esperas = linhas
    .map((linha) => linha.waitingDays)
    .filter((dias): dias is number => dias !== null);

  return {
    total: linhas.length,
    respondidos: linhas.filter((linha) => temDevolutiva(linha.outcome)).length,
    contratados: linhas.filter((linha) => linha.outcome.hiring === 'contratou')
      .length,
    naoContratados: linhas.filter(
      (linha) => linha.outcome.hiring === 'nao-contratou'
    ).length,
    pendentes: linhas.filter((linha) => !temDevolutiva(linha.outcome)).length,
    saidasAntes90: linhas.filter(
      (linha) => linha.retentionState === 'saiu-antes-de-90-dias'
    ).length,
    maiorEsperaDias: esperas.length > 0 ? Math.max(...esperas) : null,
    linhas
  };
}

/**
 * Tudo o que está esperando resposta da empresa, da espera mais longa para a
 * mais curta (C3).
 *
 * Percorre só os encaminhamentos registrados — algumas dezenas, não as 2.500
 * empresas da carteira — porque devolutiva só existe onde houve remessa.
 */
export function getPendingOutcomes(
  state: DemoState,
  hoje: string = DEMO_REFERENCE_DATE
): ReferralOutcomeRow[] {
  return getRegisteredReferrals(state)
    .flatMap(
      (referral) =>
        getReferralOutcomeSummary(state, referral.id, hoje)?.linhas ?? []
    )
    .filter((linha) => linha.waitingDays !== null)
    .sort((a, b) => (b.waitingDays ?? 0) - (a.waitingDays ?? 0));
}

/* ------------------------------------------------------------------ *
 * Acompanhamento de quem foi contratado (a pessoa como segunda fonte)
 * ------------------------------------------------------------------ */

type IndiceDeCheckIns = {
  porCandidatura: Map<string, CheckIn[]>;
  porPessoa: Map<string, CheckIn[]>;
};

/**
 * Índice candidatura → check-ins e pessoa → check-ins, memorizado por
 * identidade da lista, no padrão de `indiceDeRespostas`. A fila do
 * acompanhamento pergunta isso uma vez por contratação; sem índice, seria
 * uma varredura da lista por linha.
 */
const CHECK_INS_CACHE = new WeakMap<CheckIn[], IndiceDeCheckIns>();

const INDICE_DE_CHECK_INS_VAZIO: IndiceDeCheckIns = {
  porCandidatura: new Map(),
  porPessoa: new Map()
};

function ordenarPorMarco(lista: CheckIn[]): CheckIn[] {
  return lista.sort((a, b) => a.marco - b.marco);
}

function indiceDeCheckIns(state: DemoState): IndiceDeCheckIns {
  const checkIns = state.checkIns;
  if (!checkIns) return INDICE_DE_CHECK_INS_VAZIO;

  let indice = CHECK_INS_CACHE.get(checkIns);
  if (!indice) {
    const porCandidatura = new Map<string, CheckIn[]>();
    const porPessoa = new Map<string, CheckIn[]>();
    for (const checkIn of checkIns) {
      const daCandidatura = porCandidatura.get(checkIn.applicationId) ?? [];
      daCandidatura.push(checkIn);
      porCandidatura.set(checkIn.applicationId, daCandidatura);
      const daPessoa = porPessoa.get(checkIn.talentId) ?? [];
      daPessoa.push(checkIn);
      porPessoa.set(checkIn.talentId, daPessoa);
    }
    porCandidatura.forEach(ordenarPorMarco);
    porPessoa.forEach(ordenarPorMarco);
    indice = { porCandidatura, porPessoa };
    CHECK_INS_CACHE.set(checkIns, indice);
  }
  return indice;
}

/** Check-ins de uma candidatura, em ordem de marco. */
export function getCheckInsDaCandidatura(
  state: DemoState,
  applicationId: string
): CheckIn[] {
  return indiceDeCheckIns(state).porCandidatura.get(applicationId) ?? [];
}

/** Tudo o que esta pessoa respondeu nos check-ins, em qualquer contratação. */
export function getCheckInsDaPessoa(
  state: DemoState,
  talentId: string
): CheckIn[] {
  return indiceDeCheckIns(state).porPessoa.get(talentId) ?? [];
}

type ContratacaoInformada = { referral: Referral; item: ReferralItem };

/**
 * Índice candidatura → item de remessa contratado, por identidade de
 * `state.referrals`. Contratação só existe em remessa registrada com
 * `outcome.hiring === 'contratou'` e data.
 */
const CONTRATACOES_CACHE = new WeakMap<
  Referral[],
  Map<string, ContratacaoInformada>
>();

function contratacoesInformadas(
  state: DemoState
): Map<string, ContratacaoInformada> {
  let indice = CONTRATACOES_CACHE.get(state.referrals);
  if (!indice) {
    indice = new Map();
    for (const referral of state.referrals) {
      if (referral.state !== 'registrado') continue;
      for (const item of referral.items) {
        const desfecho = lerDevolutiva(item.outcome);
        if (desfecho.hiring !== 'contratou' || !desfecho.hiringAt) continue;
        indice.set(item.applicationId, { referral, item });
      }
    }
    CONTRATACOES_CACHE.set(state.referrals, indice);
  }
  return indice;
}

type LeituraDeFonte = { estado: 'continua' | 'saiu'; em: string } | null;

/** O que a empresa disse da permanência, se disse. */
function permanenciaSegundoAEmpresa(item: ReferralItem): LeituraDeFonte {
  const desfecho = lerDevolutiva(item.outcome);
  if (desfecho.retention === 'pendente' || !desfecho.retentionAt) return null;
  return {
    estado: desfecho.retention === 'continua' ? 'continua' : 'saiu',
    em: desfecho.retentionAt
  };
}

/**
 * O que a pessoa disse da permanência, se disse.
 *
 * Um "saiu" em qualquer marco vale: quem saiu não volta a responder que
 * continua no marco seguinte. Sem "saiu", o check-in mais recente diz que
 * ela continua.
 */
function permanenciaSegundoAPessoa(checkIns: CheckIn[]): LeituraDeFonte {
  const saida = checkIns.find((checkIn) => !checkIn.continua);
  if (saida) return { estado: 'saiu', em: saida.respondidoEm };
  const ultimo = checkIns[checkIns.length - 1];
  return ultimo ? { estado: 'continua', em: ultimo.respondidoEm } : null;
}

/**
 * Junta as duas fontes sem que uma apague a outra.
 *
 * Quando discordam, o estado é "saiu": entre a empresa que não voltou a
 * responder e a pessoa que contou que saiu, o produto assume o pior caso e
 * marca a divergência para a analista ligar. É diagnóstico, como gestão ×
 * equipe no mapa de cultura — a diferença é o dado.
 */
function combinarPermanencia(
  empresa: LeituraDeFonte,
  pessoa: LeituraDeFonte
): SituacaoDeContratacao['permanencia'] & { divergencia: boolean } {
  if (!empresa && !pessoa) {
    return {
      estado: 'sem-informacao',
      fonte: null,
      em: null,
      divergencia: false
    };
  }
  if (empresa && pessoa) {
    const divergencia = empresa.estado !== pessoa.estado;
    const fonte: FonteDaPermanencia = 'ambos';
    return {
      estado: divergencia ? 'saiu' : empresa.estado,
      fonte,
      em: empresa.em > pessoa.em ? empresa.em : pessoa.em,
      divergencia
    };
  }
  const unica = (empresa ?? pessoa)!;
  return {
    estado: unica.estado,
    fonte: empresa ? 'empresa' : 'pessoa',
    em: unica.em,
    divergencia: false
  };
}

function montarSituacao(
  state: DemoState,
  contratacao: ContratacaoInformada,
  hoje: string
): SituacaoDeContratacao | null {
  const { referral, item } = contratacao;
  const application = getApplication(state, item.applicationId);
  const contratadoEm = lerDevolutiva(item.outcome).hiringAt;
  if (!application || !contratadoEm) return null;

  const diasNaEmpresa = Math.max(0, diasEntre(contratadoEm, hoje));
  const checkIns = getCheckInsDaCandidatura(state, item.applicationId);
  const respondidos = new Set(checkIns.map((checkIn) => checkIn.marco));
  const empresa = permanenciaSegundoAEmpresa(item);
  const pessoa = permanenciaSegundoAPessoa(checkIns);
  const { divergencia, ...permanencia } = combinarPermanencia(empresa, pessoa);

  // Quem já contou que saiu não tem marco a responder: perguntar "você
  // continua?" de novo seria não ter ouvido a primeira resposta. O mesmo
  // vale quando a empresa registrou a saída.
  const encerrado = permanencia.estado === 'saiu';

  const pendentes: MarcoDoAcompanhamento[] = [];
  const perdidos: MarcoDoAcompanhamento[] = [];
  let marcoAtual: MarcoDoAcompanhamento | null = null;
  let proximoMarco: MarcoDoAcompanhamento | null = null;
  for (const marco of MARCOS_DO_ACOMPANHAMENTO) {
    if (respondidos.has(marco)) continue;
    if (encerrado) continue;
    if (!marcoAlcancado(marco, diasNaEmpresa)) {
      proximoMarco ??= marco;
      continue;
    }
    if (marcoAberto(marco, diasNaEmpresa)) {
      pendentes.push(marco);
      marcoAtual = marco;
    } else if (marcoPerdido(marco, diasNaEmpresa)) {
      perdidos.push(marco);
    }
  }

  return {
    applicationId: item.applicationId,
    talentId: application.talentId,
    companyId: referral.companyId,
    jobId: referral.jobId,
    contratadoEm,
    diasNaEmpresa,
    marcoAtual,
    proximoMarco,
    checkIns,
    pendentes,
    perdidos,
    permanencia,
    divergencia,
    porFonte: {
      empresa: empresa?.estado ?? null,
      pessoa: pessoa?.estado ?? null
    }
  };
}

/**
 * Situação de uma contratação, para a tela da pessoa e a da analista.
 * `null` se a candidatura não foi contratada (ou a empresa não respondeu).
 *
 * Regra de marco: alcançado quando `diasNaEmpresa >= marco`; aberto do dia
 * do marco até `JANELA_DO_MARCO_DIAS` depois (o de 90 fica aberto até o dia
 * 120); fechada a janela sem resposta, o marco vai para `perdidos` e não é
 * mais cobrado. Tudo relativo ao "hoje" da demonstração
 * (`DEMO_REFERENCE_DATE`, o mesmo dia de `nowIso()`).
 */
export function getSituacaoDeContratacao(
  state: DemoState,
  applicationId: string,
  hoje: string = DEMO_REFERENCE_DATE
): SituacaoDeContratacao | null {
  const contratacao = contratacoesInformadas(state).get(applicationId);
  return contratacao ? montarSituacao(state, contratacao, hoje) : null;
}

/** Há quantos dias o marco pendente mais antigo está aberto. */
function diasDePendencia(situacao: SituacaoDeContratacao): number {
  const maisAntigo = situacao.pendentes[0];
  return maisAntigo === undefined ? -1 : situacao.diasNaEmpresa - maisAntigo;
}

/** Memoização em dois níveis: identidade de `referrals`, depois de `checkIns`. */
const ACOMPANHAMENTO_CACHE = new WeakMap<
  Referral[],
  WeakMap<CheckIn[], SituacaoDeContratacao[]>
>();
const SEM_CHECK_INS: CheckIn[] = [];

/**
 * Todas as contratações informadas, da mais urgente para a menos: primeiro
 * quem tem check-in pendente há mais tempo, depois o que pede uma ligação
 * para a empresa — divergência entre os dois lados, ou saída que só a pessoa
 * contou e a empresa não informou —, depois o resto (contratação mais
 * recente primeiro).
 *
 * É a fila da analista: quem ela liga hoje. Memorizada porque a tela a
 * recalcula a cada render e a lista cresce com cada "contratei".
 */
export function getAcompanhamento(
  state: DemoState,
  hoje: string = DEMO_REFERENCE_DATE
): SituacaoDeContratacao[] {
  const checkIns = state.checkIns ?? SEM_CHECK_INS;
  const memorizavel = hoje === DEMO_REFERENCE_DATE;
  if (memorizavel) {
    const cache = ACOMPANHAMENTO_CACHE.get(state.referrals)?.get(checkIns);
    if (cache) return cache;
  }

  const situacoes: SituacaoDeContratacao[] = [];
  for (const contratacao of contratacoesInformadas(state).values()) {
    const situacao = montarSituacao(state, contratacao, hoje);
    if (situacao) situacoes.push(situacao);
  }

  const pedeLigacao = (situacao: SituacaoDeContratacao): boolean =>
    situacao.divergencia ||
    (situacao.porFonte.pessoa === 'saiu' && situacao.porFonte.empresa === null);
  const grupo = (situacao: SituacaoDeContratacao): number =>
    situacao.pendentes.length > 0 ? 0 : pedeLigacao(situacao) ? 1 : 2;
  situacoes.sort((a, b) => {
    const porGrupo = grupo(a) - grupo(b);
    if (porGrupo !== 0) return porGrupo;
    if (grupo(a) === 0) return diasDePendencia(b) - diasDePendencia(a);
    return b.contratadoEm.localeCompare(a.contratadoEm);
  });

  if (memorizavel) {
    let porCheckIns = ACOMPANHAMENTO_CACHE.get(state.referrals);
    if (!porCheckIns) {
      porCheckIns = new WeakMap();
      ACOMPANHAMENTO_CACHE.set(state.referrals, porCheckIns);
    }
    porCheckIns.set(checkIns, situacoes);
  }
  return situacoes;
}

/** Quantos dias um marco fica aberto; reexportado para a tela não importar a regra de dois lugares. */
export { JANELA_DO_MARCO_DIAS };

/*
 * Escala: listas e barra lateral com a carteira inteira do IEL.
 *
 * A base tem mais de 2.500 empresas, e a maioria não tem vaga aberta nem
 * consulta de cultura. Os seletores abaixo existem para que nenhuma tela
 * percorra a carteira inteira a cada render quando só uma fração importa.
 */

/**
 * Empresas visíveis que já receberam alguma resposta de cultura.
 *
 * É o recorte que a fila do dia precisa: um ponto em aberto só existe quando
 * alguém respondeu. Empresa sem resposta nenhuma não entra na fila — e, sem
 * este filtro, a fila calcularia a leitura de cultura de 2.500 empresas para
 * descartar quase todas.
 */
export function getCompaniesWithCultureAnswers(state: DemoState): Company[] {
  const withAnswers = new Set(
    state.cultureAnswers.map((answer) => answer.companyId)
  );
  return getVisibleCompanies(state).filter((company) =>
    withAnswers.has(company.id)
  );
}

/** Quantas pessoas passam do corte nesta vaga. */
export function getCompatibleCount(state: DemoState, jobId: string): number {
  return getJobRanking(state, jobId).filter(
    (entry) => entry.adherence.compatible === true
  ).length;
}

/**
 * Onde a vaga está, do ponto de vista de quem trabalha nela.
 *
 * "Aguardando empresa" é a vaga que já teve currículos enviados: o próximo
 * passo é a devolutiva da indústria, não da analista.
 */
export type JobListState = 'em-selecao' | 'aguardando-empresa' | 'encerrada';

export const JOB_LIST_STATE_LABEL: Record<JobListState, string> = {
  'em-selecao': 'Em seleção',
  'aguardando-empresa': 'Aguardando empresa',
  encerrada: 'Encerradas'
};

export function getJobListState(state: DemoState, job: Job): JobListState {
  if (job.stage === 'encerrada') return 'encerrada';
  const sent = state.referrals.some(
    (referral) => referral.jobId === job.id && referral.state === 'registrado'
  );
  return sent ? 'aguardando-empresa' : 'em-selecao';
}
