import {
  compareSelection,
  missingInformation,
  summarizeSelection,
  type AssistantAnswer
} from '../analysis/assistant';
import { ANALYST_PERSONA_ID, DEMO_SCHEMA_VERSION } from '../fixtures';
import { getJob } from '../state/selectors';
import type { DemoState } from '../types';
import { temasDoCandidato } from './model-prompt';
import type { AssistantProvider } from './provider';
import type {
  AssistantKind,
  AssistantRequest,
  AssistantResponse,
  LeituraDaPessoa
} from './types';

/**
 * Provider padrão do protótipo: nenhum modelo é consultado.
 *
 * Envolve as três funções já existentes em `analysis/assistant.ts` — a lógica
 * de montagem de texto não é reescrita aqui, só adaptada ao contrato comum
 * dos providers. O briefing exige que a experiência principal funcione sem
 * chave de API; este é o provider que garante isso.
 */

type KindComTexto = Exclude<AssistantKind, 'leitura-da-pessoa'>;

const ANSWER_BY_KIND: Record<
  KindComTexto,
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

/**
 * Leitura da pessoa pela regra fixa: os temas vêm do contexto (o mesmo % que
 * a tela mostra), e as duas perguntas são um modelo de frase sobre os temas
 * em que empresa e pessoa mais divergem.
 */
function leituraPelaRegra(request: AssistantRequest): AssistantResponse {
  const applicationId = request.applicationIds[0];
  const candidato = request.contexto?.candidatos?.find(
    (entry) => entry.applicationId === applicationId
  );
  const temas = candidato
    ? temasDoCandidato(candidato)
    : { combina: [], difere: [] };

  const temasMaisDistantes = (candidato?.temas ?? [])
    .filter(
      (tema): tema is { tema: string; combina: number } => tema.combina !== null
    )
    .sort((a, b) => a.combina - b.combina)
    .map((tema) => tema.tema);

  const leitura: LeituraDaPessoa = {
    ondeCombina: temas.combina.slice(0, 3),
    ondeConversar: temas.difere.slice(0, 3),
    // As perguntas vão para os temas de maior distância, mesmo quando
    // nenhum passa do limite de "vale uma conversa".
    perguntas: temasMaisDistantes
      .slice(0, 2)
      .map(
        (tema) =>
          `Me conta uma situação de trabalho em que "${tema}" fez diferença para você. Como foi?`
      )
  };

  const paragrafos = candidato
    ? [
        leitura.ondeCombina.length > 0
          ? `Onde combina: ${leitura.ondeCombina.join(', ')}.`
          : 'Nenhum tema com combinação alta.',
        leitura.ondeConversar.length > 0
          ? `Onde vale uma conversa: ${leitura.ondeConversar.join(', ')}.`
          : 'Nenhum tema com diferença grande.'
      ]
    : ['Sem os temas desta pessoa no pedido, não há leitura para montar.'];

  return {
    text: ['Leitura da pessoa', ...paragrafos].join('\n\n'),
    citations: [],
    provider: 'deterministic',
    leitura,
    generatedAt: new Date().toISOString()
  };
}

export const deterministicProvider: AssistantProvider = {
  id: 'deterministic',
  async run(request: AssistantRequest): Promise<AssistantResponse> {
    if (request.kind === 'leitura-da-pessoa') return leituraPelaRegra(request);
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
