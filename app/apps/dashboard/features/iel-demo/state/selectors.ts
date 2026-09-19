import {
  CRITERION_STATE_META,
  getCoverage,
  getCriterionAnalysis,
  type CoverageSummary
} from '../analysis/criterion-states';
import { FIT_AXES, type FitAxis } from '../analysis/fit-axes';
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
  Clarification,
  Company,
  CriterionRef,
  CriterionState,
  DataSourceId,
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
  TalentPreference,
  Team,
  TeamCondition
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
  return ALL_COMPANIES.find((company) => company.id === companyId) ?? null;
}

export function getJob(jobId: string): Job | null {
  return ALL_JOBS.find((job) => job.id === jobId) ?? null;
}

export function getTalent(talentId: string): Talent | null {
  return ALL_TALENTS.find((talent) => talent.id === talentId) ?? null;
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
  | 'lacuna-obrigatoria'
  | 'divergencia'
  | 'a-esclarecer'
  | 'cobertura-completa';

export const CANDIDATE_FILTER_LABEL: Record<CandidateFilter, string> = {
  todas: 'Todas as candidaturas',
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

export type FitReadingEntry = {
  axis: FitAxis;
  /** O que a equipe informou neste eixo, se informou. */
  condition: TeamCondition | null;
  /** O que a pessoa declarou neste eixo, se declarou. */
  preference: TalentPreference | null;
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
  const talent = getTalent(talentId);

  return FIT_AXES.map((axis) => {
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
        state: 'sem-informacao' as CriterionState,
        missingSide: 'ambos' as const
      };
    }

    if (!preference) {
      return {
        axis,
        condition,
        preference,
        state: 'sem-informacao' as CriterionState,
        missingSide: 'candidato' as const
      };
    }

    if (!condition) {
      return {
        axis,
        condition,
        preference,
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
        state: 'divergencia' as CriterionState,
        missingSide: null
      };
    }

    return {
      axis,
      condition,
      preference,
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
