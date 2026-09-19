import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CRITERION_STATE_META,
  describeCoverage,
  getCoverage,
  getDimensionSummary,
  getRequiredAttentionPoints
} from '../analysis/criterion-states';
import { buildInitialDemoState, DEMO_SCHEMA_VERSION } from '../fixtures';
import type { DemoState } from '../types';
import { demoReducer } from './reducer';
import {
  getApplication,
  getClarificationsByJob,
  getCompany,
  getCoverageByDimension,
  getCriterion,
  getCriterionStateCounts,
  getEvidencesForCriterion,
  getJob,
  getJobSummary,
  getOverviewMetrics,
  getPersona,
  getRecentHistory,
  getStageDistribution,
  getTalent,
  getTeam,
  getTeamsByCompany,
  getVisibleCompanies,
  getVisibleJobs,
  getVisibleTalentIds
} from './selectors';
import {
  clearPersistedState,
  DEMO_STORAGE_KEY,
  nowIso,
  persistState,
  readPersistedState
} from './storage';

const AT = '2026-09-15T10:00:00.000Z';

function withPersona(state: DemoState, personaId: string): DemoState {
  return { ...state, personaId };
}

describe('resumo de vaga e motivo de ação', () => {
  it('prioriza respostas aguardando incorporação sobre solicitações abertas', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;

    const initialSummary = getJobSummary(state, job);
    expect(initialSummary.applicationsCount).toBe(
      state.applications.filter((application) => application.jobId === 'VAG-01')
        .length
    );
    expect(initialSummary.openClarificationsCount).toBe(1);
    expect(initialSummary.actionReason).toContain(
      '1 solicitação de esclarecimento sem resposta'
    );

    const answered = demoReducer(state, {
      type: 'answer-clarification',
      clarificationId: 'ESC-02',
      answer: 'Somente manhã.',
      declined: false,
      at: AT
    });

    expect(getJobSummary(answered, job).actionReason).toContain(
      '1 resposta aguardando incorporação'
    );
  });

  it('aponta candidaturas com critérios sem informação quando não há pendência', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-03')!;
    const summary = getJobSummary(state, job);

    expect(summary.openClarificationsCount).toBe(0);
    expect(summary.actionReason).toContain(
      '3 candidaturas com critérios sem informação'
    );
    expect(summary.company?.name).toBe('Oficina Pantanal');
  });
});

describe('indicadores e agregações da visão geral', () => {
  it('filtra indicadores por empresa', () => {
    const state = buildInitialDemoState();

    // O recorte por empresa é o que precisa bater exatamente: as empresas
    // curadas do roteiro não são afetadas pelo volume gerado em volta.
    expect(getOverviewMetrics(state, 'todas').openClarifications).toBe(2);
    expect(getOverviewMetrics(state, 'todas').referralsAwaitingReturn).toBe(0);
    expect(getOverviewMetrics(state, 'EMP-02')).toEqual({
      openJobs: 1,
      applicationsInAnalysis: 2,
      openClarifications: 1,
      referralsAwaitingReturn: 0
    });
  });

  it('distribui candidaturas pelas etapas oficiais com os registros de cada etapa', () => {
    const state = buildInitialDemoState();
    const stages = getStageDistribution(state, 'todas');
    const total = stages.reduce((sum, entry) => sum + entry.count, 0);

    expect(total).toBe(state.applications.length);
    expect(stages.map((entry) => entry.stage)).toEqual([
      'inscrito',
      'triagem',
      'analise-tecnica',
      'entrevista-empresa'
    ]);
    expect(stages.every((entry) => entry.count >= 0)).toBe(true);
    expect(
      stages.find((entry) => entry.stage === 'analise-tecnica')?.applicationIds
    ).toContain('CAND-01');
  });

  it('mede cobertura por dimensão com denominador explícito', () => {
    const state = buildInitialDemoState();
    const coverage = getCoverageByDimension(state, 'EMP-01');
    const technical = coverage.find((entry) => entry.dimension === 'tecnica')!;

    // Vaga 1: 2 critérios técnicos por candidatura da EMP-01.
    const emp01Applications = state.applications.filter(
      (application) => application.jobId === 'VAG-01'
    ).length;
    expect(technical.total).toBe(2 * emp01Applications);
    expect(technical.withInformation).toBeLessThanOrEqual(technical.total);
    expect(
      coverage.every((entry) => entry.withInformation <= entry.total)
    ).toBe(true);
  });

  it('conta estados de critério por vaga para leitura agregada', () => {
    const state = buildInitialDemoState();
    const counts = getCriterionStateCounts(state, 'VAG-01');
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

    const vag01Applications = state.applications.filter(
      (application) => application.jobId === 'VAG-01'
    ).length;
    expect(total).toBe(8 * vag01Applications); // 8 critérios × candidaturas
    expect(
      counts[CRITERION_STATE_META.divergencia.label]
    ).toBeGreaterThanOrEqual(1);
    expect(
      counts[CRITERION_STATE_META['sem-informacao'].label]
    ).toBeGreaterThanOrEqual(10);
  });

  it('ordena o histórico do mais recente para o mais antigo', () => {
    const state = demoReducer(buildInitialDemoState(), {
      type: 'add-internal-note',
      talentId: 'ANA',
      jobId: 'VAG-01',
      note: 'Nota recente.',
      at: '2026-09-16T09:00:00.000Z'
    });
    const history = getRecentHistory(state, 3);

    expect(history[0]?.action).toBe('Nota interna registrada');
    expect(history).toHaveLength(3);
  });
});

describe('estados por critério e cobertura', () => {
  it('descreve cobertura em texto legível', () => {
    const state = buildInitialDemoState();
    const coverage = getCoverage(getJob('VAG-02')!, state.analysis, 'CAND-07');

    expect(describeCoverage(coverage)).toBe(
      '2 de 6 critérios possuem dados suficientes'
    );
    expect(coverage.missing).toContain('Controle de materiais');
  });

  it('resume a dimensão pelo estado que exige mais atenção', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;

    const professional = getDimensionSummary(
      job,
      state.analysis,
      'CAND-04',
      'profissional'
    );
    expect(professional.headline).toBe('divergencia');
    expect(professional.counts.divergencia).toBe(1);

    const technical = getDimensionSummary(
      job,
      state.analysis,
      'CAND-02',
      'tecnica'
    );
    expect(technical.headline).toBe('alinhamento');
    expect(technical.criteria).toHaveLength(2);
  });

  it('lista requisitos obrigatórios que ainda não estão sustentados', () => {
    const state = buildInitialDemoState();
    const points = getRequiredAttentionPoints(
      getJob('VAG-01')!,
      state.analysis,
      'CAND-01'
    );

    expect(points.map((point) => point.criterion.id)).toEqual(['CRI-102']);
    expect(points[0]?.analysis.state).toBe('sem-informacao');
  });
});

describe('evidências vinculadas ao contexto', () => {
  it('filtra evidências do talento e da equipe da vaga', () => {
    const state = buildInitialDemoState();
    const anaVaga1 = getApplication(state, 'CAND-01')!;
    const brunoVaga1 = getApplication(state, 'CAND-02')!;

    const anaTechnical = getEvidencesForCriterion(state, anaVaga1, 'CRI-101');
    expect(anaTechnical.map((evidence) => evidence.id)).toEqual(['EVD-ANA-01']);

    // A mesma evidência de equipe aparece para candidaturas diferentes da vaga.
    const anaSupport = getEvidencesForCriterion(state, anaVaga1, 'CRI-106');
    const brunoSupport = getEvidencesForCriterion(state, brunoVaga1, 'CRI-106');
    expect(anaSupport.map((evidence) => evidence.id)).toContain('EVD-EQ01-01');
    expect(brunoSupport.map((evidence) => evidence.id)).toContain(
      'EVD-EQ01-01'
    );

    // Evidência de outra pessoa não vaza para a candidatura.
    expect(anaTechnical.some((evidence) => evidence.talentId === 'BRUNO')).toBe(
      false
    );
  });

  it('o mesmo perfil tem leitura diferente em cada vaga', () => {
    const state = buildInitialDemoState();
    const anaVaga2 = getApplication(state, 'CAND-05')!;

    expect(
      getEvidencesForCriterion(state, anaVaga2, 'CRI-205').map(
        (evidence) => evidence.id
      )
    ).toEqual(['EVD-ANA-03', 'EVD-EQ02-01']);
    expect(state.analysis['CAND-01']?.['CRI-106']?.state).toBe(
      'sem-informacao'
    );
    expect(state.analysis['CAND-05']?.['CRI-205']?.state).toBe('alinhamento');
  });
});

describe('recorte de dados por persona', () => {
  it('gestor vê apenas a própria empresa e vaga', () => {
    const state = withPersona(buildInitialDemoState(), 'gestor-emp-03');

    expect(getPersona(state).companyId).toBe('EMP-03');
    expect(getVisibleJobs(state).map((job) => job.id)).toEqual(['VAG-03']);
    expect(getVisibleCompanies(state).map((company) => company.id)).toEqual([
      'EMP-03'
    ]);
    expect(getVisibleTalentIds(state)).toEqual([]);
  });

  it('analista vê a base completa da demonstração', () => {
    const state = buildInitialDemoState();

    // O analista vê a base inteira; o gestor é quem tem recorte.
    expect(getVisibleJobs(state).length).toBeGreaterThan(3);
    expect(getVisibleCompanies(state).length).toBeGreaterThan(3);
    expect(getVisibleJobs(state).map((job) => job.id)).toContain('VAG-01');
    expect(getVisibleTalentIds(state)).toContain('ANA');
  });

  it('persona desconhecida cai no analista em vez de quebrar a tela', () => {
    const state = withPersona(buildInitialDemoState(), 'persona-inexistente');
    expect(getPersona(state).kind).toBe('analista');
  });
});

describe('acessos auxiliares do catálogo', () => {
  it('resolve empresa, vaga, talento, equipe e critério por id', () => {
    const state = buildInitialDemoState();

    expect(getCompany('EMP-01')?.name).toBe('Cerrado Distribuição');
    expect(getJob('VAG-02')?.title).toBe('Assistente de Estoque');
    expect(getTalent('HUGO')?.city).toBe('Campo Grande, MS');
    expect(getTeam(state, 'EQ-02')?.managerName).toBe('Rafael Nogueira');
    expect(getTeamsByCompany(state, 'EMP-01').map((team) => team.id)).toEqual([
      'EQ-01'
    ]);
    expect(getCriterion(getJob('VAG-01')!, 'CRI-103')?.label).toBe(
      'Disponibilidade no turno'
    );
    expect(
      getClarificationsByJob(state, 'VAG-02').map((item) => item.id)
    ).toEqual(['ESC-01']);
  });

  it('devolve nulo para identificadores inexistentes', () => {
    const state = buildInitialDemoState();

    expect(getCompany('EMP-99')).toBeNull();
    expect(getJob('VAG-99')).toBeNull();
    expect(getTalent('NINGUEM')).toBeNull();
    expect(getTeam(state, 'EQ-99')).toBeNull();
    expect(getApplication(state, 'CAND-99')).toBeNull();
    expect(getCriterionStateCounts(state, 'VAG-99')).toEqual({});
  });
});

describe('persistência local versionada', () => {
  const storage = new Map<string, string>();

  function stubWindow() {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key)
      },
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    });
  }

  afterEach(() => {
    storage.clear();
    vi.unstubAllGlobals();
  });

  it('não lê nada no servidor', () => {
    expect(readPersistedState()).toBeNull();
  });

  it('faz o ciclo salvar → ler → limpar', () => {
    stubWindow();
    const state = demoReducer(buildInitialDemoState(), {
      type: 'toggle-comparison',
      jobId: 'VAG-01',
      applicationId: 'CAND-01'
    });

    persistState(state);
    expect(readPersistedState()?.comparison['VAG-01']).toEqual(['CAND-01']);

    clearPersistedState();
    expect(readPersistedState()).toBeNull();
  });

  it('descarta estado de outra versão de schema', () => {
    stubWindow();
    storage.set(
      DEMO_STORAGE_KEY,
      JSON.stringify({ ...buildInitialDemoState(), schemaVersion: 0 })
    );

    expect(readPersistedState()).toBeNull();
    expect(storage.has(DEMO_STORAGE_KEY)).toBe(false);
    // Sobe a cada campo novo no estado persistido — aqui, as respostas do
    // questionário de fit do candidato. Estado gravado na versão anterior é
    // descartado em vez de remendado.
    expect(DEMO_SCHEMA_VERSION).toBe(4);
  });

  it('ignora conteúdo corrompido sem quebrar a demonstração', () => {
    stubWindow();
    storage.set(DEMO_STORAGE_KEY, '{nao-e-json');

    expect(readPersistedState()).toBeNull();
  });

  it('completa campos ausentes com a base inicial', () => {
    stubWindow();
    storage.set(
      DEMO_STORAGE_KEY,
      JSON.stringify({
        schemaVersion: DEMO_SCHEMA_VERSION,
        personaId: 'gestor-emp-01'
      })
    );

    const restored = readPersistedState()!;
    expect(restored.personaId).toBe('gestor-emp-01');
    expect(restored.applications).toHaveLength(
      buildInitialDemoState().applications.length
    );
    expect(restored.ui.jobsSearch).toBe('');
  });

  it('gera timestamps ISO para as ações locais', () => {
    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
