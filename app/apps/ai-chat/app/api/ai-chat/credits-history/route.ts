import { NextRequest, NextResponse } from 'next/server';

import { CREDIT_LEDGER_PAGE_SIZE, listCreditLedger } from '@workspace/ai';

import { getAiChatUserId } from '~/lib/auth-user';

/** GET /api/ai-chat/credits-history — extrato de créditos do usuário. */
export async function GET(req: NextRequest): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const limitParam = Number.parseInt(params.get('limit') ?? '', 10);

  const page = await listCreditLedger({
    userId,
    limit: Number.isFinite(limitParam) ? limitParam : CREDIT_LEDGER_PAGE_SIZE,
    cursor: params.get('cursor')
  });

  return NextResponse.json(page, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
