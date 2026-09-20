import { NextResponse } from 'next/server';
import {
  assistantRequestSchema,
  getAssistantProvider
} from '@/features/iel-demo/ai';

import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';

/**
 * POST /api/iel/assistant
 *
 * Mind e análise assistida da Central de Seleção IEL (protótipo, rota
 * pública e sem dados reais). Recebe os registros já resolvidos da seleção
 * atual e devolve uma resposta da regra fixa ou de um modelo, conforme o
 * ambiente — veja `getAssistantProvider()` em `features/iel-demo/ai/index.ts`.
 * Antes de qualquer provedor externo, o pedido é pseudonimizado
 * (`features/iel-demo/ai/pseudonimizar.ts`).
 *
 * Corpo (`assistantRequestSchema`):
 *
 * - `kind`: `resumir-selecao` | `comparar-selecionados` | `mostrar-lacunas`
 *   | `leitura-da-pessoa`;
 * - `jobId`, `applicationIds` (até 3; exatamente 1 em `leitura-da-pessoa`),
 *   `applications`, `analysis`, `evidences` — use
 *   `buildAssistantRequestPayload` (`features/iel-demo/ai/build-request.ts`);
 * - `pergunta` (opcional, até 500 caracteres): a pergunta livre da analista;
 * - `contexto` (opcional): vaga, empresa, pessoas com % de combina e temas,
 *   pendências — use `montarContextoLivre` (`features/iel-demo/chat/mind-livre.ts`).
 *
 * Resposta (`assistantResponseSchema`): `text`, `citations`, `provider`
 * (`deterministic` | `gemini` | `deepseek` | `anthropic`), `modelo?`, `aviso?` (o
 * modelo falhou e a regra fixa respondeu), `leitura?` (só em
 * `leitura-da-pessoa`: `ondeCombina`, `ondeConversar`, `perguntas`).
 *
 * Limite: 20 pedidos por minuto por IP (memória do processo). Acima disso,
 * 429 — o que protege a conta do provedor pago.
 */

const limitador = inMemoryRateLimiter({ intervalInMs: 60 * 1000 });

const PEDIDOS_POR_MINUTO = 20;

function identificador(req: Request): string {
  const encaminhado = req.headers.get('x-forwarded-for');
  const ip =
    encaminhado?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'desconhecido';
  return `iel-assistant:${ip}`;
}

export async function POST(req: Request): Promise<Response> {
  const { isRateLimited } = await limitador.check(
    PEDIDOS_POR_MINUTO,
    identificador(req)
  );
  if (isRateLimited) {
    return NextResponse.json(
      { error: 'Muitas perguntas seguidas. Espere um minuto e tente de novo.' },
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

  const parsed = assistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Pedido inválido.', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const provider = getAssistantProvider();
  const response = await provider.run(parsed.data);

  return NextResponse.json(response);
}
