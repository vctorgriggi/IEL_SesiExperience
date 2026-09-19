import { NextResponse } from 'next/server';

import { consumeAiMessage } from '@workspace/ai';

import { getAiChatUserId } from '~/lib/auth-user';

/**
 * POST /api/ai-chat/use-message — consome uma mensagem do saldo do usuário.
 * O app de chat chama esta rota antes de gerar a resposta. Retorna 402 quando
 * não há saldo (gratuito ou comprado).
 */
export async function POST(): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { ok, balance } = await consumeAiMessage(userId);
  if (!ok) {
    return NextResponse.json(
      {
        message:
          'Você usou todas as mensagens. Compre créditos para continuar.',
        ...balance
      },
      { status: 402, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.json(balance, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
