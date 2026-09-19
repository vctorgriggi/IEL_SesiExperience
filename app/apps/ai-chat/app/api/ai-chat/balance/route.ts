import { NextResponse } from 'next/server';

import { getAiCreditBalance } from '@workspace/ai';

import { getAiChatUserId } from '~/lib/auth-user';

/** GET /api/ai-chat/balance — saldo de mensagens gratuitas + créditos. */
export async function GET(): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const balance = await getAiCreditBalance(userId);
  return NextResponse.json(balance, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
