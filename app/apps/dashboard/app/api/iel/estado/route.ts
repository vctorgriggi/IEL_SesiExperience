import { NextResponse } from 'next/server';
import {
  estadoCompartilhadoLigado,
  SALA_PADRAO
} from '@/features/iel-demo/state/config';
import { lerSala } from '@/features/iel-demo/state/servidor';
import { z } from 'zod';

import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';

/**
 * GET /api/iel/estado?sala=principal
 *
 * O estado da sala da demonstração (modo compartilhado). Devolve
 * `{ revisao, schemaVersion, persisted }`, em que `persisted` é o delta
 * sobre a base fictícia — o mesmo formato do localStorage. É a rota que o
 * notebook da analista sonda a cada poucos segundos para ver a resposta que
 * o candidato deu no celular.
 *
 * Sem `IEL_ESTADO_COMPARTILHADO=1` e `DATABASE_URL`, responde 503: o
 * cliente nem chega a chamar, mas quem chamar recebe um "desligado" claro,
 * não um 500.
 *
 * Acesso: aberta por desenho, como os links do candidato e do colaborador
 * (R9/R10). A API da demo não autentica; em produção, sessão por pessoa.
 *
 * Limite: 120 leituras por minuto por IP — um aparelho sondando a cada 4 s
 * usa 15; sobra para várias abas.
 */

export const dynamic = 'force-dynamic';

const limitador = inMemoryRateLimiter({ intervalInMs: 60 * 1000 });
const LEITURAS_POR_MINUTO = 120;

const salaSchema = z
  .string()
  .regex(/^[a-z0-9-]{1,40}$/, 'Nome de sala inválido.');

const querySchema = z.object({
  sala: salaSchema.default(SALA_PADRAO)
});

function identificador(req: Request): string {
  const encaminhado = req.headers.get('x-forwarded-for');
  const ip =
    encaminhado?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'desconhecido';
  return `iel-estado:${ip}`;
}

export async function GET(req: Request): Promise<Response> {
  if (!estadoCompartilhadoLigado()) {
    return NextResponse.json(
      { erro: 'estado compartilhado desligado' },
      { status: 503 }
    );
  }

  const { isRateLimited } = await limitador.check(
    LEITURAS_POR_MINUTO,
    identificador(req)
  );
  if (isRateLimited) {
    return NextResponse.json(
      { erro: 'Muitas leituras seguidas. Espere um minuto.' },
      { status: 429, headers: { 'retry-after': '60' } }
    );
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    sala: url.searchParams.get('sala') ?? undefined
  });
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Pedido inválido.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const sala = await lerSala(parsed.data.sala);
  return NextResponse.json(sala, {
    headers: { 'cache-control': 'no-store' }
  });
}
