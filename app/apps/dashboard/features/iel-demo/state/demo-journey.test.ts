import { describe, expect, it } from 'vitest';

import { ADHERENCE_THRESHOLD, computeAdherence } from '../analysis/adherence';
import {
  assertCandidateQuestionnaireMirrorsCompany,
  CANDIDATE_CONSENT_VERSION
} from '../analysis/candidate-questionnaire';
import {
  getCoverage,
  getCriterionAnalysis
} from '../analysis/criterion-states';
import { getFitInsights } from '../analysis/fit-insights';
import {
  buildInitialDemoState,
  COMPARISON_LIMIT,
  DEMO_COMPANIES,
  DEMO_JOBS,
  DEMO_SYNC_EVENTS,
  DEMO_TALENTS,
  findClarificationTemplate
} from '../fixtures';
import type { DemoState, Job } from '../types';
import { applySyncEventPayload, demoReducer, type DemoAction } from './reducer';
import {
  getAdherence,
  getApplication,
  getAxisWeight,
  getAxisWeights,
  getCandidateJobView,
  getClarification,
  getCompanyCultureProfile,
  getCultureAttentionPoints,
  getCultureReading,
  getFitGaps,
  getFitReading,
  getFitResponse,
  getJob,
  getJobRanking,
  getOpenClarifications,
  getOverviewMetrics,
  getPendingAxisWeightSuggestion,
  getRescueCandidates,
  getReusedEvidences,
  getTalentJourney,
  getTalentTransparency,
  getVisibleTalentIds,
  getWeightLearning,
  REFERRAL_LIMIT,
  WEIGHT_LEARNING_MIN_OCCURRENCES
} from './selectors';

const AT = '2026-09-15T10:00:00.000Z';

function run(state: DemoState, ...actions: DemoAction[]): DemoState {
  return actions.reduce(demoReducer, state);
}

function askManagerAboutSupport(state: DemoState): DemoState {
  const template = findClarificationTemplate('VAG-01', 'CRI-106', 'gestor')!;
  return demoReducer(state, {
    type: 'create-clarification',
    at: AT,
    input: {
      jobId: 'VAG-01',
      applicationId: null,
      criterionId: 'CRI-106',
      recipient: {
        kind: 'gestor',
        name: 'Marina Duarte',
        role: 'Gestora da equipe — Assistente de Logística',
        email: 'marina.duarte@example.com',
        companyId: 'EMP-01',
        teamId: 'EQ-01',
        talentId: null
      },
      question: template.suggestedQuestion,
      sharedInfo: template.suggestedSharedInfo,
      reason: template.reason,
      preparedAnswer: template.preparedAnswer,
      effects: template.teamEffects ?? [],
      teamConditionUpdate: template.teamConditionUpdate ?? null
    }
  });
}

describe('base fictícia da Central IEL', () => {
  it('mantém o núcleo curado do roteiro intacto sob o volume gerado', () => {
    const state = buildInitialDemoState();
    const curated = state.applications.filter(
      (application) => !application.id.startsWith('GEN-')
    );
    const curatedTalents = new Set(
      curated.map((application) => application.talentId)
    );

    expect(DEMO_COMPANIES).toHaveLength(3);
    expect(DEMO_JOBS).toHaveLength(3);
    expect(DEMO_TALENTS).toHaveLength(8);
    expect(curated).toHaveLength(10);
    expect(curatedTalents.size).toBe(8);
  });

  it('gera volume em volta sem colidir com os identificadores curados', () => {
    const state = buildInitialDemoState();
    const generated = state.applications.filter((application) =>
      application.id.startsWith('GEN-')
    );

    // A escala é o ponto: o enunciado cobra volume, e a vaga do roteiro
    // precisa ter candidaturas demais para serem lidas uma a uma.
    expect(generated.length).toBeGreaterThan(400);
    expect(
      state.applications.filter((application) => application.jobId === 'VAG-01')
        .length
    ).toBeGreaterThan(50);

    const ids = new Set(
      state.applications.map((application) => application.id)
    );
    expect(ids.size).toBe(state.applications.length);
  });

  it('constrói a mesma base a cada chamada', () => {
    // Datas fixas e semente fixa: a demonstração não pode mudar entre telas
    // nem entre apresentações.
    expect(JSON.stringify(buildInitialDemoState())).toBe(
      JSON.stringify(buildInitialDemoState())
    );
  });

  it('mantém uma pessoa com duas candidaturas como um único talento', () => {
    const state = buildInitialDemoState();
    const anaApplications = state.applications.filter(
      (application) => application.talentId === 'ANA'
    );
    const carlaApplications = state.applications.filter(
      (application) => application.talentId === 'CARLA'
    );

    expect(anaApplications.map((application) => application.jobId)).toEqual([
      'VAG-01',
      'VAG-02'
    ]);
    expect(carlaApplications).toHaveLength(2);
    expect(DEMO_TALENTS.filter((talent) => talent.id === 'ANA')).toHaveLength(
      1
    );
  });

  it('abre com duas solicitações de esclarecimento pendentes', () => {
    const state = buildInitialDemoState();
    expect(getOpenClarifications(state).map((item) => item.id)).toEqual([
      'ESC-01',
      'ESC-02'
    ]);
  });

  it('calcula cobertura informacional de Ana na vaga 1 como 6 de 8', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const coverage = getCoverage(job, state.analysis, 'CAND-01');

    expect(coverage.total).toBe(8);
    expect(coverage.withInformation).toBe(6);
    expect(coverage.missing).toEqual(['Registro em planilha', 'Apoio inicial']);
  });
});

describe('seleção para comparação', () => {
  it('permite adicionar e remover respeitando o limite visível', () => {
    let state = buildInitialDemoState();
    state = run(
      state,
      { type: 'toggle-comparison', jobId: 'VAG-01', applicationId: 'CAND-01' },
      { type: 'toggle-comparison', jobId: 'VAG-01', applicationId: 'CAND-02' },
      { type: 'toggle-comparison', jobId: 'VAG-01', applicationId: 'CAND-03' },
      { type: 'toggle-comparison', jobId: 'VAG-01', applicationId: 'CAND-04' }
    );

    expect(state.comparison['VAG-01']).toHaveLength(COMPARISON_LIMIT);
    expect(state.comparison['VAG-01']).not.toContain('CAND-04');

    state = run(state, {
      type: 'toggle-comparison',
      jobId: 'VAG-01',
      applicationId: 'CAND-03'
    });
    expect(state.comparison['VAG-01']).toEqual(['CAND-01', 'CAND-02']);
  });

  it('separa a seleção de comparação da lista de encaminhamento', () => {
    let state = buildInitialDemoState();
    state = run(
      state,
      { type: 'toggle-comparison', jobId: 'VAG-01', applicationId: 'CAND-01' },
      {
        type: 'add-to-referral-list',
        jobId: 'VAG-01',
        applicationId: 'CAND-02',
        at: AT
      },
      {
        type: 'add-to-referral-list',
        jobId: 'VAG-01',
        applicationId: 'CAND-02',
        at: AT
      }
    );

    expect(state.comparison['VAG-01']).toEqual(['CAND-01']);
    expect(state.referralList['VAG-01']).toEqual(['CAND-02']);
    expect(getApplication(state, 'CAND-02')?.referralStage).toBe('na-lista');
  });
});

describe('jornada de esclarecimento (cena 4)', () => {
  it('cria a pergunta, registra a resposta e atualiza só os critérios afetados', () => {
    let state = askManagerAboutSupport(buildInitialDemoState());
    const created = state.clarifications.at(-1)!;

    expect(created.id).toBe('ESC-03');
    expect(created.state).toBe('solicitada');
    expect(created.effects).toHaveLength(4);

    state = demoReducer(state, {
      type: 'answer-clarification',
      clarificationId: created.id,
      answer: created.preparedAnswer!,
      declined: false,
      at: AT
    });
    expect(getClarification(state, created.id)?.state).toBe('respondida');

    const before = {
      anaTecnica: getCriterionAnalysis(state.analysis, 'CAND-01', 'CRI-101'),
      anaDisponibilidade: getCriterionAnalysis(
        state.analysis,
        'CAND-01',
        'CRI-103'
      )
    };

    state = demoReducer(state, {
      type: 'incorporate-clarification',
      clarificationId: created.id,
      at: AT,
      decisions: created.effects.map((effect) => ({
        applicationId: effect.applicationId,
        criterionId: effect.criterionId,
        state: effect.suggestedState,
        note: effect.note
      }))
    });

    // Ana passa a divergir da condição informada, sem ser rejeitada.
    expect(
      getCriterionAnalysis(state.analysis, 'CAND-01', 'CRI-106').state
    ).toBe('divergencia');
    expect(getApplication(state, 'CAND-01')).not.toBeNull();
    expect(getApplication(state, 'CAND-01')?.referralStage).toBe(
      'nao-encaminhada'
    );

    // Bruno fica alinhado; Carla e Diego seguem a esclarecer.
    expect(
      getCriterionAnalysis(state.analysis, 'CAND-02', 'CRI-106').state
    ).toBe('alinhamento');
    expect(
      getCriterionAnalysis(state.analysis, 'CAND-03', 'CRI-106').state
    ).toBe('a-esclarecer');

    // Critérios não relacionados permanecem intactos.
    expect(getCriterionAnalysis(state.analysis, 'CAND-01', 'CRI-101')).toEqual(
      before.anaTecnica
    );
    expect(getCriterionAnalysis(state.analysis, 'CAND-01', 'CRI-103')).toEqual(
      before.anaDisponibilidade
    );

    // A condição da equipe passa a constar como confirmada pelo gestor.
    const condition = state.teams
      .find((team) => team.id === 'EQ-01')!
      .conditions.find((entry) => entry.id === 'COND-01')!;
    expect(condition.status).toBe('confirmado');

    // A evidência da resposta entra na base e o histórico guarda a transição.
    const answerEvidence = state.evidences.find((evidence) =>
      evidence.id.startsWith('EVD-RESP')
    );
    expect(answerEvidence?.nature).toBe('resposta-de-esclarecimento');
    expect(state.history[0]?.description).toContain(
      'CAND-01/CRI-106: sem-informacao → divergencia'
    );
    expect(getClarification(state, created.id)?.state).toBe('incorporada');
  });

  it('mantém a lacuna quando a pessoa responde que não sabe', () => {
    let state = askManagerAboutSupport(buildInitialDemoState());
    const created = state.clarifications.at(-1)!;

    state = demoReducer(state, {
      type: 'answer-clarification',
      clarificationId: created.id,
      answer: '',
      declined: true,
      at: AT
    });

    const answered = getClarification(state, created.id)!;
    expect(answered.effects).toHaveLength(0);
    expect(answered.answer).toContain('não sabe');

    state = demoReducer(state, {
      type: 'incorporate-clarification',
      clarificationId: created.id,
      at: AT,
      decisions: []
    });

    expect(
      getCriterionAnalysis(state.analysis, 'CAND-01', 'CRI-106').state
    ).toBe('sem-informacao');
  });

  it('cancelar uma solicitação não altera a análise', () => {
    const initial = buildInitialDemoState();
    const state = demoReducer(initial, {
      type: 'cancel-clarification',
      clarificationId: 'ESC-01',
      at: AT
    });

    expect(getClarification(state, 'ESC-01')?.state).toBe('cancelada');
    expect(state.analysis).toEqual(initial.analysis);
  });
});

describe('reaproveitamento do perfil na vaga 2 (cenas 5 e 6)', () => {
  function answerAndIncorporateAvailability(state: DemoState): DemoState {
    const clarification = getClarification(state, 'ESC-01')!;
    const answered = demoReducer(state, {
      type: 'answer-clarification',
      clarificationId: clarification.id,
      answer: clarification.preparedAnswer!,
      declined: false,
      at: AT
    });
    return demoReducer(answered, {
      type: 'incorporate-clarification',
      clarificationId: clarification.id,
      at: AT,
      decisions: clarification.effects.map((effect) => ({
        applicationId: effect.applicationId,
        criterionId: effect.criterionId,
        state: effect.suggestedState,
        note: effect.note
      }))
    });
  }

  it('esclarece a disponibilidade de Ana e completa a cobertura da vaga 2', () => {
    const initial = buildInitialDemoState();
    expect(
      getCriterionAnalysis(initial.analysis, 'CAND-05', 'CRI-203').state
    ).toBe('a-esclarecer');

    const state = answerAndIncorporateAvailability(initial);

    expect(
      getCriterionAnalysis(state.analysis, 'CAND-05', 'CRI-203').state
    ).toBe('alinhamento');
    // O mesmo perfil na vaga 1 não foi afetado.
    expect(
      getCriterionAnalysis(state.analysis, 'CAND-01', 'CRI-103').state
    ).toBe('alinhamento');
  });

  it('registra o encaminhamento, o retorno do gestor e o histórico', () => {
    let state = answerAndIncorporateAvailability(buildInitialDemoState());

    state = run(state, {
      type: 'add-to-referral-list',
      jobId: 'VAG-02',
      applicationId: 'CAND-05',
      at: AT
    });

    state = demoReducer(state, {
      type: 'register-referral',
      at: AT,
      input: {
        jobId: 'VAG-02',
        companyId: 'EMP-02',
        message: 'Encaminhamento de 1 perfil.',
        items: [
          {
            applicationId: 'CAND-05',
            justification:
              'Evidências de controle de materiais e interesse em estoque.',
            sharedEvidenceIds: ['EVD-ANA-01'],
            summary: 'Ana Ribeiro — apoio a comércio e conferência de pedidos.',
            attentionPoints: [],
            suggestedQuestions: []
          }
        ]
      }
    });

    const referral = state.referrals[0]!;
    expect(state.referrals).toHaveLength(1);
    expect(referral.state).toBe('registrado');
    expect(state.referralList['VAG-02']).toBeUndefined();
    expect(getApplication(state, 'CAND-05')?.referralStage).toBe('encaminhada');
    expect(getApplication(state, 'CAND-05')?.analysisStage).toBe(
      'pronta-para-encaminhar'
    );

    // Registrar outra vez não duplica a candidatura já compartilhada.
    state = demoReducer(state, {
      type: 'register-referral',
      at: AT,
      input: {
        jobId: 'VAG-02',
        companyId: 'EMP-02',
        message: 'Reenvio.',
        items: [
          {
            applicationId: 'CAND-05',
            justification: 'Mesma candidatura.',
            sharedEvidenceIds: ['EVD-ANA-01'],
            summary: 'Ana Ribeiro',
            attentionPoints: [],
            suggestedQuestions: []
          }
        ]
      }
    });
    expect(state.referrals).toHaveLength(1);
    expect(state.referrals[0]?.items).toHaveLength(1);

    // O gestor da empresa B vê apenas o perfil compartilhado.
    const managerState: DemoState = { ...state, personaId: 'gestor-emp-02' };
    expect(getVisibleTalentIds(managerState)).toEqual(['ANA']);
    expect(
      getVisibleTalentIds({ ...state, personaId: 'gestor-emp-01' })
    ).toEqual([]);

    state = demoReducer(state, {
      type: 'manager-decision',
      referralId: referral.id,
      applicationId: 'CAND-05',
      decision: 'quero-entrevistar',
      note: 'Quero conversar sobre a rotina de estoque.',
      at: AT
    });

    expect(getApplication(state, 'CAND-05')?.referralStage).toBe(
      'interesse-em-entrevista'
    );
    expect(getApplication(state, 'CAND-05')?.externalStage).toBe(
      'entrevista-empresa'
    );
    expect(state.history[0]?.action).toBe('Interesse em entrevista registrado');
    expect(state.history[0]?.description).toContain(
      'Nenhuma reunião foi agendada'
    );
  });

  it('a empresa pode pedir esclarecimento sem encerrar a candidatura', () => {
    let state = answerAndIncorporateAvailability(buildInitialDemoState());
    state = run(state, {
      type: 'add-to-referral-list',
      jobId: 'VAG-02',
      applicationId: 'CAND-05',
      at: AT
    });
    state = demoReducer(state, {
      type: 'register-referral',
      at: AT,
      input: {
        jobId: 'VAG-02',
        companyId: 'EMP-02',
        message: 'Encaminhamento de 1 perfil.',
        items: [
          {
            applicationId: 'CAND-05',
            justification: 'Evidências registradas.',
            sharedEvidenceIds: ['EVD-ANA-01'],
            summary: 'Ana Ribeiro',
            attentionPoints: [],
            suggestedQuestions: []
          }
        ]
      }
    });

    const referralId = state.referrals[0]!.id;
    state = demoReducer(state, {
      type: 'manager-clarification-request',
      referralId,
      applicationId: 'CAND-05',
      question: 'Ela já usou sistema de estoque?',
      at: AT
    });

    const item = state.referrals[0]!.items[0]!;
    expect(item.managerDecision).toBe('pendente');
    expect(item.managerNote).toContain('Ela já usou sistema de estoque?');
    expect(getApplication(state, 'CAND-05')?.referralStage).toBe('encaminhada');
    expect(state.history[0]?.action).toBe('Esclarecimento pedido pela empresa');
  });
});

describe('indicadores, integração e reset', () => {
  it('indicadores acompanham o estado em vez de números decorativos', () => {
    const initial = buildInitialDemoState();
    const before = getOverviewMetrics(initial, 'todas');
    expect(before.openClarifications).toBe(2);
    expect(before.referralsAwaitingReturn).toBe(0);

    const afterCancel = demoReducer(initial, {
      type: 'cancel-clarification',
      clarificationId: 'ESC-02',
      at: AT
    });
    expect(getOverviewMetrics(afterCancel, 'todas').openClarifications).toBe(1);
  });

  it('repetir o mesmo recebimento simulado não duplica registros', () => {
    const initial = buildInitialDemoState();
    const event = DEMO_SYNC_EVENTS[0]!;

    const once = applySyncEventPayload(initial, event, AT);
    const beforeRepeat = once.applications.length;
    expect(getApplication(once, 'CAND-07')?.externalStage).toBe('triagem');
    expect(once.appliedSyncEventIds).toEqual([event.id]);

    const twice = applySyncEventPayload(once, event, AT);
    expect(twice.applications).toHaveLength(beforeRepeat);
    expect(twice.appliedSyncEventIds).toEqual([event.id]);
    expect(twice.history[0]?.action).toBe(
      'Atualização recebida (sem mudanças)'
    );
    expect(
      new Set(
        twice.applications
          .filter((application) => !application.id.startsWith('GEN-'))
          .map((application) => application.talentId)
      ).size
    ).toBe(8);
  });

  it('falha de fonte preserva os dados anteriores', () => {
    const initial = buildInitialDemoState();
    const state = demoReducer(initial, {
      type: 'set-source-status',
      sourceId: 'FONTE-EMPREGARE',
      status: 'indisponivel',
      error: 'Falha simulada.',
      at: AT
    });

    expect(state.applications).toEqual(initial.applications);
    expect(
      state.dataSources.find((source) => source.id === 'FONTE-EMPREGARE')
        ?.status
    ).toBe('indisponivel');
  });

  it('reiniciar a demonstração restaura a base inicial', () => {
    let state = buildInitialDemoState();
    state = run(
      state,
      { type: 'toggle-comparison', jobId: 'VAG-01', applicationId: 'CAND-01' },
      {
        type: 'add-internal-note',
        talentId: 'ANA',
        jobId: 'VAG-01',
        note: 'Nota interna de teste.',
        at: AT
      }
    );
    expect(
      state.evidences.some((evidence) => evidence.visibility === 'interno')
    ).toBe(true);

    const reset = demoReducer(state, { type: 'reset' });
    expect(reset).toEqual(buildInitialDemoState());
  });

  it('nota interna nunca é compartilhável', () => {
    const state = demoReducer(buildInitialDemoState(), {
      type: 'add-internal-note',
      talentId: 'ANA',
      jobId: 'VAG-01',
      note: 'Combinar retorno antes do encaminhamento.',
      at: AT
    });

    const note = state.evidences.at(-1)!;
    expect(note.visibility).toBe('interno');
    expect(note.links).toEqual([]);
  });
});

describe('trajetória entre processos', () => {
  it('reúne as candidaturas da pessoa em ordem, da mais recente para a mais antiga', () => {
    const state = buildInitialDemoState();
    const journey = getTalentJourney(state, 'ANA');

    // Ana participa de dois processos: é o caso que mostra a mesma pessoa
    // lida em contextos diferentes.
    expect(journey).toHaveLength(2);
    expect(journey.map((entry) => entry.application.jobId)).toEqual([
      'VAG-01',
      'VAG-02'
    ]);
    expect(
      journey[0]!.application.appliedAt >= journey[1]!.application.appliedAt
    ).toBe(true);
    expect(journey.every((entry) => entry.outcome === 'em-analise')).toBe(true);
  });

  it('registra o desfecho e a justificativa que a empresa devolveu', () => {
    let state = buildInitialDemoState();

    state = demoReducer(state, {
      type: 'register-referral',
      at: AT,
      input: {
        jobId: 'VAG-02',
        companyId: 'EMP-02',
        message: 'Encaminhamento de 1 perfil.',
        items: [
          {
            applicationId: 'CAND-05',
            justification: 'Experiência relacionada e interesse declarado.',
            sharedEvidenceIds: ['EVD-ANA-01'],
            summary: 'Ana Ribeiro.',
            attentionPoints: [],
            suggestedQuestions: []
          }
        ]
      }
    });

    expect(
      getTalentJourney(state, 'ANA').find(
        (entry) => entry.application.jobId === 'VAG-02'
      )?.outcome
    ).toBe('encaminhada');

    state = demoReducer(state, {
      type: 'manager-decision',
      referralId: state.referrals[0]!.id,
      applicationId: 'CAND-05',
      decision: 'nao-avancar',
      note: 'Buscamos alguém que já execute a rotina sem acompanhamento.',
      at: AT
    });

    const entry = getTalentJourney(state, 'ANA').find(
      (item) => item.application.jobId === 'VAG-02'
    )!;

    // O resultado do processo fica registrado com o motivo: é o que permite
    // que a próxima conexão aprenda com esta.
    expect(entry.outcome).toBe('nao-avancou');
    expect(entry.managerNote).toContain('sem acompanhamento');
    expect(entry.decidedAt).toBe(AT);

    // A outra candidatura da mesma pessoa não é afetada.
    expect(
      getTalentJourney(state, 'ANA').find(
        (item) => item.application.jobId === 'VAG-01'
      )?.outcome
    ).toBe('em-analise');
  });

  it('aponta os registros que serviram a mais de um processo da pessoa', () => {
    const state = buildInitialDemoState();
    const reused = getReusedEvidences(state, 'ANA');

    expect(reused.length).toBeGreaterThan(0);
    for (const entry of reused) {
      expect(entry.jobs.length).toBeGreaterThan(1);
    }

    // O registro do currículo sustenta critérios das duas vagas: a informação
    // foi coletada uma vez e não precisou ser pedida de novo.
    const curriculum = reused.find(
      (entry) => entry.evidence.id === 'EVD-ANA-01'
    );
    expect(curriculum?.jobs.map((job) => job.id).sort()).toEqual([
      'VAG-01',
      'VAG-02'
    ]);
  });

  it('não inventa reaproveitamento para quem tem um processo só', () => {
    const state = buildInitialDemoState();
    expect(getReusedEvidences(state, 'BRUNO')).toHaveLength(0);
  });
});

describe('aderência ao contexto, eixo a eixo', () => {
  it('não inventa conflito quando um dos lados está vazio', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const reading = getFitReading(state, job, 'ANA');

    const apoio = reading.find((entry) => entry.axis.id === 'apoio-inicial')!;

    // A empresa ainda não informou o apoio inicial. Ana declarou esperar
    // orientação. Um lado vazio não diverge do outro: é lacuna.
    expect(apoio.preference?.value).toContain('orientação');
    expect(apoio.condition).toBeNull();
    expect(apoio.missingSide).toBe('empresa');
    expect(apoio.state).toBe('sem-informacao');
  });

  it('a resposta do gestor transforma a lacuna em divergência', () => {
    let state = buildInitialDemoState();

    // A pergunta ao gestor sobre apoio inicial é criada durante a jornada
    // (cena 4), e a condição da equipe só fica informada quando a resposta é
    // incorporada.
    state = askManagerAboutSupport(state);
    const created = state.clarifications.at(-1)!;

    state = demoReducer(state, {
      type: 'answer-clarification',
      clarificationId: created.id,
      answer: created.preparedAnswer ?? 'Resposta preparada do cenário.',
      declined: false,
      at: AT
    });
    state = demoReducer(state, {
      type: 'incorporate-clarification',
      clarificationId: created.id,
      at: AT,
      decisions: created.effects.map((effect) => ({
        applicationId: effect.applicationId,
        criterionId: effect.criterionId,
        state: effect.suggestedState,
        note: effect.note
      }))
    });

    const apoio = getFitReading(state, getJob('VAG-01')!, 'ANA').find(
      (entry) => entry.axis.id === 'apoio-inicial'
    )!;

    // Agora os dois lados informaram, e eles não coincidem. É a cena que o
    // briefing descreve: o critério deixa de ser desconhecido e passa a
    // mostrar uma diferença real, sem eliminar a candidatura.
    expect(apoio.condition?.informed).toBe(true);
    expect(apoio.missingSide).toBeNull();
    expect(apoio.state).toBe('divergencia');
  });

  it('aponta os eixos em que falta o lado da pessoa', () => {
    const state = buildInitialDemoState();
    const gaps = getFitGaps(state, getJob('VAG-01')!, 'ANA');

    // Ana não declarou nada sobre autonomia nem sobre comunicação de
    // prioridades: é o que uma coleta dirigida iria buscar.
    expect(gaps.map((entry) => entry.axis.id).sort()).toEqual([
      'autonomia',
      'comunicacao-prioridades'
    ]);
    expect(gaps.every((entry) => entry.preference === null)).toBe(true);
  });
});

describe('traçado cultural da empresa', () => {
  it('mostra a divergência entre gestão e equipe em vez de escolher uma versão', () => {
    const state = buildInitialDemoState();
    const apoio = getCultureReading(state, 'EMP-01').find(
      (entry) => entry.question.axisId === 'apoio-inicial'
    )!;

    // A gestão responde que há troca informal; a equipe, em maioria, responde
    // que cada um assume por conta. Uma fonte única esconderia isso.
    const gestao = apoio.voices.find((voice) => voice.respondent === 'gestao')!;
    const equipe = apoio.voices.find((voice) => voice.respondent === 'equipe')!;

    expect(gestao.optionId).toBe('troca-informal');
    expect(equipe.optionId).toBe('por-conta');
    expect(apoio.state).toBe('divergente');

    // As duas versões continuam visíveis: nada é reduzido a um valor só.
    expect(apoio.voices).toHaveLength(2);
    expect(equipe.total).toBe(7);
  });

  it('não trata poucas respostas como se fossem a equipe', () => {
    const state = buildInitialDemoState();
    const autonomia = getCultureReading(state, 'EMP-03').find(
      (entry) => entry.question.axisId === 'autonomia'
    )!;

    // Duas respostas não sustentam uma leitura sobre o conjunto.
    expect(autonomia.state).toBe('consulta-insuficiente');
  });

  it('marca como convergente quando gestão, RH e equipe coincidem', () => {
    const state = buildInitialDemoState();
    const apoio = getCultureReading(state, 'EMP-02').find(
      (entry) => entry.question.axisId === 'apoio-inicial'
    )!;

    expect(apoio.voices.map((voice) => voice.respondent).sort()).toEqual([
      'equipe',
      'gestao',
      'rh'
    ]);
    expect(apoio.state).toBe('convergente');
  });

  it('a proposta da análise não vale como resposta até ser confirmada', () => {
    let state = buildInitialDemoState();
    const axis = 'ritmo-turno';

    const before = getCultureReading(state, 'EMP-01').find(
      (entry) => entry.question.axisId === axis
    )!;

    // Existe proposta montada a partir da descrição da vaga, mas o eixo
    // continua sem resposta: supervisão humana é exigência do enunciado.
    expect(before.pendingSuggestion?.optionId).toBe('fixo');
    expect(before.pendingSuggestion?.excerpt).toContain('Turno da tarde');
    expect(before.state).toBe('sem-resposta');
    expect(before.voices).toHaveLength(0);

    state = demoReducer(state, {
      type: 'answer-culture',
      companyId: 'EMP-01',
      axisId: axis,
      optionId: 'variacao-prevista',
      at: AT
    });

    const after = getCultureReading(state, 'EMP-01').find(
      (entry) => entry.question.axisId === axis
    )!;

    // A empresa corrigiu a proposta: vale a resposta humana, não a sugestão.
    expect(after.voices[0]?.respondent).toBe('gestao');
    expect(after.voices[0]?.optionId).toBe('variacao-prevista');
    expect(after.pendingSuggestion).toBeNull();
    expect(state.history[0]?.action).toBe('Traçado cultural respondido');
  });

  it('aponta os eixos cuja leitura não se sustenta sozinha', () => {
    const state = buildInitialDemoState();
    const attention = getCultureAttentionPoints(state, 'EMP-01');

    expect(attention.map((entry) => entry.question.axisId)).toContain(
      'apoio-inicial'
    );
  });
});

describe('devolutiva ao candidato', () => {
  it('mostra procedência dos registros e esconde avaliação interna', () => {
    const state = buildInitialDemoState();
    const view = getTalentTransparency(state, 'ANA');

    expect(view.records.length).toBeGreaterThan(0);
    expect(
      view.records.every(
        (record) => record.visibility === 'compartilhavel' && record.originLabel
      )
    ).toBe(true);

    // O briefing determina que o candidato não veja avaliações internas.
    // A existência delas é contada, o conteúdo não sai.
    expect(view.records.some((record) => record.visibility === 'interno')).toBe(
      false
    );

    // O traçado declarado por ela também é dela para consultar.
    expect(view.preferences.length).toBeGreaterThan(0);
  });

  it('só lista empresas depois que um encaminhamento é registrado', () => {
    let state = buildInitialDemoState();
    expect(getTalentTransparency(state, 'ANA').sharedWith).toHaveLength(0);

    state = demoReducer(state, {
      type: 'register-referral',
      at: AT,
      input: {
        jobId: 'VAG-02',
        companyId: 'EMP-02',
        message: 'Encaminhamento de 1 perfil.',
        items: [
          {
            applicationId: 'CAND-05',
            justification: 'Experiência relacionada.',
            sharedEvidenceIds: ['EVD-ANA-01', 'EVD-ANA-02'],
            summary: 'Ana Ribeiro.',
            attentionPoints: [],
            suggestedQuestions: []
          }
        ]
      }
    });

    const shared = getTalentTransparency(state, 'ANA').sharedWith;
    expect(shared).toHaveLength(1);
    expect(shared[0]?.recordCount).toBe(2);

    // R5 (00:22:21, 00:38:43): o nome da empresa não aparece para o candidato
    // antes da entrevista. Ele vê atividade, localidade e segmento.
    expect(JSON.stringify(shared)).not.toContain('Horizonte Alimentos');
    expect(shared[0]?.jobView?.sector).toBe('Indústria de alimentos');
    expect(shared[0]?.jobView?.location).toBeTruthy();
  });

  it('não vaza dados de outra pessoa', () => {
    const state = buildInitialDemoState();
    const view = getTalentTransparency(state, 'ANA');

    expect(view.records.every((record) => record.talentId === 'ANA')).toBe(
      true
    );
  });
});

describe('peso dos eixos declarado pela empresa', () => {
  it('trata eixo sem peso declarado como médio, e não como irrelevante', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;

    // Nenhuma vaga gerada precisa declarar os cinco eixos, e a base curada
    // pode deixar um de fora. Silêncio da empresa não é prioridade baixa: é
    // ausência de decisão, e o padrão precisa refletir isso.
    const semDeclaracao: Job = { ...job, axisWeights: {} };
    expect(getAxisWeight(semDeclaracao, 'apoio-inicial')).toBe('medio');
    expect(getAxisWeight(semDeclaracao, 'aprendizado', state)).toBe('medio');
  });

  it('carrega os pesos curados da vaga 1, onde a história acontece', () => {
    const job = getJob('VAG-01')!;

    // É nestes dois eixos que a expectativa de Ana não encontra a condição da
    // equipe. Declará-los prioritários é o que faz a leitura mostrar a
    // diferença em vez de diluí-la entre cinco eixos equivalentes.
    expect(getAxisWeight(job, 'apoio-inicial')).toBe('alto');
    expect(getAxisWeight(job, 'autonomia')).toBe('alto');
    expect(getAxisWeight(job, 'aprendizado')).toBe('baixo');

    // A proposta assistida nasce pendente e cita um trecho real do texto da
    // vaga: confirmar no escuro não seria supervisão humana.
    const state = buildInitialDemoState();
    const pendente = getPendingAxisWeightSuggestion(
      state,
      job,
      'apoio-inicial'
    )!;
    expect(pendente.weight).toBe('alto');
    expect(job.organizationalContext).toContain(pendente.excerpt);
  });

  it('grava o peso definido pela empresa, registra no histórico e encerra a proposta', () => {
    let state = buildInitialDemoState();
    const job = getJob('VAG-01')!;

    expect(
      getPendingAxisWeightSuggestion(state, job, 'apoio-inicial')
    ).not.toBeNull();

    state = demoReducer(state, {
      type: 'set-axis-weight',
      jobId: 'VAG-01',
      axisId: 'apoio-inicial',
      weight: 'medio',
      at: AT
    });

    // A correção da empresa vence a fixture: é a decisão mais recente, e tem
    // autor e hora.
    expect(getAxisWeight(job, 'apoio-inicial', state)).toBe('medio');
    expect(state.history[0]!.action).toBe('Peso do eixo definido pela empresa');
    expect(state.history[0]!.entityRef).toBe('VAG-01');

    // Respondido o eixo, a proposta deixa de ser pendente — mesmo contrato do
    // traçado cultural.
    expect(
      getPendingAxisWeightSuggestion(state, job, 'apoio-inicial')
    ).toBeNull();

    // Os demais eixos e as demais vagas não são afetados.
    expect(getAxisWeight(job, 'autonomia', state)).toBe('alto');
    expect(getAxisWeight(getJob('VAG-02')!, 'aprendizado', state)).toBe('alto');
  });

  it('leva o peso para dentro da leitura de aderência sem mudar o resto dela', () => {
    const state = buildInitialDemoState();
    const reading = getFitReading(state, getJob('VAG-01')!, 'ANA');

    const apoio = reading.find((entry) => entry.axis.id === 'apoio-inicial')!;
    expect(apoio.weight).toBe('alto');
    // O peso ordena a atenção; não altera o estado lido no eixo.
    expect(apoio.state).toBe('sem-informacao');
  });
});

describe('leitura assistida dos eixos', () => {
  it('põe a divergência em eixo prioritário antes de qualquer aderência', () => {
    let state = buildInitialDemoState();

    // A divergência de Ana em apoio inicial só existe depois que o gestor
    // responde: antes disso o lado da empresa está vazio.
    state = askManagerAboutSupport(state);
    const created = state.clarifications.at(-1)!;
    state = run(
      state,
      {
        type: 'answer-clarification',
        clarificationId: created.id,
        answer: created.preparedAnswer ?? 'Resposta preparada do cenário.',
        declined: false,
        at: AT
      },
      {
        type: 'incorporate-clarification',
        clarificationId: created.id,
        at: AT,
        decisions: created.effects.map((effect) => ({
          applicationId: effect.applicationId,
          criterionId: effect.criterionId,
          state: effect.suggestedState,
          note: effect.note
        }))
      }
    );

    const job = getJob('VAG-01')!;
    const insights = getFitInsights(
      getFitReading(state, job, 'ANA'),
      getAxisWeights(state, job)
    );

    const atencao = insights.findIndex(
      (insight) => insight.axisId === 'apoio-inicial'
    );
    expect(insights[atencao]!.kind).toBe('atencao');
    // O texto descreve o encontro dos dois lados, nunca a pessoa.
    expect(insights[atencao]!.title).toContain('não coincidem');

    const forte = insights.findIndex((insight) => insight.kind === 'forte');
    if (forte >= 0) expect(atencao).toBeLessThan(forte);

    // Nenhuma leitura vira lista infinita: no máximo cinco itens.
    expect(insights.length).toBeLessThanOrEqual(5);
  });

  it('aponta como lacuna o eixo prioritário em que falta o lado da pessoa', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;

    // Ana não declarou nada sobre autonomia, e a vaga marcou esse eixo como
    // prioritário: é exatamente o que uma coleta dirigida resolveria.
    const insights = getFitInsights(
      getFitReading(state, job, 'ANA'),
      getAxisWeights(state, job)
    );

    const lacuna = insights.find((insight) => insight.axisId === 'autonomia')!;
    expect(lacuna.kind).toBe('lacuna');
    expect(lacuna.detail).toContain('coleta dirigida');

    // Comunicação de prioridades também falta do lado da pessoa, mas a vaga
    // dá peso médio a esse eixo: não vira alarme.
    expect(
      insights.some((insight) => insight.axisId === 'comunicacao-prioridades')
    ).toBe(false);
  });
});

describe('aprendizado dos processos sobre o peso dos eixos', () => {
  /** Leva Ana ao desfecho "não avançar" na vaga 1, com divergência em apoio. */
  function declineAnaOnJobOne(initial: DemoState): DemoState {
    let state = askManagerAboutSupport(initial);
    const created = state.clarifications.at(-1)!;
    state = run(
      state,
      {
        type: 'answer-clarification',
        clarificationId: created.id,
        answer: created.preparedAnswer ?? 'Resposta preparada do cenário.',
        declined: false,
        at: AT
      },
      {
        type: 'incorporate-clarification',
        clarificationId: created.id,
        at: AT,
        decisions: created.effects.map((effect) => ({
          applicationId: effect.applicationId,
          criterionId: effect.criterionId,
          state: effect.suggestedState,
          note: effect.note
        }))
      },
      {
        type: 'register-referral',
        at: AT,
        input: {
          jobId: 'VAG-01',
          companyId: 'EMP-01',
          message: 'Encaminhamento de 1 perfil.',
          items: [
            {
              applicationId: 'CAND-01',
              justification: 'Experiência de conferência registrada.',
              sharedEvidenceIds: ['EVD-ANA-01'],
              summary: 'Ana Ribeiro.',
              attentionPoints: [],
              suggestedQuestions: []
            }
          ]
        }
      }
    );

    return demoReducer(state, {
      type: 'manager-decision',
      referralId: state.referrals[0]!.id,
      applicationId: 'CAND-01',
      decision: 'nao-avancar',
      note: 'Precisamos de alguém que execute a rotina sem acompanhamento.',
      at: AT
    });
  }

  it('propõe elevar o peso do eixo em que os processos recusados divergiam', () => {
    let state = buildInitialDemoState();

    // A empresa havia rebaixado o eixo; os processos dizem outra coisa. É
    // este o padrão que a central identifica — e só propõe.
    state = demoReducer(state, {
      type: 'set-axis-weight',
      jobId: 'VAG-01',
      axisId: 'apoio-inicial',
      weight: 'medio',
      at: AT
    });
    state = declineAnaOnJobOne(state);

    const learning = getWeightLearning(state, 'VAG-01');
    const apoio = learning.find((entry) => entry.axisId === 'apoio-inicial')!;

    expect(apoio.occurrences).toBeGreaterThanOrEqual(
      WEIGHT_LEARNING_MIN_OCCURRENCES
    );
    expect(apoio.suggestedWeight).toBe('alto');
    expect(apoio.rationale).toContain('divergência');

    // A proposta não se aplica sozinha: o peso continua o que a empresa
    // definiu até alguém confirmar.
    expect(getAxisWeight(getJob('VAG-01')!, 'apoio-inicial', state)).toBe(
      'medio'
    );

    state = demoReducer(state, {
      type: 'set-axis-weight',
      jobId: 'VAG-01',
      axisId: apoio.axisId,
      weight: apoio.suggestedWeight,
      at: AT
    });
    expect(getAxisWeight(getJob('VAG-01')!, 'apoio-inicial', state)).toBe(
      'alto'
    );
    // Confirmado, o padrão sai da lista: propor de novo o que já vale seria
    // ruído.
    expect(
      getWeightLearning(state, 'VAG-01').some(
        (entry) => entry.axisId === 'apoio-inicial'
      )
    ).toBe(false);
  });

  it('não enxerga padrão onde nenhum processo foi recusado', () => {
    let state = buildInitialDemoState();
    expect(getWeightLearning(state, 'VAG-01')).toEqual([]);

    // Um encaminhamento sem decisão da empresa também não é padrão: o
    // aprendizado vem do desfecho, não do envio.
    state = demoReducer(state, {
      type: 'register-referral',
      at: AT,
      input: {
        jobId: 'VAG-01',
        companyId: 'EMP-01',
        message: 'Encaminhamento de 1 perfil.',
        items: [
          {
            applicationId: 'CAND-01',
            justification: 'Experiência de conferência registrada.',
            sharedEvidenceIds: ['EVD-ANA-01'],
            summary: 'Ana Ribeiro.',
            attentionPoints: [],
            suggestedQuestions: []
          }
        ]
      }
    });

    expect(getWeightLearning(state, 'VAG-01')).toEqual([]);
  });
});

describe('perfil cultural da empresa como média', () => {
  it('calcula a média ponderada por respondente, não por papel', () => {
    const state = buildInitialDemoState();
    const profile = getCompanyCultureProfile(state, 'EMP-01');
    const apoio = profile.find((entry) => entry.axisId === 'apoio-inicial')!;

    // Cerrado, apoio inicial: gestão respondeu "troca informal" (2, 1 pessoa)
    // e a equipe respondeu "por conta" (1, 5 pessoas) e "troca informal"
    // (2, 2 pessoas). A média é do que a empresa entende (00:41:44), então as
    // 8 respostas entram com o mesmo peso individual: (2 + 5 + 4) / 8.
    expect(apoio.respondents).toBe(8);
    expect(apoio.mean).toBeCloseTo(11 / 8, 10);
    expect(apoio.byRole.gestao).toBe(2);
    expect(apoio.byRole.equipe).toBeCloseTo(9 / 7, 10);

    // A média é o perfil; a dispersão continua sendo o diagnóstico. Uma não
    // apaga a outra — foi essa a correção da reunião sobre o briefing.
    expect(apoio.dispersion).toBe('divergente');
    expect(apoio.ready).toBe(true);
  });

  it('não fecha o perfil onde a consulta à equipe não tem base', () => {
    const state = buildInitialDemoState();
    const profile = getCompanyCultureProfile(state, 'EMP-03');
    const autonomia = profile.find((entry) => entry.axisId === 'autonomia')!;

    // Oficina Pantanal: duas respostas da equipe. Duas pessoas não são "a
    // equipe", e o documento de produto manda o perfil não fechar e a tela
    // dizer isso, em vez de tratar duas como o conjunto.
    expect(autonomia.respondents).toBe(3);
    expect(autonomia.mean).not.toBeNull();
    expect(autonomia.ready).toBe(false);

    // Eixo sem resposta nenhuma não tem média para mostrar.
    const aprendizado = profile.find(
      (entry) => entry.axisId === 'aprendizado'
    )!;
    expect(aprendizado.mean).toBeNull();
    expect(aprendizado.respondents).toBe(0);
  });
});

describe('motor de aderência', () => {
  it('mede a distância entre os dois lados na escala ordinal', () => {
    // Extremos opostos na escala 1..3: distância máxima, aderência zero.
    const oposto = computeAdherence(
      { 'apoio-inicial': 1 },
      { 'apoio-inicial': 3 },
      { 'apoio-inicial': 'alto' }
    );
    expect(oposto.byAxis[0]?.adherence).toBe(0);
    expect(oposto.total).toBe(0);

    // Mesma resposta dos dois lados: 100. Não é "vai dar certo", é "o que a
    // empresa pratica é o que a pessoa procura naquele eixo".
    const igual = computeAdherence(
      { 'apoio-inicial': 2 },
      { 'apoio-inicial': 2 },
      { 'apoio-inicial': 'alto' }
    );
    expect(igual.byAxis[0]?.adherence).toBe(100);
    expect(igual.total).toBe(100);
  });

  it('pondera o total pelo peso que a empresa declarou', () => {
    // Conta refeita à mão, que é o critério de aceitação: com peso alto = 3 e
    // baixo = 1, um eixo em 100 (alto) e outro em 0 (baixo) dão
    // (100×3 + 0×1) / (3 + 1) = 75.
    const result = computeAdherence(
      { 'apoio-inicial': 2, aprendizado: 1 },
      { 'apoio-inicial': 2, aprendizado: 3 },
      { 'apoio-inicial': 'alto', aprendizado: 'baixo' }
    );

    expect(result.total).toBe(75);
    expect(result.coverage).toEqual({ answeredAxes: 2, totalAxes: 5 });
  });

  it('não inventa número onde falta um dos lados', () => {
    // Empresa sem perfil fechado: não há do que medir distância.
    const semEmpresa = computeAdherence({}, { 'apoio-inicial': 3 }, {});
    expect(semEmpresa.byAxis[0]?.adherence).toBeNull();
    expect(semEmpresa.total).toBeNull();
    expect(semEmpresa.compatible).toBeNull();

    // Candidato que não respondeu também não tem medida. `null` e não zero:
    // zero é uma medida, ausência é outra coisa, e confundir as duas
    // transformaria silêncio em demérito.
    const semCandidato = computeAdherence({ 'apoio-inicial': 2 }, null, {});
    expect(semCandidato.byAxis[0]?.adherence).toBeNull();
    expect(semCandidato.total).toBeNull();
    expect(semCandidato.compatible).toBeNull();
    expect(semCandidato.coverage.answeredAxes).toBe(0);
  });

  it('aplica o corte de 35% do cliente exatamente na borda', () => {
    // R3 (00:20:19): "no mínimo 35%". Mínimo inclui o 35.
    const noCorte = computeAdherence(
      { 'apoio-inicial': 1 + 2 * (1 - ADHERENCE_THRESHOLD / 100) },
      { 'apoio-inicial': 1 },
      {}
    );
    expect(noCorte.total).toBeCloseTo(ADHERENCE_THRESHOLD, 10);
    expect(noCorte.compatible).toBe(true);

    const abaixo = computeAdherence(
      { 'apoio-inicial': 1 + 2 * (1 - 34.99 / 100) },
      { 'apoio-inicial': 1 },
      {}
    );
    expect(abaixo.total).toBeCloseTo(34.99, 10);
    expect(abaixo.compatible).toBe(false);
  });

  it('monta a aderência da candidatura a partir do estado', () => {
    const state = buildInitialDemoState();
    const ana = getAdherence(state, 'CAND-01')!;

    // Cerrado só fechou dois eixos; o denominador precisa ficar visível.
    expect(ana.coverage).toEqual({ answeredAxes: 2, totalAxes: 5 });

    // Ana espera acompanhamento (3) numa empresa que mal tem apoio (1,375):
    // 100 × (1 − 1,625/2) = 18,75. É o eixo em que a leitura por estado já
    // apontava divergência — o número explica a mesma coisa, com escala.
    const apoio = ana.byAxis.find((entry) => entry.axisId === 'apoio-inicial')!;
    expect(apoio.candidateValue).toBe(3);
    expect(apoio.adherence).toBeCloseTo(18.75, 10);
    expect(apoio.weight).toBe('alto');

    // Total ponderado: apoio (18,75 × 3) e comunicação (93,75 × 2) sobre 5.
    expect(ana.total).toBeCloseTo(48.75, 10);
    expect(ana.compatible).toBe(true);
  });

  it('não calcula aderência onde o perfil da empresa não fechou', () => {
    const state = buildInitialDemoState();
    // Oficina Pantanal tem duas respostas da equipe num eixo só.
    const carla = getAdherence(state, 'CAND-08')!;

    expect(carla.total).toBeNull();
    expect(carla.compatible).toBeNull();
    expect(carla.coverage.answeredAxes).toBe(0);
  });
});

describe('questionário de fit do candidato', () => {
  it('usa a mesma escala dos dois lados', () => {
    // Um eixo acrescentado só de um lado, ou uma alternativa com valor
    // diferente entre empresa e candidato, daria um percentual que parece
    // certo e não é. Como isso não aparece em tela nenhuma, a garantia é esta.
    expect(assertCandidateQuestionnaireMirrorsCompany()).toEqual([]);
  });

  it('grava resposta e aceite juntos, com histórico', () => {
    let state = buildInitialDemoState();
    expect(getFitResponse(state, 'CAND-10')).toBeNull();

    state = demoReducer(state, {
      type: 'answer-fit-questionnaire',
      applicationId: 'CAND-10',
      answers: {
        'apoio-inicial': 2,
        autonomia: 2,
        'comunicacao-prioridades': 2,
        'ritmo-turno': 2,
        aprendizado: 2
      },
      consentVersion: CANDIDATE_CONSENT_VERSION,
      at: AT
    });

    const response = getFitResponse(state, 'CAND-10')!;
    expect(response.answers['apoio-inicial']).toBe(2);
    // A base legal é o consentimento (LGPD, art. 7º, I). Sem versão e hora
    // do aceite não há como demonstrar a que a pessoa consentiu.
    expect(response.consent.version).toBe(CANDIDATE_CONSENT_VERSION);
    expect(response.consent.acceptedAt).toBe(AT);
    expect(state.history[0]?.action).toBe('Questionário de fit respondido');
  });

  it('substitui a resposta anterior em vez de acumular duas', () => {
    let state = buildInitialDemoState();
    const before = state.fitResponses?.length ?? 0;

    const answer = (value: 1 | 2 | 3) =>
      demoReducer(state, {
        type: 'answer-fit-questionnaire',
        applicationId: 'CAND-01',
        answers: {
          'apoio-inicial': value,
          autonomia: value,
          'comunicacao-prioridades': value,
          'ritmo-turno': value,
          aprendizado: value
        },
        consentVersion: CANDIDATE_CONSENT_VERSION,
        at: AT
      });

    state = answer(1);
    state = answer(3);

    expect(state.fitResponses).toHaveLength(before);
    expect(getFitResponse(state, 'CAND-01')?.answers.autonomia).toBe(3);
    // A troca fica registrada: a aderência muda com ela, e o analista precisa
    // poder explicar por que o percentual de ontem não é o de hoje.
    expect(state.history[0]?.action).toBe(
      'Questionário de fit respondido novamente'
    );
  });

  it('nunca entrega o nome da empresa ao candidato', () => {
    const state = buildInitialDemoState();
    const view = getCandidateJobView(state, 'CAND-01')!;

    // R5 (00:22:21, 00:38:43): atividade, localidade e segmento — nunca o
    // nome. Este teste falha no instante em que o nome voltar por qualquer
    // caminho, porque compara com o serializado inteiro.
    expect(view.sector).toBe('Distribuição e logística');
    expect(view.activity).toBe('Assistente de Logística');
    expect(JSON.stringify(view)).not.toContain('Cerrado');

    // A resposta gravada também não carrega empresa: ela é da candidatura.
    expect(JSON.stringify(getFitResponse(state, 'CAND-01'))).not.toContain(
      'EMP-'
    );
  });
});

describe('ranking por vaga', () => {
  it('ordena por aderência e joga quem não tem medida para o fim', () => {
    const state = buildInitialDemoState();
    const ranking = getJobRanking(state, 'VAG-01');

    const totals = ranking.map((entry) => entry.adherence.total);
    const medidos = totals.filter((total): total is number => total !== null);

    // Desc entre os medidos, e nenhum `null` antes de um número: sem resposta
    // não há medida, e ordenar ausência como se fosse aderência mínima seria
    // punir pelo silêncio.
    expect([...medidos].sort((a, b) => b - a)).toEqual(medidos);
    expect(totals.indexOf(null)).toBe(medidos.length);

    expect(ranking[0]?.rank).toBe(1);
    expect(ranking.every((entry) => entry.technicalMatch !== null)).toBe(true);
  });

  it('põe quem respondeu acima de quem não respondeu', () => {
    const state = buildInitialDemoState();
    const ranking = getJobRanking(state, 'VAG-03');

    const carla = ranking.findIndex(
      (entry) => entry.application.id === 'CAND-08'
    );
    const hugo = ranking.findIndex(
      (entry) => entry.application.id === 'CAND-10'
    );

    expect(ranking[carla]?.fitStatus).toBe('respondido');
    expect(ranking[hugo]?.fitStatus).toBe('expirado');
  });

  it('marca quem ficou abaixo do corte sem escondê-lo da lista', () => {
    let state = buildInitialDemoState();
    state = demoReducer(state, {
      type: 'answer-fit-questionnaire',
      applicationId: 'CAND-01',
      answers: {
        'apoio-inicial': 3,
        autonomia: 3,
        'comunicacao-prioridades': 1,
        'ritmo-turno': 3,
        aprendizado: 3
      },
      consentVersion: CANDIDATE_CONSENT_VERSION,
      at: AT
    });

    const ana = getJobRanking(state, 'VAG-01').find(
      (entry) => entry.application.id === 'CAND-01'
    )!;

    // 35% é corte de atenção para o analista decidir, não gatilho automático:
    // quem fica abaixo continua na lista, marcado.
    expect(ana.adherence.total).toBeLessThan(ADHERENCE_THRESHOLD);
    expect(ana.belowThreshold).toBe(true);
  });

  it('resgata quem o filtro técnico descartaria e a cultura sustenta', () => {
    const state = buildInitialDemoState();
    const rescue = getRescueCandidates(state, 'VAG-02');

    // R10: o filtro técnico configurado errado expurga candidato aderente.
    // Fábio tem 45 de técnico e responde exatamente o que a Horizonte pratica.
    expect(rescue.map((entry) => entry.application.id)).toContain('CAND-07');
    expect(
      rescue.every(
        (entry) =>
          (entry.technicalMatch ?? 0) < 50 &&
          (entry.adherence.total ?? 0) >= ADHERENCE_THRESHOLD
      )
    ).toBe(true);
  });
});

describe('limite de currículos por vaga', () => {
  it('recusa o sexto currículo e registra a recusa no histórico', () => {
    let state = buildInitialDemoState();
    const candidatos = getJobRanking(state, 'VAG-01')
      .slice(0, REFERRAL_LIMIT + 1)
      .map((entry) => entry.application.id);

    expect(candidatos).toHaveLength(6);

    for (const applicationId of candidatos) {
      state = demoReducer(state, {
        type: 'add-to-referral-list',
        jobId: 'VAG-01',
        applicationId,
        at: AT
      });
    }

    // R6 (00:33:30): máximo de 5 currículos por vaga. A sexta não entra, e a
    // recusa aparece — senão o analista tentaria de novo achando que o clique
    // falhou, em vez de trocar alguém da lista.
    expect(state.referralList['VAG-01']).toHaveLength(REFERRAL_LIMIT);
    expect(state.referralList['VAG-01']).not.toContain(candidatos[5]);
    expect(state.history[0]?.action).toBe('Limite de 5 currículos por vaga');
  });

  it('não registra encaminhamento acima do limite', () => {
    let state = buildInitialDemoState();
    const items = getJobRanking(state, 'VAG-01')
      .slice(0, REFERRAL_LIMIT + 1)
      .map((entry) => ({
        applicationId: entry.application.id,
        justification: 'Seleção da demonstração.',
        sharedEvidenceIds: [],
        summary: entry.talent?.name ?? entry.application.id,
        attentionPoints: [],
        suggestedQuestions: []
      }));

    state = demoReducer(state, {
      type: 'register-referral',
      at: AT,
      input: {
        jobId: 'VAG-01',
        companyId: 'EMP-01',
        message: 'Remessa acima do limite.',
        items
      }
    });

    // O limite vale para a remessa, não só para a lista: registrar é o caminho
    // que de fato entrega currículos à empresa.
    expect(state.referrals).toHaveLength(0);
    expect(state.history[0]?.action).toBe('Limite de 5 currículos por vaga');
  });
});
