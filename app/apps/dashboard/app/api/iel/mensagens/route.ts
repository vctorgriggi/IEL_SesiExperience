import { NextResponse } from 'next/server';
import { mensagemComMind } from '@/features/iel-demo/ai/mensagens';
import { ETAPAS_DA_MENSAGEM } from '@/features/iel-demo/analysis/mensagens';
import type { EtapaDaMensagem } from '@/features/iel-demo/analysis/mensagens';
import { z } from 'zod';

import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';

/**
 * POST /api/iel/mensagens
 *
 * A mensagem de WhatsApp que a analista manda ao candidato numa etapa —
 * convite, lembrete, currículo enviado, a empresa quer conversar, não foi
 * desta vez, como está sendo.
 *
 * A resposta é **sempre** a regra fixa (`analysis/mensagens.ts`),
 * possivelmente reescrita pelo Mind quando `IEL_AI_PROVIDER` e a chave do
 * provedor estão configurados (`ai/mensagens.ts`). Sem chave, ou com
 * qualquer falha do modelo, volta 200 com `origem: 'regra'` — nunca 503: a
 * mensagem é do produto, a IA é polimento. E ninguém envia nada por aqui:
 * a rota devolve um rascunho; quem aprova e manda é a analista.
 *
 * Corpo: `{ etapa, entrada: { primeiroNome, atividade, localidade?, turno?,
 * prazo?, marco?, link?, analista? } }`. Resposta: `MensagemAoCandidato`.
 *
 * O que sai para o provedor de IA, quando há chave (PRODUTO.md §5.8): a
 * etapa, o texto da regra fixa com marcadores no lugar do nome, da cidade,
 * do link e de quem assina, a atividade e o turno genéricos, o prazo em
 * "dd/mm" e o marco — passados por `pseudonimizar.ts`.
 *
 * O que não sai: o nome da pessoa (chega aqui, fica aqui), a cidade, o link
 * (carrega o id da candidatura), o nome de quem assina e o nome da empresa
 * (R5) — o corpo nem tem campo para ele, e a saída do modelo é conferida
 * contra a lista de empresas da base mesmo assim.
 *
 * Limite: 20 pedidos por minuto por IP (memória do processo), o mesmo do
 * Mind — protege a conta do provedor pago.
 */

const limitador = inMemoryRateLimiter({ intervalInMs: 60 * 1000 });

const PEDIDOS_POR_MINUTO = 20;

const etapaSchema = z.enum(
  ETAPAS_DA_MENSAGEM as [EtapaDaMensagem, ...EtapaDaMensagem[]]
);

const corpoSchema = z.object({
  etapa: etapaSchema,
  entrada: z.object({
    primeiroNome: z.string().trim().min(1).max(40),
    atividade: z.string().trim().min(1).max(120),
    localidade: z.string().trim().max(80).optional(),
    turno: z.string().trim().max(80).optional(),
    prazo: z
      .string()
      .trim()
      .regex(/^\d{2}\/\d{2}$/, 'Prazo em dd/mm.')
      .optional(),
    marco: z.union([z.literal(30), z.literal(60), z.literal(90)]).optional(),
    // Absoluto: é o que a pessoa vai tocar no celular.
    link: z.string().trim().url().max(300).optional(),
    analista: z.string().trim().max(40).optional()
  })
});

function identificador(req: Request): string {
  const encaminhado = req.headers.get('x-forwarded-for');
  const ip =
    encaminhado?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'desconhecido';
  return `iel-mensagens:${ip}`;
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

  const { etapa, entrada } = parsed.data;
  const mensagem = await mensagemComMind({ ...entrada, etapa });
  return NextResponse.json(mensagem);
}
