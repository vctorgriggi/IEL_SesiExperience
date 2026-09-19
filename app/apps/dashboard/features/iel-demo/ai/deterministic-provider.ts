import {
  compareSelection,
  missingInformation,
  summarizeSelection,
  type AssistantAnswer
} from '../analysis/assistant';
import { ANALYST_PERSONA_ID, DEMO_SCHEMA_VERSION } from '../fixtures';
import { getJob } from '../state/selectors';
import type { DemoState } from '../types';
import type { AssistantProvider } from './provider';
import type {
  AssistantKind,
  AssistantRequest,
  AssistantResponse
} from './types';

/**
 * Provider padrão do protótipo: nenhum modelo é consultado.
 *
 * Envolve as três funções já existentes em `analysis/assistant.ts` — a lógica
 * de montagem de texto não é reescrita aqui, só adaptada ao contrato comum
 * dos providers. O briefing exige que a experiência principal funcione sem
 * chave de API; este é o provider que garante isso.
 */

const ANSWER_BY_KIND: Record<
  AssistantKind,
  (
    state: DemoState,
    job: ReturnType<typeof getJob>,
    applicationIds: string[]
  ) => AssistantAnswer
> = {
  'resumir-selecao': (state, job, applicationIds) =>
    job
      ? summarizeSelection(state, job, applicationIds)
      : emptyAnswer('Resumo da seleção'),
  'comparar-selecionados': (state, job, applicationIds) =>
    job
      ? compareSelection(state, job, applicationIds)
      : emptyAnswer('Comparação dos selecionados'),
  'mostrar-lacunas': (state, job, applicationIds) =>
    job
      ? missingInformation(state, job, applicationIds)
      : emptyAnswer('O que falta esclarecer')
};

function emptyAnswer(title: string): AssistantAnswer {
  return {
    title,
    paragraphs: ['Vaga não encontrada na base de demonstração.'],
    usedRecords: [],
    disclaimer:
      'Texto montado a partir dos registros selecionados nesta base de demonstração. Nenhum modelo de linguagem foi consultado e nenhuma informação foi inventada.'
  };
}

/**
 * Reconstrói só o recorte de `DemoState` que `analysis/assistant.ts` de fato
 * lê (`applications`, `analysis`). Os demais campos recebem valores neutros:
 * nenhuma das três operações do assistente os consulta.
 */
function buildPartialDemoState(request: AssistantRequest): DemoState {
  return {
    schemaVersion: DEMO_SCHEMA_VERSION,
    personaId: ANALYST_PERSONA_ID,
    dataSources: [],
    applications: request.applications,
    analysis: request.analysis,
    evidences: request.evidences,
    teams: [],
    cultureAnswers: [],
    clarifications: [],
    referrals: [],
    history: [],
    appliedSyncEventIds: [],
    comparison: {},
    referralList: {},
    ui: {
      jobsSearch: '',
      jobsCompanyId: 'todas',
      jobsStage: 'todas',
      overviewCompanyId: 'todas'
    }
  };
}

function findEvidenceLabel(
  request: AssistantRequest,
  evidenceId: string
): string {
  const evidence = request.evidences.find((entry) => entry.id === evidenceId);
  return evidence?.originLabel ?? evidenceId;
}

function toResponse(
  request: AssistantRequest,
  answer: AssistantAnswer
): AssistantResponse {
  return {
    text: [answer.title, ...answer.paragraphs].join('\n\n'),
    citations: answer.usedRecords.map((evidenceId) => ({
      evidenceId,
      label: findEvidenceLabel(request, evidenceId)
    })),
    provider: 'deterministic',
    generatedAt: new Date().toISOString()
  };
}

export const deterministicProvider: AssistantProvider = {
  id: 'deterministic',
  async run(request: AssistantRequest): Promise<AssistantResponse> {
    const job = getJob(request.jobId);
    const state = buildPartialDemoState(request);
    const answer = ANSWER_BY_KIND[request.kind](
      state,
      job,
      request.applicationIds
    );
    return toResponse(request, answer);
  }
};
