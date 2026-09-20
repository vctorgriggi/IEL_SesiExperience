import { ZodError } from 'zod';

import { deterministicProvider } from './deterministic-provider';
import {
  AVISO_DE_QUEDA,
  extrairJson,
  lerSaida,
  montarChamada
} from './model-prompt';
import type { AssistantProvider } from './provider';
import type {
  AssistantProviderId,
  AssistantRequest,
  AssistantResponse
} from './types';

/**
 * Provedor "compatível com a OpenAI", por `fetch` nativo, sem SDK.
 *
 * Gemini e DeepSeek expõem o mesmo formato (`POST {baseUrl}/chat/completions`,
 * `Authorization: Bearer`, `messages`, `response_format`), só mudam a URL, o
 * modelo e um ou outro campo extra do corpo. Este arquivo é o adaptador
 * genérico; `gemini-provider.ts` e `deepseek-provider.ts` são as instâncias.
 *
 * Gemini (documentação em ai.google.dev/gemini-api/docs/openai, conferida em
 * 20/09/2026, e o endpoint exercitado com chave real no mesmo dia):
 *
 * - `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
 *   com `Authorization: Bearer <GEMINI_API_KEY>`;
 * - `response_format: { type: 'json_object' }` funciona — o JSON volta em
 *   `choices[0].message.content`, às vezes dentro de cerca de código, o que
 *   `extrairJson` já trata;
 * - modelo padrão `gemini-3.6-flash`: `gemini-2.5-flash` respondeu 404
 *   ("no longer available to new users") e a própria API apontou o 3.6.
 *   Troque por `GEMINI_MODEL`;
 * - `reasoning_effort: 'none'` é obrigatório aqui: sem ele o modelo gasta o
 *   `max_tokens` inteiro pensando, devolve `finish_reason: 'length'` e
 *   `content` vazio. É campo padrão da OpenAI, não do DeepSeek;
 * - o Gemini rejeita campo desconhecido com 400 — por isso `thinking`
 *   (que é do DeepSeek) só vai no corpo do DeepSeek;
 * - erros vêm como HTTP 400, 401, 403, 404, 429, 500 e 503 ("high demand",
 *   frequente): só o 503 ganha uma segunda tentativa. O 429 do plano
 *   gratuito é cota **por dia por modelo** (20 pedidos, conferido em
 *   20/09/2026): para um pitch, ative o faturamento no AI Studio ou aponte
 *   `GEMINI_MODEL` para outro modelo, que tem cota própria;
 *
 * DeepSeek (api-docs.deepseek.com, conferida em 19/09/2026): mesmo formato,
 * `thinking: { type: 'disabled' }` para desligar o raciocínio, erros 400,
 * 401, 402 (sem saldo), 422, 429, 500 e 503.
 *
 * Qualquer falha — rede, timeout, status de erro, conteúdo vazio, JSON fora
 * do formato — cai para a regra fixa, com `AVISO_DE_QUEDA`. A demonstração
 * nunca trava por causa do modelo, e o modelo nunca decide: ele só recebe o
 * que a regra fixa já calculou, pseudonimizado (`pseudonimizar.ts`).
 */

export const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai';
export const GEMINI_MODELO_PADRAO = 'gemini-3.6-flash';
export const GEMINI_TIMEOUT_MS = 20_000;

export const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
export const DEEPSEEK_MODELO_PADRAO = 'deepseek-flash';
export const DEEPSEEK_TIMEOUT_MS = 20_000;

/** Só os provedores que falam este formato. */
export type ProvedorCompativelId = Extract<
  AssistantProviderId,
  'gemini' | 'deepseek'
>;

export type ConfigCompativel = {
  id: ProvedorCompativelId;
  /** Como o provedor aparece no log ("Gemini indisponível…"). */
  nome: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  /** Campos a mais no corpo, específicos do provedor (`thinking`, …). */
  corpoExtra?: Record<string, unknown>;
};

type RespostaCompativel = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

/**
 * Status em que vale uma segunda tentativa, na hora: 503 ("high demand")
 * costuma passar em segundos. 429 não entra: no plano gratuito do Gemini é
 * cota por dia por modelo (20 pedidos), e repetir só gasta mais cota.
 */
const STATUS_PASSAGEIRO = new Set([503]);

export type ChamadaJson = {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  signal: AbortSignal;
};

/**
 * Uma chamada de chat em modo JSON. Devolve o texto de `content` — a leitura
 * do JSON fica com quem chamou, porque cada uso tem o seu formato.
 */
export async function chamarChatJson(
  config: ConfigCompativel,
  chamada: ChamadaJson,
  tentativa = 1
): Promise<string> {
  const resposta = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: chamada.system },
        { role: 'user', content: chamada.user }
      ],
      response_format: { type: 'json_object' },
      temperature: chamada.temperature,
      max_tokens: chamada.maxTokens,
      stream: false,
      ...config.corpoExtra
    }),
    signal: chamada.signal
  });

  if (!resposta.ok) {
    if (STATUS_PASSAGEIRO.has(resposta.status) && tentativa === 1) {
      return chamarChatJson(config, chamada, 2);
    }
    throw new Error(`${config.nome} respondeu HTTP ${resposta.status}.`);
  }

  const corpo = (await resposta.json()) as RespostaCompativel;
  const conteudo = corpo.choices?.[0]?.message?.content;
  if (!conteudo?.trim()) {
    throw new Error(`${config.nome} devolveu conteúdo vazio.`);
  }
  return conteudo;
}

async function chamar(
  config: ConfigCompativel,
  request: AssistantRequest
): Promise<AssistantResponse> {
  const { system, user, pseudonimo } = montarChamada(request);

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), config.timeoutMs);
  try {
    const conteudo = await chamarChatJson(config, {
      system,
      user,
      temperature: 0.3,
      maxTokens: 1200,
      signal: controle.signal
    });
    return {
      ...lerSaida(request, extrairJson(conteudo), pseudonimo),
      provider: config.id,
      modelo: config.model,
      generatedAt: new Date().toISOString()
    };
  } finally {
    clearTimeout(relogio);
  }
}

/** Motivo curto para o log, sem nada do pedido nem da resposta. */
export function motivoDaFalha(erro: unknown, timeoutMs: number): string {
  if (erro instanceof ZodError || erro instanceof SyntaxError) {
    return 'saída do modelo fora do formato combinado.';
  }
  if (erro instanceof Error && erro.name === 'AbortError') {
    return `sem resposta em ${timeoutMs / 1000} s.`;
  }
  return erro instanceof Error ? erro.message : 'erro desconhecido.';
}

export function criarProvedorCompativel(
  config: ConfigCompativel
): AssistantProvider {
  return {
    id: config.id,
    async run(request) {
      try {
        return await chamar(config, request);
      } catch (erro) {
        // Só a mensagem técnica: nada do pedido vai para o log.
        console.warn(
          `[iel/assistant] ${config.nome} indisponível, caindo para a regra fixa:`,
          motivoDaFalha(erro, config.timeoutMs)
        );
        const fixa = await deterministicProvider.run(request);
        return { ...fixa, aviso: AVISO_DE_QUEDA };
      }
    }
  };
}
