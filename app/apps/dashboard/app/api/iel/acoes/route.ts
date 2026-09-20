import { NextResponse } from 'next/server';
import {
  estadoCompartilhadoLigado,
  SALA_PADRAO
} from '@/features/iel-demo/state/config';
import type { DemoAction } from '@/features/iel-demo/state/reducer';
import { aplicarAcao, reiniciarSala } from '@/features/iel-demo/state/servidor';
import { z } from 'zod';

import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';

/**
 * POST /api/iel/acoes — `{ sala, acao }` → `{ revisao, persisted }`
 * DELETE /api/iel/acoes — `{ sala }` → `{ revisao, persisted }` (reinicia)
 *
 * Aplica uma ação do reducer da demonstração sobre a sala, no servidor, e
 * devolve o delta autoritativo (`state/servidor.ts`). A validação da ação é
 * de propósito frouxa — `type` string e um objeto — porque o
 * `demoReducer` já recusa o que não conhece devolvendo o mesmo estado, e
 * reescrever aqui cada uma das dezenas de ações seria duplicar o reducer.
 *
 * Duas ações não passam: `hydrate` (substituiria o estado inteiro por algo
 * vindo do cliente) e `reset` (é o DELETE, para ficar explícito no log de
 * quem chamou).
 *
 * O `at` das ações vem do cliente, com `nowIso()` — o relógio fixo da demo.
 * Fica assim porque é demonstração: em produção, o carimbo seria do
 * servidor.
 *
 * Acesso: aberta por desenho (R9/R10). A API da demo não autentica; em
 * produção, sessão por pessoa.
 *
 * Limite: 120 ações por minuto por IP.
 */

export const dynamic = 'force-dynamic';

const limitador = inMemoryRateLimiter({ intervalInMs: 60 * 1000 });
const ACOES_POR_MINUTO = 120;

const salaSchema = z
  .string()
  .regex(/^[a-z0-9-]{1,40}$/, 'Nome de sala inválido.');

const acaoSchema = z
  .object({
    type: z
      .string()
      .min(1)
      .max(60)
      .refine((type) => type !== 'hydrate' && type !== 'reset', {
        message: 'Esta ação não pode vir do cliente.'
      })
  })
  .passthrough();

const postSchema = z.object({
  sala: salaSchema.default(SALA_PADRAO),
  acao: acaoSchema
});

const deleteSchema = z.object({
  sala: salaSchema.default(SALA_PADRAO)
});

function identificador(req: Request): string {
  const encaminhado = req.headers.get('x-forwarded-for');
  const ip =
    encaminhado?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'desconhecido';
  return `iel-acoes:${ip}`;
}

type Portao = { ok: true; body: unknown } | { ok: false; resposta: Response };

/** O que POST e DELETE têm em comum: modo ligado, limite e JSON válido. */
async function portao(req: Request): Promise<Portao> {
  if (!estadoCompartilhadoLigado()) {
    return {
      ok: false,
      resposta: NextResponse.json(
        { erro: 'estado compartilhado desligado' },
        { status: 503 }
      )
    };
  }

  const { isRateLimited } = await limitador.check(
    ACOES_POR_MINUTO,
    identificador(req)
  );
  if (isRateLimited) {
    return {
      ok: false,
      resposta: NextResponse.json(
        { erro: 'Muitas ações seguidas. Espere um minuto.' },
        { status: 429, headers: { 'retry-after': '60' } }
      )
    };
  }

  try {
    return { ok: true, body: await req.json() };
  } catch {
    return {
      ok: false,
      resposta: NextResponse.json(
        { erro: 'Corpo da requisição inválido: JSON esperado.' },
        { status: 400 }
      )
    };
  }
}

export async function POST(req: Request): Promise<Response> {
  const entrada = await portao(req);
  if (!entrada.ok) return entrada.resposta;

  const parsed = postSchema.safeParse(entrada.body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Pedido inválido.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  // O Zod garantiu só a forma; o reducer é quem decide se a ação faz
  // sentido. Uma ação desconhecida cai no `default` e não muda nada.
  const acao = parsed.data.acao as unknown as DemoAction;
  const resultado = await aplicarAcao(parsed.data.sala, acao);
  return NextResponse.json(resultado, {
    headers: { 'cache-control': 'no-store' }
  });
}

export async function DELETE(req: Request): Promise<Response> {
  const entrada = await portao(req);
  if (!entrada.ok) return entrada.resposta;

  const parsed = deleteSchema.safeParse(entrada.body);
  if (!parsed.success) {
    return NextResponse.json(
      { erro: 'Pedido inválido.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const resultado = await reiniciarSala(parsed.data.sala);
  return NextResponse.json(resultado, {
    headers: { 'cache-control': 'no-store' }
  });
}
