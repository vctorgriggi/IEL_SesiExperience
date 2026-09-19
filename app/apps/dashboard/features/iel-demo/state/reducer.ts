import { buildInitialDemoState, COMPARISON_LIMIT } from '../fixtures';
import { plural } from '../format';
import type {
  Clarification,
  ClarificationEffect,
  CriterionState,
  DataSourceId,
  DemoState,
  DemoUiState,
  Evidence,
  HistoryEvent,
  Referral,
  ReferralItem
} from '../types';

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
      type: 'create-clarification';
      input: CreateClarificationInput;
      at: string;
    }
  | { type: 'send-clarification'; clarificationId: string; at: string }
  | { type: 'cancel-clarification'; clarificationId: string; at: string }
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
