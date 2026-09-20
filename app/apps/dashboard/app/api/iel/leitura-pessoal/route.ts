import { NextResponse } from 'next/server';
import { leituraPessoalComMind } from '@/features/iel-demo/ai/leitura-pessoal';
import { isValorDaEscala } from '@/features/iel-demo/analysis/instrumento';
import type { ValorDaEscala } from '@/features/iel-demo/analysis/instrumento';
import { z } from 'zod';

import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';

/**
 * POST /api/iel/leitura-pessoal
 *
 * A devolutiva pessoal do fim do questionário — "o seu jeito de trabalhar"
 * (candidato) ou "como você descreveu o seu ambiente" (colaborador).
 *
 * A resposta é **sempre** a regra fixa (`analysis/leitura-pessoal.ts`),
 * possivelmente reescrita pelo Mind quando `IEL_AI_PROVIDER` e a chave do
 * provedor estão configurados (`ai/leitura-pessoal.ts`). Sem chave, ou com
 * qualquer falha do modelo, volta 200 com `origem: 'regra'` — nunca 503: a
 * devolutiva é do produto, a IA é enfeite.
 *
 * Corpo: `{ papel: 'candidato' | 'colaborador', respostas: { I01: 1..5, … },
 * contexto?: { atividade?, setor? } }`. Resposta: `LeituraPessoal`.
 *
 * O que sai para o provedor de IA, quando há chave (PRODUTO.md §5.8):
 * `papel`, a média por tema em número (com o lado e o rótulo do tema), as
 * frases da regra fixa e `atividade`/`setor` genéricos, passados por
 * `pseudonimizar.ts`.
 *
 * O que não sai: nome (a tela nem manda), nome de empresa (R5), ids de
 * candidatura ou de convite, e as respostas frase a frase. O corpo não tem
 * campo para nada disso; se alguém escrever um nome em `atividade`, a
 * pseudonimização o troca antes de sair.
 *
 * Limite: 20 pedidos por minuto por IP (memória do processo), o mesmo do
 * Mind — protege a conta do provedor pago.
 */

const limitador = inMemoryRateLimiter({ intervalInMs: 60 * 1000 });

const PEDIDOS_POR_MINUTO = 20;

/** Quantas frases um pedido pode trazer: o instrumento inteiro, no máximo. */
const MAX_RESPOSTAS = 52;

const valorDaEscalaSchema = z.custom<ValorDaEscala>(isValorDaEscala, {
  message: 'Resposta fora da escala de 1 a 5.'
});

const corpoSchema = z.object({
  papel: z.enum(['candidato', 'colaborador']),
  respostas: z
    .record(z.string().regex(/^I\d{2}$/), valorDaEscalaSchema)
    .refine((r) => Object.keys(r).length >= 1, {
      message: 'Sem respostas não há leitura.'
    })
    .refine((r) => Object.keys(r).length <= MAX_RESPOSTAS, {
      message: `No máximo ${MAX_RESPOSTAS} respostas.`
    }),
  contexto: z
    .object({
      atividade: z.string().trim().max(80).optional(),
      setor: z.string().trim().max(80).optional()
    })
    .optional()
});

function identificador(req: Request): string {
  const encaminhado = req.headers.get('x-forwarded-for');
  const ip =
    encaminhado?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'desconhecido';
  return `iel-leitura-pessoal:${ip}`;
}

export async function POST(req: Request): Promise<Response> {
  const { isRateLimited } = await limitador.check(
    PEDIDOS_POR_MINUTO,
    identificador(req)
  );
  if (isRateLimited) {
    return NextResponse.json(
      { error: 'Muitos pedidos seguidos. Espere um minuto e tente de novo.' },
      { status: 429, headers: { 'retry-after': '60' } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Corpo da requisição inválido: JSON esperado.' },
      { status: 400 }
    );
  }

  const parsed = corpoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Pedido inválido.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { papel, respostas, contexto } = parsed.data;
  const leitura = await leituraPessoalComMind(respostas, papel, contexto);
  return NextResponse.json(leitura);
}
