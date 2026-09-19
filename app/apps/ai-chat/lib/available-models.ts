import 'server-only';

import { env } from '~/env';
import {
  CHAT_PROVIDERS,
  isChatProvider,
  modelProvider,
  modelsForProviders,
  resolveDefaultModel,
  TITLE_MODEL_PREFERENCE,
  type ChatModel,
  type ChatProvider
} from './models';

function isProviderConfigured(provider: ChatProvider): boolean {
  switch (provider) {
    case 'openai':
      return Boolean(env.OPENAI_API_KEY);
    case 'anthropic':
      return Boolean(env.ANTHROPIC_API_KEY);
  }
}

export function getConfiguredProviders(): readonly ChatProvider[] {
  return Object.keys(CHAT_PROVIDERS)
    .filter(isChatProvider)
    .filter(isProviderConfigured);
}

export function getAvailableModels(): readonly ChatModel[] {
  return modelsForProviders(getConfiguredProviders());
}

export function isModelAvailable(model: ChatModel): boolean {
  return isProviderConfigured(modelProvider(model));
}

/** Lança quando nenhum provider foi configurado: sem isso o app não funciona. */
export function getDefaultChatModel(): ChatModel {
  const model = resolveDefaultModel(getAvailableModels());

  if (!model) {
    const envKeys = Object.values(CHAT_PROVIDERS)
      .map((provider) => provider.envKey)
      .join(' ou ');
    throw new Error(
      `Nenhum provider de IA configurado. Defina ${envKeys} no ambiente do app ai-chat.`
    );
  }

  return model;
}

/** Modelo barato para tarefas auxiliares, como gerar título. */
export function getTitleModel(): ChatModel | null {
  const available = getAvailableModels();
  return (
    TITLE_MODEL_PREFERENCE.find((model) => available.includes(model)) ??
    available[0] ??
    null
  );
}
