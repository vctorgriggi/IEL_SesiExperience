import 'server-only';

import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';

import { modelProvider, type ChatModel, type ChatProvider } from './models';

/**
 * Fábricas dos providers. Isolado do catálogo (`lib/models.ts`) porque aqui
 * entram os SDKs, que não podem ir pro bundle do cliente.
 *
 * Novo provider: instale `@ai-sdk/<provider>` e adicione a entrada aqui e em
 * `CHAT_PROVIDERS`/`CHAT_MODEL_DEFINITIONS` no catálogo.
 */
const MODEL_FACTORIES: Record<ChatProvider, (id: string) => LanguageModel> = {
  openai: (id) => openai(id),
  anthropic: (id) => anthropic(id)
};

export function createChatModel(model: ChatModel): LanguageModel {
  return MODEL_FACTORIES[modelProvider(model)](model);
}
