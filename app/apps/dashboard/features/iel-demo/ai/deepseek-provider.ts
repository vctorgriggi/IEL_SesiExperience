import {
  criarProvedorCompativel,
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODELO_PADRAO,
  DEEPSEEK_TIMEOUT_MS,
  type ConfigCompativel
} from './openai-compat-provider';
import type { AssistantProvider } from './provider';

/**
 * Provedor DeepSeek: uma instância do adaptador compatível com a OpenAI
 * (`openai-compat-provider.ts`), com a URL e o modelo dele e o raciocínio
 * desligado (`thinking: { type: 'disabled' }` — a resposta é curta e o custo
 * e a espera importam mais). Fica como alternativa ao Gemini, que é o
 * padrão recomendado desde 20/09/2026.
 */

export {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODELO_PADRAO,
  DEEPSEEK_TIMEOUT_MS
} from './openai-compat-provider';

export type DeepseekConfig = {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeoutMs?: number;
};

export function configDeepseek(config: DeepseekConfig): ConfigCompativel {
  return {
    id: 'deepseek',
    nome: 'DeepSeek',
    apiKey: config.apiKey,
    model: config.model ?? DEEPSEEK_MODELO_PADRAO,
    baseUrl: config.baseUrl ?? DEEPSEEK_BASE_URL,
    timeoutMs: config.timeoutMs ?? DEEPSEEK_TIMEOUT_MS,
    corpoExtra: { thinking: { type: 'disabled' } }
  };
}

export function createDeepseekProvider(
  config: DeepseekConfig
): AssistantProvider {
  return criarProvedorCompativel(configDeepseek(config));
}
