import 'server-only';

import { env } from '@/env';
import Anthropic from '@anthropic-ai/sdk';

import { configDeepseek } from './deepseek-provider';
import { configGemini } from './gemini-provider';
import {
  chamarChatJson,
  type ConfigCompativel
} from './openai-compat-provider';

/**
 * O caminho comum dos polimentos (devolutiva pessoal e mensagem ao
 * candidato): escolhe o provedor pelo ambiente, faz **uma** chamada em modo
 * JSON com timeout curto e devolve o texto. Quem chama valida com Zod e
 * descarta o que não serve — aqui não se decide nada, só se transporta.
 *
 * Provedores, na ordem em que o ambiente é lido:
 * - `gemini` + `GEMINI_API_KEY` (padrão recomendado) e `deepseek` +
 *   `DEEPSEEK_API_KEY`, pelo adaptador compatível com a OpenAI;
 * - `anthropic` + `ANTHROPIC_API_KEY`, pelo SDK.
 *
 * O que sai já chegou pseudonimizado de quem montou o pedido
 * (`pseudonimizar.ts`); esta função não vê a pessoa.
 */

/** Modelo da Anthropic usado nos polimentos (o mesmo do Mind). */
const ANTHROPIC_MODEL = 'claude-sonnet-5';

/** A configuração do provedor compatível escolhido no ambiente, se houver. */
export function configCompativelDoAmbiente(): ConfigCompativel | null {
  if (env.IEL_AI_PROVIDER === 'gemini' && env.GEMINI_API_KEY) {
    return configGemini({
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL
    });
  }
  if (env.IEL_AI_PROVIDER === 'deepseek' && env.DEEPSEEK_API_KEY) {
    return configDeepseek({
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL
    });
  }
  return null;
}

/** Há provedor e chave? Sem os dois, nem tenta: a regra fixa é a resposta. */
export function polimentoDisponivel(): boolean {
  return (
    configCompativelDoAmbiente() !== null ||
    (env.IEL_AI_PROVIDER === 'anthropic' && Boolean(env.ANTHROPIC_API_KEY))
  );
}

export type PedidoJson = {
  system: string;
  user: string;
  maxTokens: number;
  timeoutMs: number;
  temperature?: number;
};

async function chamarAnthropic(
  pedido: PedidoJson,
  signal: AbortSignal
): Promise<string> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const message = await client.messages.create(
    {
      model: ANTHROPIC_MODEL,
      max_tokens: pedido.maxTokens,
      system: pedido.system,
      messages: [{ role: 'user', content: pedido.user }]
    },
    { signal }
  );
  const bloco = message.content.find((block) => block.type === 'text');
  if (!bloco || bloco.type !== 'text') {
    throw new Error('Resposta do modelo sem bloco de texto.');
  }
  return bloco.text;
}

/**
 * Uma chamada, um texto. Lança em qualquer falha (sem provedor, rede,
 * timeout, status de erro, conteúdo vazio) — quem chama pega e fica com a
 * regra fixa, em silêncio.
 */
export async function chamarModeloJson(pedido: PedidoJson): Promise<string> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), pedido.timeoutMs);
  try {
    const compativel = configCompativelDoAmbiente();
    if (compativel) {
      return await chamarChatJson(compativel, {
        system: pedido.system,
        user: pedido.user,
        temperature: pedido.temperature ?? 0.4,
        maxTokens: pedido.maxTokens,
        signal: controle.signal
      });
    }
    if (env.IEL_AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
      return await chamarAnthropic(pedido, controle.signal);
    }
    throw new Error('Nenhum provedor de IA configurado.');
  } finally {
    clearTimeout(relogio);
  }
}
