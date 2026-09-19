import { NextResponse } from 'next/server';
import {
  assistantRequestSchema,
  getAssistantProvider
} from '@/features/iel-demo/ai';

/**
 * POST /api/iel/assistant
 *
 * Análise assistida da Central de Seleção IEL (protótipo, rota pública e sem
 * dados reais). Recebe os registros já resolvidos da seleção atual e devolve
 * uma resposta determinística ou gerada por modelo, conforme o ambiente —
 * veja `getAssistantProvider()` em `features/iel-demo/ai/index.ts`.
 */
export async function POST(req: Request): Promise<Response> {
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
