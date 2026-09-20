import {
  criarProvedorCompativel,
  GEMINI_BASE_URL,
  GEMINI_MODELO_PADRAO,
  GEMINI_TIMEOUT_MS,
  type ConfigCompativel
} from './openai-compat-provider';
import type { AssistantProvider } from './provider';

/**
 * Provedor Gemini (Google): uma instância do adaptador compatível com a
 * OpenAI (`openai-compat-provider.ts`), com a URL e o modelo do Gemini.
 * É o padrão recomendado desde 20/09/2026.
 *
 * `reasoning_effort: 'none'` desliga o raciocínio: sem isso o modelo gasta
 * o `max_tokens` pensando e devolve `content` vazio (visto com chave real).
 * Nada de `thinking` aqui — o Gemini rejeita campo desconhecido com 400.
 */

export {
  GEMINI_BASE_URL,
  GEMINI_MODELO_PADRAO,
  GEMINI_TIMEOUT_MS
} from './openai-compat-provider';

export type GeminiConfig = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
};

export function configGemini(config: GeminiConfig): ConfigCompativel {
  return {
    id: 'gemini',
    nome: 'Gemini',
    apiKey: config.apiKey,
    model: config.model ?? GEMINI_MODELO_PADRAO,
    baseUrl: config.baseUrl ?? GEMINI_BASE_URL,
    timeoutMs: config.timeoutMs ?? GEMINI_TIMEOUT_MS,
    corpoExtra: { reasoning_effort: 'none' }
  };
}

export function createGeminiProvider(config: GeminiConfig): AssistantProvider {
  return criarProvedorCompativel(configGemini(config));
}
