import { ZodError } from 'zod';

import { deterministicProvider } from './deterministic-provider';
import {
  AVISO_DE_QUEDA,
  extrairJson,
  lerSaida,
  montarChamada
} from './model-prompt';
import type { AssistantProvider } from './provider';
import type { AssistantRequest, AssistantResponse } from './types';

/**
 * Provedor DeepSeek, por `fetch` nativo, sem SDK.
 *
 * A API é compatível com o formato da OpenAI (`POST /chat/completions`,
 * documentação conferida em api-docs.deepseek.com em 19/09/2026):
 *
 * - modelos atuais: `deepseek-flash` (padrão aqui, o mais barato) e
 *   `deepseek-v4-pro`; troque por `DEEPSEEK_MODEL`;
 * - `response_format: { type: 'json_object' }` exige a palavra "json" no
 *   prompt e um exemplo do formato — os dois estão em `SYSTEM_PROMPT`;
 * - o modo de raciocínio vem ligado por padrão; aqui vai desligado
 *   (`thinking: { type: 'disabled' }`), porque a resposta é curta e o custo
 *   e a espera importam mais;
 * - erros vêm como HTTP 400, 401, 402 (sem saldo), 422, 429, 500 e 503, e a
 *   API às vezes devolve `content` vazio no modo JSON.
 *
 * Qualquer falha — rede, timeout, status de erro, conteúdo vazio, JSON fora
 * do formato — cai para a regra fixa, com `AVISO_DE_QUEDA`. A demonstração
 * nunca trava por causa do modelo, e o modelo nunca decide: ele só recebe o
 * que a regra fixa já calculou, pseudonimizado (`pseudonimizar.ts`).
 */

export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
export const DEEPSEEK_MODELO_PADRAO = 'deepseek-flash';
export const DEEPSEEK_TIMEOUT_MS = 20_000;

export type DeepseekConfig = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
};

type DeepseekResposta = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

async function chamar(
  config: Required<DeepseekConfig>,
  request: AssistantRequest
): Promise<AssistantResponse> {
  const { system, user, pseudonimo } = montarChamada(request);

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), config.timeoutMs);
  try {
    const resposta = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        response_format: { type: 'json_object' },
        thinking: { type: 'disabled' },
        temperature: 0.3,
        max_tokens: 1200,
        stream: false
      }),
      signal: controle.signal
    });

    if (!resposta.ok) {
      throw new Error(`DeepSeek respondeu HTTP ${resposta.status}.`);
    }

    const corpo = (await resposta.json()) as DeepseekResposta;
    const conteudo = corpo.choices?.[0]?.message?.content;
    if (!conteudo?.trim()) {
      throw new Error('DeepSeek devolveu conteúdo vazio.');
    }

    return {
      ...lerSaida(request, extrairJson(conteudo), pseudonimo),
      provider: 'deepseek',
      modelo: config.model,
      generatedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(relogio);
  }
}

/** Motivo curto para o log, sem nada do pedido nem da resposta. */
function motivo(erro: unknown, timeoutMs: number): string {
  if (erro instanceof ZodError || erro instanceof SyntaxError) {
    return 'saída do modelo fora do formato combinado.';
  }
  if (erro instanceof Error && erro.name === 'AbortError') {
    return `sem resposta em ${timeoutMs / 1000} s.`;
  }
  return erro instanceof Error ? erro.message : 'erro desconhecido.';
}

export function createDeepseekProvider(
  config: DeepseekConfig
): AssistantProvider {
  const completo: Required<DeepseekConfig> = {
    apiKey: config.apiKey,
    model: config.model ?? DEEPSEEK_MODELO_PADRAO,
    baseUrl: config.baseUrl ?? DEEPSEEK_BASE_URL,
    timeoutMs: config.timeoutMs ?? DEEPSEEK_TIMEOUT_MS
  };

  return {
    id: 'deepseek',
    async run(request) {
      try {
        return await chamar(completo, request);
      } catch (erro) {
        // Só a mensagem técnica: nada do pedido vai para o log.
        console.warn(
          '[iel/assistant] DeepSeek indisponível, caindo para a regra fixa:',
          motivo(erro, completo.timeoutMs)
        );
        const fixa = await deterministicProvider.run(request);
        return { ...fixa, aviso: AVISO_DE_QUEDA };
      }
    }
  };
}
