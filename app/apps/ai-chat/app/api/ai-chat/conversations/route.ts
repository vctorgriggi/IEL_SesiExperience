import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  CHAT_WRITES_PER_MINUTE,
  chatWritesLimiter,
  createConversation,
  listConversations,
  rateLimitedResponse
} from '@workspace/ai';

import { getAiChatUserId } from '~/lib/auth-user';

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(64)
});

/**
 * GET /api/ai-chat/conversations — lista as conversas do usuário, da mais
 * recente pra mais antiga. Aceita `?limit`, `?cursor` e `?q` (busca no título).
 */
export async function GET(req: NextRequest): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const limitParam = Number.parseInt(params.get('limit') ?? '', 10);

  const page = await listConversations({
    userId,
    limit: Number.isFinite(limitParam) ? limitParam : undefined,
    cursor: params.get('cursor'),
    query: params.get('q')
  });

  return NextResponse.json(page, {
    headers: { 'Cache-Control': 'no-store' }
  });
}

/** POST /api/ai-chat/conversations — cria uma conversa. */
export async function POST(req: NextRequest): Promise<Response> {
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

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join('; ') },
      { status: 400 }
    );
  }

  const conversation = await createConversation({
    userId,
    title: parsed.data.title,
    model: parsed.data.model
  });

  return NextResponse.json(conversation, { status: 201 });
}
