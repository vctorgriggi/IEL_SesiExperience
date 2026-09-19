import 'server-only';

import { env } from '@/env';
import Anthropic from '@anthropic-ai/sdk';

import { CRITERION_STATE_META } from '../analysis/criterion-states';
import { ALL_TALENTS } from '../fixtures';
import { getJob } from '../state/selectors';
import type { CriterionState, Dimension } from '../types';
import { deterministicProvider } from './deterministic-provider';
import type { AssistantProvider } from './provider';
import {
  modelAssistantOutputSchema,
  type AssistantKind,
  type AssistantRequest,
  type AssistantResponse
} from './types';

/** Modelo padrão para a análise assistida real (protótipo). */
const ANTHROPIC_MODEL = 'claude-sonnet-5';

const KIND_INSTRUCTION: Record<AssistantKind, string> = {
  'resumir-selecao':
    'Resuma a seleção atual, candidatura por candidatura, dizendo o que há de evidência para cada critério e o que ainda falta.',
  'comparar-selecionados':
    'Compare as candidaturas selecionadas critério a critério, nas três dimensões (técnica, profissional, organizacional), apontando convergências e divergências de dados — nunca uma nota ou uma ordem de preferência entre as pessoas.',
  'mostrar-lacunas':
    'Liste o que falta esclarecer em cada candidatura selecionada: critérios sem informação, a esclarecer ou em divergência.'
};

const SYSTEM_PROMPT = `Você é o assistente de análise da Central de Seleção IEL, um protótipo de demonstração.

Regras que não podem ser quebradas:
- Responda apenas com base nos registros e evidências enviados nesta mensagem. Nunca use conhecimento externo sobre pessoas, empresas ou vagas reais — esta é uma base fictícia.
- Cite os "evidenceId" das evidências que sustentam cada afirmação. Uma afirmação sem evidência correspondente não deve ser feita.
- "Sem informação" é um estado válido e deve ser dito como tal. Nunca invente ou deduza informação que não está nos registros.
- Nunca produza nota, percentual, pontuação de fit ou qualquer ranking entre as pessoas. A análise compara critério a critério, não elege a melhor candidatura.
- Escreva em português do Brasil, com tom sóbrio de analista — descritivo, não promocional.
- Responda estritamente em JSON, sem texto fora do JSON e sem blocos de código, no formato: {"text": string, "citations": [{"evidenceId": string, "label": string}]}. "label" é uma descrição curta da origem da evidência (ex.: "Currículo — experiência anterior").`;

type AssistantEvidenceContext = {
  evidenceId: string;
  information: string;
  originLabel: string;
  nature: string;
};

type AssistantCriterionContext = {
  criterionId: string;
  label: string;
  dimension: Dimension;
  required: boolean;
  state: CriterionState;
  stateLabel: string;
  note: string;
  evidenceIds: string[];
};

type AssistantApplicationContext = {
  applicationId: string;
  talentName: string;
  criteria: AssistantCriterionContext[];
};

function buildTalentName(talentId: string): string {
  return ALL_TALENTS.find((talent) => talent.id === talentId)?.name ?? talentId;
}

function buildApplicationContext(
  request: AssistantRequest,
  applicationId: string
): AssistantApplicationContext | null {
  const application = request.applications.find(
    (entry) => entry.id === applicationId
  );
  if (!application) return null;

  const job = getJob(request.jobId);
  const criteriaAnalysis = request.analysis[applicationId] ?? {};

  const criteria: AssistantCriterionContext[] = (job?.criteria ?? [])
    .map((criterion) => {
      const analysis = criteriaAnalysis[criterion.id];
      if (!analysis) return null;
      return {
        criterionId: criterion.id,
        label: criterion.label,
        dimension: criterion.dimension,
        required: criterion.required,
        state: analysis.state,
        stateLabel: CRITERION_STATE_META[analysis.state].label,
        note: analysis.note,
        evidenceIds: analysis.evidenceIds
      };
    })
    .filter((entry): entry is AssistantCriterionContext => entry !== null);

  return {
    applicationId,
    talentName: buildTalentName(application.talentId),
    criteria
  };
}

function buildEvidenceContext(
  request: AssistantRequest
): AssistantEvidenceContext[] {
  return request.evidences.map((evidence) => ({
    evidenceId: evidence.id,
    information: evidence.information,
    originLabel: evidence.originLabel,
    nature: evidence.nature
  }));
}

function buildUserMessage(request: AssistantRequest): string {
  const job = getJob(request.jobId);
  const applications = request.applicationIds
    .map((applicationId) => buildApplicationContext(request, applicationId))
    .filter((entry): entry is AssistantApplicationContext => entry !== null);

  const payload = {
    operacao: KIND_INSTRUCTION[request.kind],
    vaga: job ? { id: job.id, titulo: job.title } : { id: request.jobId },
    candidaturasSelecionadas: applications,
    evidenciasDisponiveis: buildEvidenceContext(request)
  };

  return `Dados da seleção (JSON):\n${JSON.stringify(payload, null, 2)}\n\nResponda no formato JSON descrito nas instruções.`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(withoutFence);
}

async function runWithModel(
  request: AssistantRequest
): Promise<AssistantResponse> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(request) }]
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Resposta do modelo sem bloco de texto.');
  }

  const parsed = modelAssistantOutputSchema.parse(extractJson(textBlock.text));

  return {
    text: parsed.text,
    citations: parsed.citations,
    provider: 'anthropic',
    generatedAt: new Date().toISOString()
  };
}

/**
 * Provider real: consulta o modelo e cai para o determinístico em qualquer
 * falha (erro de rede, chave inválida, JSON fora do formato esperado). A
 * demonstração nunca deve travar por causa do provider de IA.
 */
export const anthropicProvider: AssistantProvider = {
  id: 'anthropic',
  async run(request: AssistantRequest): Promise<AssistantResponse> {
    try {
      return await runWithModel(request);
    } catch {
      return deterministicProvider.run(request);
    }
  }
};
