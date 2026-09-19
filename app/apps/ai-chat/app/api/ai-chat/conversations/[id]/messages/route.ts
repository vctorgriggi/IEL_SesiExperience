import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  appendMessage,
  CHAT_WRITES_PER_MINUTE,
  chatWritesLimiter,
  rateLimitedResponse
} from '@workspace/ai';

import { getAiChatUserId } from '~/lib/auth-user';

type RouteParams = { params: Promise<{ id: string }> };

const appendSchema = z.object({
  role: z.literal('user'),
  content: z.string().min(1).max(100_000)
});

/**
 * POST /api/ai-chat/conversations/[id]/messages — anexa uma mensagem.
 *
 * O app de chat não usa esta rota no fluxo normal (quem grava é o próprio
 * `/api/chat`, no servidor, para não perder resposta se o cliente cair). Ela
 * existe como contrato HTTP para integrações externas.
 */
export async function POST(
  req: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { isRateLimited } = await chatWritesLimiter.check(
    CHAT_WRITES_PER_MINUTE,
    `ai-chat-messages:${userId}`
  );
  if (isRateLimited) return rateLimitedResponse();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = appendSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join('; ') },
      { status: 400 }
    );
  }

  const { id } = await params;
  const message = await appendMessage({
    conversationId: id,
    userId,
    role: parsed.data.role,
    content: parsed.data.content
  });

  if (!message) {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  }

  return NextResponse.json(message, { status: 201 });
}
