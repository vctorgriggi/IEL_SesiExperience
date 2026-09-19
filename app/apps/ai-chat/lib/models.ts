import { z } from 'zod';

/**
 * Catálogo de modelos e providers. Roda no cliente também, então nada de SDK
 * aqui: a fábrica que instancia o modelo vive em `lib/providers.ts`.
 *
 * Novo provider: instale `@ai-sdk/<provider>`, adicione a entrada em
 * `CHAT_PROVIDERS` e a fábrica em `lib/providers.ts`, e liste os modelos em
 * `CHAT_MODEL_IDS` + `CHAT_MODEL_DEFINITIONS`.
 */
export const CHAT_PROVIDERS = {
  openai: { label: 'OpenAI', envKey: 'OPENAI_API_KEY' },
  anthropic: { label: 'Anthropic', envKey: 'ANTHROPIC_API_KEY' }
} as const;

export type ChatProvider = keyof typeof CHAT_PROVIDERS;

export function isChatProvider(value: string): value is ChatProvider {
  return Object.hasOwn(CHAT_PROVIDERS, value);
}

const CHAT_MODEL_IDS = [
  'gpt-4o',
  'gpt-4o-mini',
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-haiku-4-5'
] as const;

export type ChatModel = (typeof CHAT_MODEL_IDS)[number];

type ChatModelDefinition = {
  label: string;
  provider: ChatProvider;
};

export const CHAT_MODEL_DEFINITIONS: Record<ChatModel, ChatModelDefinition> = {
  'gpt-4o': { label: 'GPT-4o', provider: 'openai' },
  'gpt-4o-mini': { label: 'GPT-4o Mini', provider: 'openai' },
  'claude-opus-4-8': { label: 'Claude Opus 4.8', provider: 'anthropic' },
  'claude-sonnet-5': { label: 'Claude Sonnet 5', provider: 'anthropic' },
  'claude-haiku-4-5': { label: 'Claude Haiku 4.5', provider: 'anthropic' }
};

export const CHAT_MODELS: readonly ChatModel[] = CHAT_MODEL_IDS;

export const chatModelSchema = z.enum(CHAT_MODEL_IDS);

export const DEFAULT_CHAT_MODEL: ChatModel = 'gpt-4o-mini';

/** Ordem de preferência para tarefas auxiliares: do mais barato pro resto. */
export const TITLE_MODEL_PREFERENCE: readonly ChatModel[] = [
  'gpt-4o-mini',
  'claude-haiku-4-5'
];

export function parseChatModel(
  value: string | null | undefined
): ChatModel | null {
  if (!value) return null;
  return CHAT_MODELS.find((model) => model === value) ?? null;
}

export function modelLabel(model: ChatModel): string {
  return CHAT_MODEL_DEFINITIONS[model].label;
}

export function modelProvider(model: ChatModel): ChatProvider {
  return CHAT_MODEL_DEFINITIONS[model].provider;
}

export function modelsForProviders(
  providers: readonly ChatProvider[]
): readonly ChatModel[] {
  return CHAT_MODELS.filter((model) => providers.includes(modelProvider(model)));
}

/** `null` quando nenhum provider foi configurado. */
export function resolveDefaultModel(
  available: readonly ChatModel[]
): ChatModel | null {
  if (available.includes(DEFAULT_CHAT_MODEL)) return DEFAULT_CHAT_MODEL;
  return available[0] ?? null;
}
