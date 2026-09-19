import {
  CRITERION_STATE_META,
  getCoverage,
  getCriterionAnalysis
} from '../analysis/criterion-states';
import {
  DEMO_ASSESSMENTS,
  DEMO_CATALOG,
  DEMO_COMPANIES,
  DEMO_JOBS,
  DEMO_PERSONAS,
  DEMO_TALENTS
} from '../fixtures';
import type {
  Application,
  Clarification,
  Company,
  CriterionRef,
  DemoState,
  Dimension,
  Evidence,
  ExternalAssessment,
  ExternalStage,
  Job,
  JobCriterion,
  Persona,
  Referral,
  Talent,
  Team
} from '../types';

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
  return DEMO_COMPANIES.find((company) => company.id === companyId) ?? null;
}

export function getJob(jobId: string): Job | null {
  return DEMO_JOBS.find((job) => job.id === jobId) ?? null;
}

export function getTalent(talentId: string): Talent | null {
  return DEMO_TALENTS.find((talent) => talent.id === talentId) ?? null;
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
  return DEMO_JOBS.filter((job) => job.companyId === companyId);
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
    actionReason = `${answered} resposta(s) aguardando incorporação na análise`;
  } else if (open > 0) {
    actionReason = `${open} solicitação(ões) de esclarecimento sem resposta`;
  } else if (missingInfo > 0) {
    actionReason = `${missingInfo} candidatura(s) com critérios sem informação`;
  } else if (readyToRefer > 0) {
    actionReason = `${readyToRefer} candidatura(s) prontas para encaminhar`;
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
  return DEMO_JOBS;
}

export function getVisibleCompanies(state: DemoState): Company[] {
  const persona = getPersona(state);
  if (persona.kind === 'gestor' && persona.companyId) {
    const company = getCompany(persona.companyId);
    return company ? [company] : [];
  }
  return DEMO_COMPANIES;
}

/** Talentos visíveis para a persona: gestor só vê quem foi compartilhado. */
export function getVisibleTalentIds(state: DemoState): string[] {
  const persona = getPersona(state);
  if (persona.kind !== 'gestor' || !persona.companyId) {
    return DEMO_TALENTS.map((talent) => talent.id);
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
