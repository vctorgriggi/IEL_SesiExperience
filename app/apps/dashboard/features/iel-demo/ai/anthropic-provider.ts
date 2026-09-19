import 'server-only';

import { env } from '@/env';
import Anthropic from '@anthropic-ai/sdk';

import { deterministicProvider } from './deterministic-provider';
import {
  AVISO_DE_QUEDA,
  extrairJson,
  lerSaida,
  montarChamada
} from './model-prompt';
import type { AssistantProvider } from './provider';
import type { AssistantRequest, AssistantResponse } from './types';

/** Modelo padrão para a análise assistida real (protótipo). */
const ANTHROPIC_MODEL = 'claude-sonnet-5';

/**
 * Pedido e leitura da resposta ficam em `model-prompt.ts`, os mesmos do
 * DeepSeek: o que sai para a Anthropic também passa pela pseudonimização
 * (`pseudonimizar.ts`) — nenhum nome, contato, cidade ou id da base.
 */
async function runWithModel(
  request: AssistantRequest
): Promise<AssistantResponse> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const { system, user, pseudonimo } = montarChamada(request);

  const message = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }]
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Resposta do modelo sem bloco de texto.');
  }

  return {
    ...lerSaida(request, extrairJson(textBlock.text), pseudonimo),
    provider: 'anthropic',
    modelo: ANTHROPIC_MODEL,
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
      const fixa = await deterministicProvider.run(request);
      return { ...fixa, aviso: AVISO_DE_QUEDA };
    }
  }
};
