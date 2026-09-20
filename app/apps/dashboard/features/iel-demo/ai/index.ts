import 'server-only';

import { env } from '@/env';

import { anthropicProvider } from './anthropic-provider';
import { createDeepseekProvider } from './deepseek-provider';
import { deterministicProvider } from './deterministic-provider';
import type { AssistantProvider } from './provider';

export type { AssistantProvider } from './provider';
export * from './types';
// A devolutiva pessoal do fim dos questionários, polida pelo Mind quando há chave.
export { leituraPessoalComMind } from './leitura-pessoal';
// A mensagem de WhatsApp ao candidato, por etapa, polida pelo Mind quando há chave.
export { mensagemComMind } from './mensagens';

/**
 * Escolhe o provider de análise assistida pelo ambiente.
 *
 * O briefing exige que a experiência principal nunca dependa de chave de API:
 * sem `IEL_AI_PROVIDER` e a chave do provedor escolhido, a demonstração
 * continua no modo determinístico, e esta função nunca lança por falta de
 * configuração — ela apenas escolhe o provider seguro para o ambiente atual.
 *
 * - `IEL_AI_PROVIDER=deepseek` + `DEEPSEEK_API_KEY` → DeepSeek
 *   (`DEEPSEEK_MODEL` opcional, padrão `deepseek-flash`);
 * - `IEL_AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` → Claude.
 *
 * Em qualquer caso, a aderência, o ranking e o corte continuam na regra
 * fixa (R7): o modelo só conta em palavras o que ela já calculou.
 */
export function getAssistantProvider(): AssistantProvider {
  if (env.IEL_AI_PROVIDER === 'deepseek' && env.DEEPSEEK_API_KEY) {
    return createDeepseekProvider({
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL
    });
  }
  if (env.IEL_AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
    return anthropicProvider;
  }
  return deterministicProvider;
}
