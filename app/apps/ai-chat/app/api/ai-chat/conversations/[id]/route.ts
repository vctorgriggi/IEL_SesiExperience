import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  CHAT_WRITES_PER_MINUTE,
  chatWritesLimiter,
  deleteConversation,
  getConversation,
  listMessages,
  rateLimitedResponse,
  updateConversation
} from '@workspace/ai';

import { getAiChatUserId } from '~/lib/auth-user';

type RouteParams = { params: Promise<{ id: string }> };

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    model: z.string().trim().min(1).max(64).optional()
  })
  .refine((value) => value.title !== undefined || value.model !== undefined, {
    message: 'Informe título ou modelo'
  });

/** GET /api/ai-chat/conversations/[id] — conversa + mensagens. */
export async function GET(
  _req: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const conversation = await getConversation(id, userId);
  if (!conversation) {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  }

  const messages = await listMessages(conversation.id);

  return NextResponse.json(
    { ...conversation, messages },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/** PATCH /api/ai-chat/conversations/[id] — renomeia e/ou troca o modelo. */
export async function PATCH(
  req: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { isRateLimited } = await chatWritesLimiter.check(
    CHAT_WRITES_PER_MINUTE,
    `ai-chat-conversations:${userId}`
  );
  if (isRateLimited) return rateLimitedResponse();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join('; ') },
      { status: 400 }
    );
  }

  const { id } = await params;
  const updated = await updateConversation({
    id,
    userId,
    title: parsed.data.title,
    model: parsed.data.model
  });

  if (!updated) {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

/** DELETE /api/ai-chat/conversations/[id] — remove a conversa e mensagens. */
export async function DELETE(
  _req: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { isRateLimited } = await chatWritesLimiter.check(
    CHAT_WRITES_PER_MINUTE,
    `ai-chat-conversations:${userId}`
  );
  if (isRateLimited) return rateLimitedResponse();

  const { id } = await params;
  const removed = await deleteConversation(id, userId);
  if (!removed) {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
