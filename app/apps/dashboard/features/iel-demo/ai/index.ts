import 'server-only';

import { env } from '@/env';

import { anthropicProvider } from './anthropic-provider';
import { deterministicProvider } from './deterministic-provider';
import type { AssistantProvider } from './provider';

export type { AssistantProvider } from './provider';
export * from './types';

/**
 * Escolhe o provider de análise assistida pelo ambiente.
 *
 * O briefing exige que a experiência principal nunca dependa de chave de API:
 * sem `IEL_AI_PROVIDER=anthropic` e `ANTHROPIC_API_KEY`, a demonstração
 * continua no modo determinístico, e esta função nunca lança por falta de
 * configuração — ela apenas escolhe o provider seguro para o ambiente atual.
 */
export function getAssistantProvider(): AssistantProvider {
  if (env.IEL_AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
    return anthropicProvider;
  }
  return deterministicProvider;
}
