import { describe, expect, it } from 'vitest';

import {
  getCoverage,
  getCriterionAnalysis
} from '../analysis/criterion-states';
import {
  buildInitialDemoState,
  COMPARISON_LIMIT,
  DEMO_COMPANIES,
  DEMO_JOBS,
  DEMO_SYNC_EVENTS,
  DEMO_TALENTS,
  findClarificationTemplate
} from '../fixtures';
import type { DemoState } from '../types';
import { applySyncEventPayload, demoReducer, type DemoAction } from './reducer';
import {
  getApplication,
  getClarification,
  getJob,
  getOpenClarifications,
  getOverviewMetrics,
  getReusedEvidences,
  getTalentJourney,
  getVisibleTalentIds
} from './selectors';

const AT = '2026-09-15T10:00:00.000Z';

function run(state: DemoState, ...actions: DemoAction[]): DemoState {
  return actions.reduce(demoReducer, state);
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
