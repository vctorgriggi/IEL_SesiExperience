import {
  ADHERENCE_THRESHOLD,
  computeAdherence,
  type AdherenceResult,
  type CompanyAxisMeans
} from '../analysis/adherence';
import {
  CRITERION_STATE_META,
  getCoverage,
  getCriterionAnalysis,
  type CoverageSummary
} from '../analysis/criterion-states';
import {
  CULTURE_QUESTIONS,
  getCultureOptionLabel,
  getCultureOptionValue,
  MIN_TEAM_RESPONSES,
  type CultureOptionId,
  type CultureQuestion,
  type CultureRespondent
} from '../analysis/culture';
import {
  getSuggestedSampleSize,
  type CultureInviteRole
} from '../analysis/culture-invites';
import { FIT_AXES, type FitAxis, type FitAxisId } from '../analysis/fit-axes';
import {
  ALL_COMPANIES,
  ALL_JOBS,
  ALL_TALENTS,
  DEMO_ASSESSMENTS,
  DEMO_CATALOG,
  DEMO_DATA_SOURCES,
  DEMO_PERSONAS
} from '../fixtures';
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

export function getCompany(companyId: string): Company | null {
  return ALL_COMPANIES.find((company) => company.id === companyId) ?? null;
}

export function getJob(jobId: string): Job | null {
  return ALL_JOBS.find((job) => job.id === jobId) ?? null;
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
    ALL_TALENTS.find((talent) => talent.id === talentId) ??
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
  return ALL_JOBS.filter((job) => job.companyId === companyId);
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

export function getVisibleJobs(state: DemoState): Job[] {
  const persona = getPersona(state);
  if (persona.kind === 'gestor' && persona.companyId) {
    return getJobsByCompany(persona.companyId);
  }
  return ALL_JOBS;
}

export function getVisibleCompanies(state: DemoState): Company[] {
  const persona = getPersona(state);
  if (persona.kind === 'gestor' && persona.companyId) {
    const company = getCompany(persona.companyId);
    return company ? [company] : [];
  }
  return ALL_COMPANIES;
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
  /** Alternativa mais respondida por este papel. */
  optionId: CultureOptionId;
  optionLabel: string;
  /** Respostas nesta alternativa e total do papel. */
  count: number;
  total: number;
};

export type CultureAxisReading = {
  question: CultureQuestion;
  voices: CultureVoice[];
  state: CultureAxisState;
  /** Proposta da análise ainda não confirmada por ninguém. */
  pendingSuggestion: CultureSuggestion | null;
};

/**
 * Leitura do traçado cultural de uma empresa, eixo a eixo.
 *
 * Nunca reduz os papéis a um valor só. Se a gestão diz uma coisa e a equipe
 * diz outra, as duas aparecem e o eixo é marcado como divergente — o enunciado
 * pede redução de vieses, e média entre quem manda e quem executa apaga
 * exatamente o viés que interessa ver.
 */
export function getCultureReading(
  state: DemoState,
  companyId: string
): CultureAxisReading[] {
  const company = getCompany(companyId);
  const answers = state.cultureAnswers.filter(
    (answer) => answer.companyId === companyId
  );

  return CULTURE_QUESTIONS.map((question) => {
    const axisAnswers = answers.filter(
      (answer) => answer.axisId === question.axisId
    );

    const voices: CultureVoice[] = [];
    for (const respondent of [
      'gestao',
      'rh',
      'equipe'
    ] as CultureRespondent[]) {
      const byRespondent = axisAnswers.filter(
        (answer) => answer.respondent === respondent
      );
      if (byRespondent.length === 0) continue;

      const total = byRespondent.reduce((sum, a) => sum + a.count, 0);
      const top = [...byRespondent].sort((a, b) => b.count - a.count)[0]!;
      voices.push({
        respondent,
        optionId: top.optionId,
        optionLabel: getCultureOptionLabel(question.axisId, top.optionId),
        count: top.count,
        total
      });
    }

    const pendingSuggestion =
      company?.cultureSuggestions.find(
        (suggestion) =>
          suggestion.axisId === question.axisId &&
          !axisAnswers.some((answer) => answer.respondent === 'gestao')
      ) ?? null;

    return {
      question,
      voices,
      state: readCultureAxisState(voices),
      pendingSuggestion
    };
  });
}

function readCultureAxisState(voices: CultureVoice[]): CultureAxisState {
  if (voices.length === 0) return 'sem-resposta';

  const team = voices.find((voice) => voice.respondent === 'equipe');
  const management = voices.find((voice) => voice.respondent !== 'equipe');

  if (!team) return management ? 'apenas-gestao' : 'sem-resposta';
  if (team.total < MIN_TEAM_RESPONSES) return 'consulta-insuficiente';
  if (!management) return 'convergente';

  return voices.every((voice) => voice.optionId === voices[0]!.optionId)
    ? 'convergente'
    : 'divergente';
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

export type CultureDispersion = 'convergente' | 'divergente';

export type CompanyCultureAxisProfile = {
  axisId: FitAxisId;
  /** Média ponderada por `count` de todos os papéis. `null` sem resposta. */
  mean: number | null;
  /** Quantas pessoas responderam este eixo, somados os papéis. */
  respondents: number;
  /** Média de cada papel, para a tela mostrar de onde vem a média geral. */
  byRole: { gestao?: number; rh?: number; equipe?: number };
  /** Diagnóstico gestão × equipe. `null` quando não há como comparar. */
  dispersion: CultureDispersion | null;
  /** O perfil fecha neste eixo? Falso não é zero: é perfil em aberto. */
  ready: boolean;
};

/**
 * O perfil cultural da empresa, eixo a eixo, como o cliente opera.
 *
 * "O fit cultural é a média do que a empresa entende" (00:41:44). O briefing
 * dizia o contrário — que a média entre quem manda e quem executa apaga o
 * viés que interessa ver — e nisso o briefing perdeu, mas só em parte: a
 * média virou o perfil, e a dispersão continua calculada ao lado. Uma coisa
 * não apaga a outra. A média é o que o motor de aderência compara; a
 * dispersão é o que o analista leva para a conversa com a empresa.
 *
 * A média é ponderada por `count` e junta gestão, RH e equipe no mesmo bolo,
 * porque é assim que "o que a empresa entende" se forma: cinco pessoas da
 * equipe pesam cinco vezes mais que a gestora sozinha. Nenhuma resposta
 * individual é identificável — a equipe entra agregada desde a fixture.
 *
 * `ready` é falso enquanto a consulta à equipe não alcança
 * `MIN_TEAM_RESPONSES`. O documento de produto é explícito: abaixo do mínimo
 * de respondentes o perfil não fecha e a tela diz isso, em vez de tratar duas
 * pessoas como "a empresa". Um eixo não pronto não entra no cálculo da
 * aderência.
 */
export function getCompanyCultureProfile(
  state: DemoState,
  companyId: string
): CompanyCultureAxisProfile[] {
  const answers = state.cultureAnswers.filter(
    (answer) => answer.companyId === companyId
  );
  const reading = getCultureReading(state, companyId);

  return FIT_AXES.map((axis) => {
    const axisAnswers = answers.filter((answer) => answer.axisId === axis.id);

    let weightedSum = 0;
    let respondents = 0;
    const roleTotals: Record<CultureRespondent, { sum: number; n: number }> = {
      gestao: { sum: 0, n: 0 },
      rh: { sum: 0, n: 0 },
      equipe: { sum: 0, n: 0 }
    };

    for (const answer of axisAnswers) {
      const value = getCultureOptionValue(axis.id, answer.optionId);
      // Resposta a uma alternativa que não existe mais no questionário não
      // entra na média: seria número sem significado no eixo atual.
      if (value === null) continue;
      weightedSum += value * answer.count;
      respondents += answer.count;
      roleTotals[answer.respondent].sum += value * answer.count;
      roleTotals[answer.respondent].n += answer.count;
    }

    const byRole: CompanyCultureAxisProfile['byRole'] = {};
    for (const role of ['gestao', 'rh', 'equipe'] as CultureRespondent[]) {
      const entry = roleTotals[role];
      if (entry.n > 0) byRole[role] = entry.sum / entry.n;
    }

    const axisReading = reading.find(
      (entry) => entry.question.axisId === axis.id
    );
    const dispersion: CultureDispersion | null =
      axisReading?.state === 'divergente'
        ? 'divergente'
        : axisReading?.state === 'convergente'
          ? 'convergente'
          : null;

    return {
      axisId: axis.id,
      mean: respondents > 0 ? weightedSum / respondents : null,
      respondents,
      byRole,
      dispersion,
      ready: roleTotals.equipe.n >= MIN_TEAM_RESPONSES
    };
  });
}

/** Médias por eixo já filtradas pelo que fechou: o que a aderência consome. */
function toAdherenceProfile(
  profile: CompanyCultureAxisProfile[]
): CompanyAxisMeans {
  const means: CompanyAxisMeans = {};
  for (const axis of profile) {
    means[axis.axisId] = axis.ready ? axis.mean : null;
  }
  return means;
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

/** A resposta de fit desta candidatura, se houver. */
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
 */
export function getFitStatus(
  state: DemoState,
  application: Application
): FitStatus {
  if (getFitResponse(state, application.id)) return 'respondido';
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
export function getAdherence(
  state: DemoState,
  applicationId: string
): AdherenceResult | null {
  const application = getApplication(state, applicationId);
  if (!application) return null;

  const job = getJob(application.jobId);
  if (!job) return null;

  const profile = getCompanyCultureProfile(state, job.companyId);
  const response = getFitResponse(state, applicationId);

  return computeAdherence(
    toAdherenceProfile(profile),
    response?.answers ?? null,
    getAxisWeights(state, job)
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
        adherence: adherence ?? {
          byAxis: [],
          total: null,
          threshold: ADHERENCE_THRESHOLD,
          compatible: null,
          coverage: { answeredAxes: 0, totalAxes: FIT_AXES.length }
        },
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

/**
 * O convite como a tela do colaborador pode vê-lo (PRODUTO.md §5).
 *
 * É deliberadamente magro. Quem abre o link responde sobre o próprio ambiente
 * de trabalho: não precisa — e não pode — ver quem mais foi convidado, quem já
 * respondeu ou o que responderam. Nem o e-mail para o qual o convite foi
 * enviado volta daqui; o token não o carrega, e devolvê-lo transformaria um
 * link vazado em vazamento de dado pessoal.
 *
 * O primeiro nome fica porque a tela precisa cumprimentar quem chegou e
 * confirmar que o link é mesmo dela; o nome completo não acrescenta nada a
 * isso.
 */
export type CultureInviteView = {
  inviteId: string;
  firstName: string;
  companyName: string;
  expiresAt: string;
  daysLeft: number;
  status: CultureInviteStatus;
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
    firstName: invite.name.split(' ')[0] ?? invite.name,
    companyName: getCompany(invite.companyId)?.name ?? invite.companyId,
    expiresAt: invite.expiresAt,
    daysLeft: daysBetween(DEMO_REFERENCE_DATE, invite.expiresAt),
    status: readInviteStatus(invite, DEMO_REFERENCE_DATE)
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
