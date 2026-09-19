import type { CultureOptionId, CultureOptionValue } from '../analysis/culture';
import {
  addDays,
  buildInviteToken,
  CULTURE_INVITE_DEADLINE_DAYS,
  CULTURE_INVITE_TOKEN_SEED,
  type CultureInviteRole
} from '../analysis/culture-invites';
import type { FitAxisId } from '../analysis/fit-axes';
import { getFitAxis } from '../analysis/fit-axes';
import type { ImportPlan } from '../analysis/spreadsheet-import';
import { normalizeEmail } from '../analysis/spreadsheet-import';
import { buildInitialDemoState, COMPARISON_LIMIT } from '../fixtures';
import { plural } from '../format';
import type {
  AxisWeight,
  CandidateFitResponse,
  Clarification,
  ClarificationEffect,
  CriterionState,
  CultureAnswer,
  CultureRespondentInvite,
  DataSourceId,
  DemoState,
  DemoUiState,
  Evidence,
  HistoryEvent,
  Referral,
  ReferralItem,
  SpreadsheetImportRecord,
  Talent
} from '../types';
import { REFERRAL_LIMIT } from './selectors';

export type IncorporationDecision = {
  applicationId: string;
  criterionId: string;
  state: CriterionState;
  note: string;
};

export type CreateClarificationInput = {
  jobId: string;
  applicationId: string | null;
  criterionId: string;
  recipient: Clarification['recipient'];
  question: string;
  sharedInfo: string;
  reason: string;
  preparedAnswer: string | null;
  effects: ClarificationEffect[];
  teamConditionUpdate: Clarification['teamConditionUpdate'];
  /** Rascunho quando o analista ainda quer revisar antes de enviar. */
  asDraft?: boolean;
};

export type RegisterReferralInput = {
  jobId: string;
  companyId: string;
  message: string;
  items: {
    applicationId: string;
    justification: string;
    sharedEvidenceIds: string[];
    summary: string;
    attentionPoints: string[];
    suggestedQuestions: string[];
  }[];
};

/**
 * Pessoa da amostra, como a analista cadastra: e-mail corporativo, área e
 * papel. Sem nome — a consulta não precisa dele (PRODUTO.md §5.2).
 */
export type CultureInvitePerson = {
  corporateEmail: string;
  role: CultureInviteRole;
  area: string;
};

export type DemoAction =
  | { type: 'hydrate'; state: DemoState }
  | { type: 'reset' }
  | { type: 'set-persona'; personaId: string }
  | { type: 'set-ui'; ui: Partial<DemoUiState> }
  | { type: 'toggle-comparison'; jobId: string; applicationId: string }
  | { type: 'clear-comparison'; jobId: string }
  | {
      type: 'add-to-referral-list';
      jobId: string;
      applicationId: string;
      at: string;
    }
  | {
      type: 'remove-from-referral-list';
      jobId: string;
      applicationId: string;
      at: string;
    }
  | {
      /**
       * O candidato responde o questionário de fit daquela candidatura e
       * aceita o uso dos dados (M3, M7, R4). Resposta e aceite entram juntos:
       * a base legal é o consentimento (LGPD, art. 7º, I), e resposta gravada
       * sem o aceite que a autoriza seria tratamento sem base.
       */
      type: 'answer-fit-questionnaire';
      applicationId: string;
      answers: Record<FitAxisId, CultureOptionValue>;
      consentVersion: string;
      at: string;
    }
  | {
      type: 'create-clarification';
      input: CreateClarificationInput;
      at: string;
    }
  | { type: 'send-clarification'; clarificationId: string; at: string }
  | { type: 'cancel-clarification'; clarificationId: string; at: string }
  | {
      /**
       * A empresa confirma ou corrige o traçado proposto pela análise.
       * Registra como resposta da gestão: a proposta sozinha nunca vira
       * resposta, porque o enunciado exige supervisão humana.
       */
      type: 'answer-culture';
      companyId: string;
      axisId: FitAxisId;
      optionId: string;
      at: string;
    }
  | {
      /**
       * A empresa define o peso de um eixo nesta vaga — confirmando a
       * proposta da análise, corrigindo-a, ou acatando um padrão observado
       * nos processos. Em qualquer caso é uma decisão declarada por alguém,
       * e por isso entra no histórico.
       */
      type: 'set-axis-weight';
      jobId: string;
      axisId: FitAxisId;
      weight: AxisWeight;
      at: string;
    }
  | {
      type: 'answer-clarification';
      clarificationId: string;
      answer: string;
      declined: boolean;
      at: string;
    }
  | {
      type: 'incorporate-clarification';
      clarificationId: string;
      decisions: IncorporationDecision[];
      at: string;
    }
  | {
      type: 'add-internal-note';
      talentId: string;
      jobId: string;
      note: string;
      at: string;
    }
  | { type: 'register-referral'; input: RegisterReferralInput; at: string }
  | {
      type: 'manager-decision';
      referralId: string;
      applicationId: string;
      decision: 'quero-entrevistar' | 'nao-avancar';
      note: string;
      at: string;
    }
  | {
      /** A empresa pede um esclarecimento ao IEL sobre um perfil compartilhado. */
      type: 'manager-clarification-request';
      referralId: string;
      applicationId: string;
      question: string;
      at: string;
    }
  | {
      /**
       * Aplica uma planilha da Empregare já transformada em plano (M6).
       *
       * O reducer não lê arquivo: recebe o plano que `buildImportPlan`
       * produziu, para que a troca da planilha pelo webhook da Empregare não
       * mexa aqui. A `fingerprint` do plano garante a idempotência — subir a
       * mesma planilha duas vezes registra o fato e não duplica registro.
       */
      type: 'import-spreadsheet';
      jobId: string;
      plan: ImportPlan;
      at: string;
    }
  | {
      /**
       * A analista cadastra a amostra de colaboradores da empresa (M2).
       *
       * E-mail já convidado naquela empresa é ignorado em silêncio: cadastrar
       * a mesma pessoa duas vezes daria dois links à mesma pessoa e inflaria o
       * denominador do "N de M responderam".
       */
      type: 'add-culture-invites';
      companyId: string;
      people: CultureInvitePerson[];
      at: string;
    }
  | {
      /**
       * O colaborador responde pelo link, sem login (M2).
       *
       * Token expirado ou já usado não lança: vira no-op com o motivo no
       * histórico. Quem abre um link vencido precisa de uma tela que explique,
       * não de um erro.
       */
      type: 'answer-culture-invite';
      token: string;
      answers: Record<FitAxisId, CultureOptionId>;
      consentVersion: string;
      at: string;
    }
  | {
      /** A analista reenvia um convite em aberto e estende o prazo (S4). */
      type: 'resend-culture-invite';
      inviteId: string;
      at: string;
    }
  | { type: 'apply-sync-event'; eventId: string; at: string }
  | {
      type: 'set-source-status';
      sourceId: DataSourceId;
      status: 'ativa' | 'indisponivel';
      error: string | null;
      at: string;
    };

function nextSequentialId(prefix: string, existing: string[]): string {
  const numbers = existing
    .map((id) => Number.parseInt(id.replace(`${prefix}-`, ''), 10))
    .filter((value) => Number.isFinite(value));
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1;
  return `${prefix}-${String(next).padStart(2, '0')}`;
}

function appendHistory(
  state: DemoState,
  event: Omit<HistoryEvent, 'id'>
): HistoryEvent[] {
  const id = nextSequentialId(
    'HIST',
    state.history.map((entry) => entry.id)
  );
  return [{ id, ...event }, ...state.history];
}

function updateApplication(
  state: DemoState,
  applicationId: string,
  patch: Partial<DemoState['applications'][number]>
): DemoState['applications'] {
  return state.applications.map((application) =>
    application.id === applicationId
      ? { ...application, ...patch }
      : application
  );
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'hydrate':
      return action.state;

    case 'reset':
      return buildInitialDemoState();

    case 'set-persona':
      return { ...state, personaId: action.personaId };

    case 'set-ui':
      return { ...state, ui: { ...state.ui, ...action.ui } };

    case 'toggle-comparison': {
      const current = state.comparison[action.jobId] ?? [];
      const isSelected = current.includes(action.applicationId);
      if (!isSelected && current.length >= COMPARISON_LIMIT) {
        return state;
      }
      const next = isSelected
        ? current.filter((id) => id !== action.applicationId)
        : [...current, action.applicationId];
      return {
        ...state,
        comparison: { ...state.comparison, [action.jobId]: next }
      };
    }

    case 'clear-comparison': {
      const comparison = { ...state.comparison };
      delete comparison[action.jobId];
      return { ...state, comparison };
    }

    case 'add-to-referral-list': {
      const current = state.referralList[action.jobId] ?? [];
      if (current.includes(action.applicationId)) return state;

      const application = state.applications.find(
        (entry) => entry.id === action.applicationId
      );
      if (!application || application.jobId !== action.jobId) return state;

      // R6 (00:33:30): no máximo 5 currículos por vaga. A recusa entra no
      // histórico em vez de sumir — o analista precisa saber que a ação não
      // valeu, e por quê, para trocar alguém da lista em vez de tentar de
      // novo achando que o clique falhou.
      if (current.length >= REFERRAL_LIMIT) {
        return {
          ...state,
          history: appendHistory(state, {
            at: action.at,
            actor: 'Analista IEL',
            action: 'Limite de 5 currículos por vaga',
            description: `A candidatura ${action.applicationId} não entrou na lista da vaga ${action.jobId}: a remessa já tem ${REFERRAL_LIMIT} currículos. Para incluir outra pessoa, retire uma da lista.`,
            entityRef: action.applicationId
          })
        };
      }

      return {
        ...state,
        referralList: {
          ...state.referralList,
          [action.jobId]: [...current, action.applicationId]
        },
        applications: updateApplication(state, action.applicationId, {
          referralStage:
            application.referralStage === 'nao-encaminhada'
              ? 'na-lista'
              : application.referralStage
        }),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Adicionado à lista de encaminhamento',
          description: `Candidatura ${action.applicationId} entrou na lista da vaga ${action.jobId}.`,
          entityRef: action.applicationId
        })
      };
    }

    case 'remove-from-referral-list': {
      const current = state.referralList[action.jobId] ?? [];
      if (!current.includes(action.applicationId)) return state;
      const application = state.applications.find(
        (entry) => entry.id === action.applicationId
      );

      return {
        ...state,
        referralList: {
          ...state.referralList,
          [action.jobId]: current.filter((id) => id !== action.applicationId)
        },
        applications: updateApplication(state, action.applicationId, {
          referralStage:
            application?.referralStage === 'na-lista'
              ? 'nao-encaminhada'
              : (application?.referralStage ?? 'nao-encaminhada')
        }),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Removido da lista de encaminhamento',
          description: `Candidatura ${action.applicationId} saiu da lista da vaga ${action.jobId}.`,
          entityRef: action.applicationId
        })
      };
    }

    case 'answer-fit-questionnaire': {
      const application = state.applications.find(
        (entry) => entry.id === action.applicationId
      );
      if (!application) return state;

      const responses = state.fitResponses ?? [];
      const previous = responses.find(
        (entry) => entry.applicationId === action.applicationId
      );

      const response: CandidateFitResponse = {
        applicationId: action.applicationId,
        answers: action.answers,
        answeredAt: action.at,
        consent: { acceptedAt: action.at, version: action.consentVersion }
      };

      // Idempotente por candidatura: uma pessoa que refaz o questionário tem
      // uma resposta, não duas. A substituição fica no histórico porque a
      // aderência muda com ela, e o analista precisa poder explicar por que o
      // percentual de ontem não é o de hoje.
      return {
        ...state,
        fitResponses: [
          ...responses.filter(
            (entry) => entry.applicationId !== action.applicationId
          ),
          response
        ],
        history: appendHistory(state, {
          at: action.at,
          actor: 'Candidato',
          action: previous
            ? 'Questionário de fit respondido novamente'
            : 'Questionário de fit respondido',
          description: previous
            ? `A candidatura ${action.applicationId} teve a resposta substituída. Aceite registrado na versão ${action.consentVersion}; a aderência é recalculada sobre a resposta nova.`
            : `A candidatura ${action.applicationId} respondeu os cinco eixos. Aceite de uso de dados registrado na versão ${action.consentVersion}.`,
          entityRef: action.applicationId
        })
      };
    }

    case 'create-clarification': {
      const id = nextSequentialId(
        'ESC',
        state.clarifications.map((clarification) => clarification.id)
      );
      const clarification: Clarification = {
        id,
        jobId: action.input.jobId,
        applicationId: action.input.applicationId,
        criterionId: action.input.criterionId,
        recipient: action.input.recipient,
        question: action.input.question,
        sharedInfo: action.input.sharedInfo,
        reason: action.input.reason,
        state: action.input.asDraft ? 'rascunho' : 'solicitada',
        createdAt: action.at,
        answeredAt: null,
        answer: null,
        preparedAnswer: action.input.preparedAnswer,
        effects: action.input.effects,
        incorporatedAt: null,
        teamConditionUpdate: action.input.teamConditionUpdate
      };

      return {
        ...state,
        clarifications: [...state.clarifications, clarification],
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: action.input.asDraft
            ? 'Esclarecimento em rascunho'
            : 'Esclarecimento solicitado',
          description: `${clarification.recipient.name}: “${clarification.question}”`,
          entityRef: id
        })
      };
    }

    case 'send-clarification': {
      const clarification = state.clarifications.find(
        (entry) => entry.id === action.clarificationId
      );
      if (!clarification || clarification.state !== 'rascunho') return state;

      return {
        ...state,
        clarifications: state.clarifications.map((entry) =>
          entry.id === action.clarificationId
            ? { ...entry, state: 'solicitada', createdAt: action.at }
            : entry
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Esclarecimento solicitado',
          description: `Solicitação ${action.clarificationId} enviada (envio simulado).`,
          entityRef: action.clarificationId
        })
      };
    }

    case 'answer-culture': {
      const answeredAt = action.at.slice(0, 10);
      const others = state.cultureAnswers.filter(
        (answer) =>
          !(
            answer.companyId === action.companyId &&
            answer.axisId === action.axisId &&
            answer.respondent === 'gestao'
          )
      );

      return {
        ...state,
        cultureAnswers: [
          ...others,
          {
            id: `CUL-GES-${action.companyId}-${action.axisId}`,
            companyId: action.companyId,
            axisId: action.axisId,
            optionId: action.optionId,
            respondent: 'gestao',
            count: 1,
            answeredAt
          }
        ],
        history: [
          {
            id: `HIST-${state.history.length + 1}-culture`,
            at: action.at,
            actor: 'Gestão da empresa',
            action: 'Traçado cultural respondido',
            description: `A empresa confirmou o traçado no eixo ${action.axisId}. A leitura passa a comparar esta resposta com a da equipe.`,
            entityRef: action.companyId
          },
          ...state.history
        ]
      };
    }

    case 'set-axis-weight': {
      const current = state.axisWeights?.[action.jobId] ?? {};
      if (current[action.axisId] === action.weight) return state;

      return {
        ...state,
        axisWeights: {
          ...state.axisWeights,
          [action.jobId]: { ...current, [action.axisId]: action.weight }
        },
        history: appendHistory(state, {
          at: action.at,
          actor: 'Empresa da vaga',
          action: 'Peso do eixo definido pela empresa',
          description: `O eixo "${getFitAxis(action.axisId).label}" passa a ter peso ${action.weight} na vaga ${action.jobId}. O peso ordena a leitura e a atenção; não produz nota.`,
          entityRef: action.jobId
        })
      };
    }

    case 'cancel-clarification': {
      const clarification = state.clarifications.find(
        (entry) => entry.id === action.clarificationId
      );
      if (!clarification || clarification.state === 'incorporada') return state;

      return {
        ...state,
        clarifications: state.clarifications.map((entry) =>
          entry.id === action.clarificationId
            ? { ...entry, state: 'cancelada' }
            : entry
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Esclarecimento cancelado',
          description: `Solicitação ${action.clarificationId} cancelada sem alterar a análise.`,
          entityRef: action.clarificationId
        })
      };
    }

    case 'answer-clarification': {
      const clarification = state.clarifications.find(
        (entry) => entry.id === action.clarificationId
      );
      if (!clarification || clarification.state !== 'solicitada') return state;

      const answer = action.declined
        ? 'A pessoa informou que não sabe ou não deseja responder.'
        : action.answer;

      return {
        ...state,
        clarifications: state.clarifications.map((entry) =>
          entry.id === action.clarificationId
            ? {
                ...entry,
                state: 'respondida',
                answer,
                answeredAt: action.at,
                // Sem resposta útil não há efeito sugerido: a lacuna continua.
                effects: action.declined ? [] : entry.effects
              }
            : entry
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: clarification.recipient.name,
          action: 'Esclarecimento respondido',
          description: action.declined
            ? `Resposta registrada como “não sei responder” para ${action.clarificationId}. A lacuna permanece.`
            : `Resposta registrada para ${action.clarificationId}.`,
          entityRef: action.clarificationId
        })
      };
    }

    case 'incorporate-clarification': {
      const clarification = state.clarifications.find(
        (entry) => entry.id === action.clarificationId
      );
      if (!clarification || clarification.state !== 'respondida') return state;

      const evidenceId = nextSequentialId(
        'EVD-RESP',
        state.evidences
          .filter((evidence) => evidence.id.startsWith('EVD-RESP'))
          .map((evidence) => evidence.id)
      );

      const answerEvidence: Evidence = {
        id: evidenceId,
        talentId: clarification.recipient.talentId,
        teamId: clarification.recipient.teamId,
        information: clarification.answer ?? '',
        sourceId: 'FONTE-IEL',
        originLabel: `Resposta de ${clarification.recipient.name} (${clarification.recipient.role})`,
        nature: 'resposta-de-esclarecimento',
        updatedAt: action.at.slice(0, 10),
        visibility: 'compartilhavel',
        links: action.decisions.map((decision) => ({
          jobId: clarification.jobId,
          criterionId: decision.criterionId
        })),
        interpretation:
          'Informação obtida em esclarecimento dirigido. Substitui a lacuna anterior sem apagar o histórico da conclusão.'
      };

      const analysis = { ...state.analysis };
      const previousStates: string[] = [];

      for (const decision of action.decisions) {
        const applicationAnalysis = {
          ...(analysis[decision.applicationId] ?? {})
        };
        const previous = applicationAnalysis[decision.criterionId];
        if (previous) {
          previousStates.push(
            `${decision.applicationId}/${decision.criterionId}: ${previous.state} → ${decision.state}`
          );
        }
        applicationAnalysis[decision.criterionId] = {
          state: decision.state,
          note: decision.note,
          evidenceIds: [...(previous?.evidenceIds ?? []), evidenceId],
          updatedBy: `Esclarecimento ${clarification.id} — ${clarification.recipient.name}`,
          updatedAt: action.at
        };
        analysis[decision.applicationId] = applicationAnalysis;
      }

      const teams = clarification.teamConditionUpdate
        ? state.teams.map((team) =>
            team.id === clarification.teamConditionUpdate?.teamId
              ? {
                  ...team,
                  conditions: team.conditions.map((condition) =>
                    condition.id ===
                    clarification.teamConditionUpdate?.conditionId
                      ? {
                          ...condition,
                          value: clarification.teamConditionUpdate.value,
                          status: 'confirmado' as const,
                          informed: true,
                          origin: `Confirmado por ${clarification.recipient.name}`,
                          updatedAt: action.at.slice(0, 10)
                        }
                      : condition
                  )
                }
              : team
          )
        : state.teams;

      const affectedApplications = new Set(
        action.decisions.map((decision) => decision.applicationId)
      );
      const applications = state.applications.map((application) =>
        affectedApplications.has(application.id) &&
        application.analysisStage === 'nao-iniciada'
          ? { ...application, analysisStage: 'em-andamento' as const }
          : application
      );

      return {
        ...state,
        analysis,
        teams,
        applications,
        evidences: [...state.evidences, answerEvidence],
        clarifications: state.clarifications.map((entry) =>
          entry.id === action.clarificationId
            ? { ...entry, state: 'incorporada', incorporatedAt: action.at }
            : entry
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Análise atualizada',
          description:
            previousStates.length > 0
              ? `Resposta de ${clarification.recipient.name} incorporada. ${previousStates.join('; ')}.`
              : `Resposta de ${clarification.recipient.name} incorporada sem alterar critérios.`,
          entityRef: action.clarificationId
        })
      };
    }

    case 'add-internal-note': {
      const evidenceId = nextSequentialId(
        'EVD-NOTA',
        state.evidences
          .filter((evidence) => evidence.id.startsWith('EVD-NOTA'))
          .map((evidence) => evidence.id)
      );

      const note: Evidence = {
        id: evidenceId,
        talentId: action.talentId,
        teamId: null,
        information: action.note,
        sourceId: 'FONTE-IEL',
        originLabel: 'Nota interna do analista IEL',
        nature: 'registro-iel',
        updatedAt: action.at.slice(0, 10),
        visibility: 'interno',
        links: [],
        interpretation:
          'Nota interna: não é compartilhada com a empresa nem entra no snapshot de encaminhamento.'
      };

      return {
        ...state,
        evidences: [...state.evidences, note],
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Nota interna registrada',
          description: `Nota interna adicionada ao perfil ${action.talentId} no contexto da vaga ${action.jobId}.`,
          entityRef: action.talentId
        })
      };
    }

    case 'register-referral': {
      const alreadyRegistered = state.referrals.find(
        (referral) =>
          referral.jobId === action.input.jobId &&
          referral.state === 'registrado'
      );

      const items: ReferralItem[] = action.input.items.map((item) => ({
        applicationId: item.applicationId,
        justification: item.justification,
        sharedEvidenceIds: item.sharedEvidenceIds,
        summary: item.summary,
        attentionPoints: item.attentionPoints,
        suggestedQuestions: item.suggestedQuestions,
        managerDecision: 'pendente',
        managerNote: null,
        decidedAt: null
      }));

      if (items.length === 0) return state;

      // O limite de 5 vale para a remessa, não só para a lista: registrar um
      // encaminhamento é o caminho que de fato entrega currículos à empresa,
      // e ele pode ser chamado sem passar pela lista. Contam também os já
      // encaminhados nesta vaga — a segunda remessa só vem depois da
      // devolutiva (R9).
      const alreadySent = alreadyRegistered
        ? alreadyRegistered.items.length
        : 0;
      const newItems = items.filter(
        (item) =>
          !alreadyRegistered?.items.some(
            (existing) => existing.applicationId === item.applicationId
          )
      );
      if (alreadySent + newItems.length > REFERRAL_LIMIT) {
        return {
          ...state,
          history: appendHistory(state, {
            at: action.at,
            actor: 'Analista IEL',
            action: 'Limite de 5 currículos por vaga',
            description: `O encaminhamento da vaga ${action.input.jobId} não foi registrado: seriam ${alreadySent + newItems.length} currículos e o limite é ${REFERRAL_LIMIT}.`,
            entityRef: action.input.jobId
          })
        };
      }

      const id = alreadyRegistered
        ? alreadyRegistered.id
        : nextSequentialId(
            'ENC',
            state.referrals.map((referral) => referral.id)
          );

      const referral: Referral = {
        id,
        jobId: action.input.jobId,
        companyId: action.input.companyId,
        message: action.input.message,
        state: 'registrado',
        createdAt: action.at,
        items: alreadyRegistered
          ? [
              // Não duplica candidatura já encaminhada: mantém a decisão existente.
              ...alreadyRegistered.items,
              ...items.filter(
                (item) =>
                  !alreadyRegistered.items.some(
                    (existing) => existing.applicationId === item.applicationId
                  )
              )
            ]
          : items
      };

      const referredIds = new Set(
        referral.items.map((item) => item.applicationId)
      );
      const applications = state.applications.map((application) =>
        referredIds.has(application.id)
          ? {
              ...application,
              referralStage:
                application.referralStage === 'na-lista' ||
                application.referralStage === 'nao-encaminhada'
                  ? ('encaminhada' as const)
                  : application.referralStage,
              analysisStage: 'pronta-para-encaminhar' as const
            }
          : application
      );

      const referralList = { ...state.referralList };
      delete referralList[action.input.jobId];

      return {
        ...state,
        applications,
        referralList,
        referrals: alreadyRegistered
          ? state.referrals.map((entry) => (entry.id === id ? referral : entry))
          : [...state.referrals, referral],
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Encaminhamento registrado',
          description: `${plural(referral.items.length, 'perfil compartilhado', 'perfis compartilhados')} com a empresa na vaga ${action.input.jobId}. Atualização externa não enviada — demonstração.`,
          entityRef: id
        })
      };
    }

    case 'manager-decision': {
      const referral = state.referrals.find(
        (entry) => entry.id === action.referralId
      );
      if (!referral) return state;

      const referrals = state.referrals.map((entry) =>
        entry.id === action.referralId
          ? {
              ...entry,
              items: entry.items.map((item) =>
                item.applicationId === action.applicationId
                  ? {
                      ...item,
                      managerDecision: action.decision,
                      managerNote: action.note || null,
                      decidedAt: action.at
                    }
                  : item
              )
            }
          : entry
      );

      const applications = updateApplication(state, action.applicationId, {
        referralStage:
          action.decision === 'quero-entrevistar'
            ? 'interesse-em-entrevista'
            : 'nao-avancou',
        externalStage:
          action.decision === 'quero-entrevistar'
            ? 'entrevista-empresa'
            : (state.applications.find(
                (application) => application.id === action.applicationId
              )?.externalStage ?? 'triagem')
      });

      const company = referral.companyId;

      return {
        ...state,
        referrals,
        applications,
        history: appendHistory(state, {
          at: action.at,
          actor: `Gestor da empresa ${company}`,
          action:
            action.decision === 'quero-entrevistar'
              ? 'Interesse em entrevista registrado'
              : 'Decisão de não avançar registrada',
          description:
            action.decision === 'quero-entrevistar'
              ? `A empresa quer entrevistar a candidatura ${action.applicationId}. Nenhuma reunião foi agendada nesta demonstração.`
              : `A empresa não vai avançar com a candidatura ${action.applicationId}. Justificativa: ${action.note || 'não informada'}.`,
          entityRef: action.applicationId
        })
      };
    }

    case 'manager-clarification-request': {
      const referral = state.referrals.find(
        (entry) => entry.id === action.referralId
      );
      if (!referral || action.question.trim().length === 0) return state;

      return {
        ...state,
        referrals: state.referrals.map((entry) =>
          entry.id === action.referralId
            ? {
                ...entry,
                items: entry.items.map((item) =>
                  item.applicationId === action.applicationId
                    ? {
                        ...item,
                        managerNote: `Pedido de esclarecimento da empresa: “${action.question.trim()}”`,
                        decidedAt: action.at
                      }
                    : item
                )
              }
            : entry
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: `Gestor da empresa ${referral.companyId}`,
          action: 'Esclarecimento pedido pela empresa',
          description: `Sobre a candidatura ${action.applicationId}: “${action.question.trim()}”. A candidatura segue encaminhada enquanto o IEL responde.`,
          entityRef: action.applicationId
        })
      };
    }

    case 'import-spreadsheet': {
      const imports = state.spreadsheetImports ?? [];
      const alreadyImported = imports.some(
        (entry) =>
          entry.jobId === action.jobId &&
          entry.fingerprint === action.plan.fingerprint
      );

      if (alreadyImported) {
        return {
          ...state,
          history: appendHistory(state, {
            at: action.at,
            actor: 'Analista IEL',
            action: 'Planilha recebida (sem mudanças)',
            description: `A mesma planilha da vaga ${action.jobId} já havia sido importada: nenhum registro foi duplicado.`,
            entityRef: action.jobId
          })
        };
      }

      const existingTalentIds = new Set(
        (state.importedTalents ?? []).map((talent) => talent.id)
      );
      const existingApplicationIds = new Set(
        state.applications.map((application) => application.id)
      );

      const addedTalents: Talent[] = [];
      const addedApplications: DemoState['applications'] = [];
      const updatedMatches = new Map<string, number | null>();

      for (const entry of action.plan.entries) {
        if (entry.talent && !existingTalentIds.has(entry.talent.id)) {
          existingTalentIds.add(entry.talent.id);
          addedTalents.push(entry.talent);
        }
        if (
          entry.application &&
          !existingApplicationIds.has(entry.application.id)
        ) {
          existingApplicationIds.add(entry.application.id);
          addedApplications.push(entry.application);
        }
        if (entry.decision === 'match-atualizado') {
          updatedMatches.set(entry.applicationId, entry.technicalMatch);
        }
      }

      const record: SpreadsheetImportRecord = {
        id: nextSequentialId(
          'IMP',
          imports.map((entry) => entry.id)
        ),
        jobId: action.jobId,
        fingerprint: action.plan.fingerprint,
        at: action.at,
        origin: action.plan.origin,
        sourceId: 'FONTE-EMPREGARE',
        counts: {
          newTalents: action.plan.counts['novo-talento'],
          newApplications:
            action.plan.counts['novo-talento'] +
            action.plan.counts['nova-candidatura'],
          updatedMatches: action.plan.counts['match-atualizado'],
          ignored: action.plan.counts.ignorada,
          errors: action.plan.errors.length
        }
      };

      return {
        ...state,
        importedTalents: [...(state.importedTalents ?? []), ...addedTalents],
        applications: [
          ...state.applications.map((application) =>
            updatedMatches.has(application.id)
              ? {
                  ...application,
                  technicalMatch: updatedMatches.get(application.id) ?? null
                }
              : application
          ),
          ...addedApplications
        ],
        spreadsheetImports: [...imports, record],
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Planilha da Empregare importada',
          description: `Vaga ${action.jobId}: ${record.counts.newTalents} ${plural(record.counts.newTalents, 'talento novo', 'talentos novos')}, ${record.counts.newApplications} ${plural(record.counts.newApplications, 'candidatura nova', 'candidaturas novas')}, ${record.counts.updatedMatches} com match técnico atualizado, ${record.counts.ignored} sem mudança e ${record.counts.errors} ${plural(record.counts.errors, 'linha com erro', 'linhas com erro')}.`,
          entityRef: action.jobId
        })
      };
    }

    case 'add-culture-invites': {
      const invites = state.cultureInvites ?? [];
      const known = new Set(
        invites
          .filter((invite) => invite.companyId === action.companyId)
          .map((invite) => normalizeEmail(invite.corporateEmail))
      );

      const created: CultureRespondentInvite[] = [];
      const companySuffix = action.companyId.replace(/[^A-Za-z0-9]/g, '');

      for (const person of action.people) {
        const corporateEmail = normalizeEmail(person.corporateEmail);
        if (corporateEmail.length === 0 || known.has(corporateEmail)) continue;
        known.add(corporateEmail);

        const id = nextSequentialId(
          `INV-${companySuffix}`,
          [...invites, ...created]
            .filter((invite) => invite.companyId === action.companyId)
            .map((invite) => invite.id)
        );
        const sentAt = action.at.slice(0, 10);

        created.push({
          id,
          companyId: action.companyId,
          corporateEmail,
          role: person.role,
          area: person.area.trim(),
          token: buildInviteToken(id, CULTURE_INVITE_TOKEN_SEED),
          sentAt,
          expiresAt: addDays(sentAt, CULTURE_INVITE_DEADLINE_DAYS),
          answeredAt: null,
          consentVersion: null,
          resendCount: 0
        });
      }

      if (created.length === 0) return state;

      return {
        ...state,
        cultureInvites: [...invites, ...created],
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Amostra de colaboradores convidada',
          description: `${created.length} ${plural(created.length, 'convite enviado', 'convites enviados')} na empresa ${action.companyId}, com prazo de ${CULTURE_INVITE_DEADLINE_DAYS} dias. Cada pessoa recebe um link próprio, sem login; o link não carrega nome nem e-mail.`,
          entityRef: action.companyId
        })
      };
    }

    case 'answer-culture-invite': {
      const invites = state.cultureInvites ?? [];
      const invite = invites.find((entry) => entry.token === action.token);
      if (!invite) return state;

      const answeredAt = action.at.slice(0, 10);

      if (invite.answeredAt) {
        return {
          ...state,
          history: appendHistory(state, {
            at: action.at,
            actor: 'Colaborador da empresa',
            action: 'Link de consulta já utilizado',
            description: `O convite ${invite.id} já havia sido respondido em ${invite.answeredAt}. Nada foi alterado: cada link vale uma resposta.`,
            entityRef: invite.companyId
          })
        };
      }

      if (answeredAt > invite.expiresAt) {
        return {
          ...state,
          history: appendHistory(state, {
            at: action.at,
            actor: 'Colaborador da empresa',
            action: 'Link de consulta expirado',
            description: `O convite ${invite.id} venceu em ${invite.expiresAt} e não aceita mais resposta. A analista pode reenviá-lo.`,
            entityRef: invite.companyId
          })
        };
      }

      const answers: CultureAnswer[] = Object.entries(action.answers).map(
        ([axisId, optionId]) => ({
          id: `CUL-INV-${invite.id}-${axisId}`,
          companyId: invite.companyId,
          axisId: axisId as FitAxisId,
          optionId,
          respondent: invite.role,
          count: 1,
          answeredAt,
          inviteId: invite.id
        })
      );

      const answeredIds = new Set(answers.map((answer) => answer.id));

      return {
        ...state,
        cultureAnswers: [
          ...state.cultureAnswers.filter(
            (answer) => !answeredIds.has(answer.id)
          ),
          ...answers
        ],
        cultureInvites: invites.map((entry) =>
          entry.id === invite.id
            ? {
                ...entry,
                answeredAt: action.at,
                consentVersion: action.consentVersion
              }
            : entry
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Colaborador da empresa',
          action: 'Consulta de cultura respondida',
          description: `Uma resposta entrou na consulta da empresa ${invite.companyId}, no papel "${invite.role}". Aceite registrado na versão ${action.consentVersion}. A resposta entra agregada: a empresa vê a média, nunca quem respondeu o quê.`,
          entityRef: invite.companyId
        })
      };
    }

    case 'resend-culture-invite': {
      const invites = state.cultureInvites ?? [];
      const invite = invites.find((entry) => entry.id === action.inviteId);
      if (!invite || invite.answeredAt) return state;

      const today = action.at.slice(0, 10);
      const base = today > invite.expiresAt ? today : invite.expiresAt;
      const expiresAt = addDays(base, CULTURE_INVITE_DEADLINE_DAYS);

      return {
        ...state,
        cultureInvites: invites.map((entry) =>
          entry.id === invite.id
            ? {
                ...entry,
                expiresAt,
                resendCount: entry.resendCount + 1
              }
            : entry
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Analista IEL',
          action: 'Convite reenviado',
          description: `O convite ${invite.id} foi reenviado e o prazo passou de ${invite.expiresAt} para ${expiresAt}. O link continua o mesmo.`,
          entityRef: invite.companyId
        })
      };
    }

    case 'apply-sync-event': {
      // Idempotência: receber o mesmo evento outra vez não altera a base.
      if (state.appliedSyncEventIds.includes(action.eventId)) {
        return {
          ...state,
          history: appendHistory(state, {
            at: action.at,
            actor: 'Empregare — demonstração',
            action: 'Atualização recebida (sem mudanças)',
            description: `Evento ${action.eventId} já havia sido aplicado: nenhum registro foi duplicado.`,
            entityRef: action.eventId
          })
        };
      }
      return {
        ...state,
        appliedSyncEventIds: [...state.appliedSyncEventIds, action.eventId]
      };
    }

    case 'set-source-status': {
      return {
        ...state,
        dataSources: state.dataSources.map((source) =>
          source.id === action.sourceId
            ? { ...source, status: action.status, lastError: action.error }
            : source
        ),
        history: appendHistory(state, {
          at: action.at,
          actor: 'Ambiente de demonstração',
          action:
            action.status === 'indisponivel'
              ? 'Falha de fonte simulada'
              : 'Fonte restabelecida',
          description:
            action.status === 'indisponivel'
              ? `A fonte ${action.sourceId} ficou indisponível. Os dados anteriores foram preservados e podem estar desatualizados.`
              : `A fonte ${action.sourceId} voltou a responder.`,
          entityRef: action.sourceId
        })
      };
    }

    default:
      return state;
  }
}

/**
 * Aplica o evento de atualização simulada sobre a base, sem duplicar registros.
 * Fica separado do reducer para deixar explícito o que a origem pode alterar.
 */
export function applySyncEventPayload(
  state: DemoState,
  event: {
    id: string;
    payload: { applicationId: string; externalStage: string };
  },
  at: string
): DemoState {
  if (state.appliedSyncEventIds.includes(event.id)) {
    return demoReducer(state, {
      type: 'apply-sync-event',
      eventId: event.id,
      at
    });
  }

  const applications = state.applications.map((application) =>
    application.id === event.payload.applicationId
      ? {
          ...application,
          externalStage: event.payload
            .externalStage as DemoState['applications'][number]['externalStage']
        }
      : application
  );

  const withPayload: DemoState = {
    ...state,
    applications,
    history: appendHistory(state, {
      at,
      actor: 'Empregare — demonstração',
      action: 'Atualização recebida',
      description: `Evento ${event.id} aplicado: candidatura ${event.payload.applicationId} atualizada para "${event.payload.externalStage}".`,
      entityRef: event.payload.applicationId
    })
  };

  return demoReducer(withPayload, {
    type: 'apply-sync-event',
    eventId: event.id,
    at
  });
}
