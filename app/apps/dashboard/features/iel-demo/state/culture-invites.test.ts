import { describe, expect, it } from 'vitest';

import { CULTURE_CONSENT_VERSION } from '../analysis/culture-invites';
import { ITENS_DO_INSTRUMENTO } from '../analysis/instrumento';
import { buildInitialDemoState } from '../fixtures';
import { demoReducer } from './reducer';
import {
  getCompanyCultureProfile,
  getCultureInvites,
  getCultureSampleProgress,
  getInviteByToken
} from './selectors';

const AT = '2026-09-14T10:00:00.000Z';

// "Concordo" em todas as frases: o reducer guarda só as do bloco do convite.
const RESPOSTAS = Object.fromEntries(
  ITENS_DO_INSTRUMENTO.map((item) => [item.id, 4 as const])
);

function convidar(state = buildInitialDemoState(), at = AT) {
  return demoReducer(state, {
    type: 'add-culture-invites',
    companyId: 'EMP-02',
    people: [
      {
        corporateEmail: 'Teodoro.Mascarenhas@horizonte.example.com',
        role: 'equipe',
        area: 'Estoque'
      }
    ],
    at
  });
}

describe('cadastro da amostra (M2)', () => {
  it('gera token opaco, prazo de 3 dias e não usa relógio', () => {
    const state = convidar();
    const convite = getCultureInvites(state, 'EMP-02').at(-1);

    expect(convite?.token).toMatch(/^[0-9a-f]{16}$/);
    expect(convite?.token).not.toContain('teodoro');
    expect(convite?.sentAt).toBe('2026-09-14');
    expect(convite?.expiresAt).toBe('2026-09-17');
    expect(convite?.answeredAt).toBeNull();
    expect(convite?.consentVersion).toBeNull();
  });

  it('ignora e-mail já convidado na mesma empresa, sem caixa nem espaço', () => {
    const uma = convidar();
    const duas = convidar(uma, '2026-09-15T10:00:00.000Z');

    expect(getCultureInvites(duas, 'EMP-02')).toHaveLength(
      getCultureInvites(uma, 'EMP-02').length
    );
    expect(duas).toBe(uma);
  });
});

describe('resposta pelo link (M2)', () => {
  it('marca o convite como respondido e entra na média da empresa', () => {
    const state = convidar();
    const convite = getCultureInvites(state, 'EMP-02').at(-1)!;
    const depois = demoReducer(state, {
      type: 'answer-culture-invite',
      token: convite.token,
      answers: RESPOSTAS,
      consentVersion: CULTURE_CONSENT_VERSION,
      at: '2026-09-15T09:00:00.000Z'
    });

    const atualizado = getCultureInvites(depois, 'EMP-02').at(-1);
    expect(atualizado?.answeredAt).toBe('2026-09-15T09:00:00.000Z');
    expect(atualizado?.consentVersion).toBe(CULTURE_CONSENT_VERSION);

    // Instrumento de 52 frases: o convite responde o próprio bloco (16).
    const doConvite = depois.cultureAnswers.filter(
      (answer) => answer.inviteId === convite.id
    );
    expect(doConvite).toHaveLength(16);
    expect(getCompanyCultureProfile(depois, 'EMP-02')).toHaveLength(11);
  });

  it('o mesmo link vale uma vez só', () => {
    const state = convidar();
    const convite = getCultureInvites(state, 'EMP-02').at(-1)!;

    const uma = demoReducer(state, {
      type: 'answer-culture-invite',
      token: convite.token,
      answers: RESPOSTAS,
      consentVersion: CULTURE_CONSENT_VERSION,
      at: '2026-09-15T09:00:00.000Z'
    });
    const duas = demoReducer(uma, {
      type: 'answer-culture-invite',
      token: convite.token,
      answers: RESPOSTAS,
      consentVersion: CULTURE_CONSENT_VERSION,
      at: '2026-09-16T09:00:00.000Z'
    });

    expect(duas.cultureAnswers).toHaveLength(uma.cultureAnswers.length);
    expect(duas.history[0]?.action).toBe('Link de consulta já utilizado');
  });

  it('link vencido não grava resposta nem lança', () => {
    const state = convidar();
    const convite = getCultureInvites(state, 'EMP-02').at(-1)!;

    const depois = demoReducer(state, {
      type: 'answer-culture-invite',
      token: convite.token,
      answers: RESPOSTAS,
      consentVersion: CULTURE_CONSENT_VERSION,
      at: '2026-09-20T09:00:00.000Z'
    });

    expect(depois.cultureAnswers).toHaveLength(state.cultureAnswers.length);
    expect(getCultureInvites(depois, 'EMP-02').at(-1)?.answeredAt).toBeNull();
    expect(depois.history[0]?.action).toBe('Link de consulta expirado');
  });

  it('token desconhecido é no-op silencioso', () => {
    const state = buildInitialDemoState();
    expect(
      demoReducer(state, {
        type: 'answer-culture-invite',
        token: 'ffffffffffffffff',
        answers: RESPOSTAS,
        consentVersion: CULTURE_CONSENT_VERSION,
        at: AT
      })
    ).toBe(state);
  });
});

describe('reenvio do convite (S4)', () => {
  it('estende o prazo em 3 dias e mantém o mesmo link', () => {
    const state = buildInitialDemoState();
    const vencido = getCultureInvites(state, 'EMP-03').find(
      (convite) => !convite.answeredAt
    )!;

    const depois = demoReducer(state, {
      type: 'resend-culture-invite',
      inviteId: vencido.id,
      at: AT
    });

    const reenviado = getCultureInvites(depois, 'EMP-03').find(
      (convite) => convite.id === vencido.id
    );
    expect(reenviado?.expiresAt).toBe('2026-09-17');
    expect(reenviado?.resendCount).toBe(1);
    expect(reenviado?.token).toBe(vencido.token);
    expect(depois.history[0]?.action).toBe('Convite reenviado');
  });

  it('convite já respondido não é reenviado', () => {
    const state = buildInitialDemoState();
    const respondido = getCultureInvites(state, 'EMP-03').find(
      (convite) => convite.answeredAt
    )!;

    expect(
      demoReducer(state, {
        type: 'resend-culture-invite',
        inviteId: respondido.id,
        at: AT
      })
    ).toBe(state);
  });
});

describe('progresso da amostra', () => {
  // 2026-09-19 (seed das empresas reais): a base passou a parecer completa e
  // a segunda leva da Cerrado respondeu — 10 de 10, prazo ainda o mesmo.
  it('conta 10 de 10 na Cerrado, com prazo vencendo em 1 dia', () => {
    const progresso = getCultureSampleProgress(
      buildInitialDemoState(),
      'EMP-01'
    );

    expect(progresso.answered).toBe(10);
    expect(progresso.total).toBe(10);
    expect(progresso.deadline).toBe('2026-09-21');
    expect(progresso.daysLeft).toBe(1);
    expect(progresso.overdue).toBe(false);
    expect(progresso.byRole.equipe).toEqual({ answered: 10, total: 10 });
    expect(progresso.requiredForProfile).toBe(3);
    expect(progresso.ready).toBe(true);
  });

  it('marca prazo vencido e perfil em aberto na Oficina Pantanal', () => {
    const progresso = getCultureSampleProgress(
      buildInitialDemoState(),
      'EMP-03'
    );

    expect(progresso.answered).toBe(3);
    expect(progresso.total).toBe(8);
    expect(progresso.overdue).toBe(true);
    expect(progresso.daysLeft).toBeLessThan(0);
    expect(progresso.ready).toBe(false);
  });

  it('empresa sem consulta aberta não inventa prazo', () => {
    const progresso = getCultureSampleProgress(
      buildInitialDemoState(),
      'EMP-99'
    );

    expect(progresso).toMatchObject({
      answered: 0,
      total: 0,
      deadline: null,
      daysLeft: null,
      overdue: false,
      ready: false
    });
  });
});

describe('tela do colaborador (PRODUTO.md §5)', () => {
  it('devolve só empresa, prazo e situação — sem nome nem e-mail', () => {
    const state = buildInitialDemoState();
    // O último convite da Cerrado passou a estar respondido (seed de
    // 2026-09-19); o único aberto e no prazo é o da Colatte.
    const convite = getCultureInvites(state, 'EMP-04').at(-1)!;
    const vista = getInviteByToken(state, convite.token);

    expect(vista).toEqual({
      inviteId: convite.id,
      companyId: 'EMP-04',
      companyName: 'Colatte',
      expiresAt: convite.expiresAt,
      daysLeft: 2,
      status: 'aberto',
      bloco: expect.any(Array)
    });
    expect(JSON.stringify(vista)).not.toContain('@');
  });

  it('distingue respondido, expirado e token inexistente', () => {
    const state = buildInitialDemoState();
    const respondido = getCultureInvites(state, 'EMP-01')[0]!;
    const expirado = getCultureInvites(state, 'EMP-03').find(
      (convite) => !convite.answeredAt
    )!;

    expect(getInviteByToken(state, respondido.token)?.status).toBe(
      'respondido'
    );
    expect(getInviteByToken(state, expirado.token)?.status).toBe('expirado');
    expect(getInviteByToken(state, 'naoexiste')).toBeNull();
  });
});
