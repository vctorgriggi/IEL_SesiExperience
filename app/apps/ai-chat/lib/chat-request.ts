import type { UIMessage } from 'ai';
import { z } from 'zod';

import { chatModelSchema } from './models';

const ROLES = ['user', 'assistant'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUIMessage(value: unknown) {
  if (!isObject(value)) return false;
  if (typeof value.id !== 'string') return false;
  if (typeof value.role !== 'string' || !ROLES.includes(value.role)) {
    return false;
  }
  return Array.isArray(value.parts) && value.parts.every(isObject);
}

export const chatBodySchema = z.object({
  messages: z.array(
    z.custom<UIMessage>(isUIMessage, {
      message: 'Mensagem em formato inválido'
    })
  ),
  model: chatModelSchema.optional(),
  conversationId: z.string().uuid().optional(),
  regenerate: z.boolean().optional()
});

export type ChatBody = z.infer<typeof chatBodySchema>;

export function textOf(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) =>
      'text' in part && typeof part.text === 'string' ? part.text : ''
    )
    .join('')
    .trim();
}
