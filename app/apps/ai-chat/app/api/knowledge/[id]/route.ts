import { deleteKnowledgeDocument } from '@workspace/ai';
import { dedupedAuth } from '@workspace/auth';

import { jsonError } from '~/lib/api-response';
import { canEditKnowledge } from '~/lib/knowledge-access';

export const runtime = 'nodejs';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await dedupedAuth();
  if (!session?.user?.id) return jsonError('Não autorizado', 401);
  if (!canEditKnowledge(session.user?.email)) {
    return jsonError('Acesso restrito', 403);
  }

  const { id } = await params;
  const deleted = await deleteKnowledgeDocument(id);
  if (!deleted) return jsonError('Documento não encontrado', 404);

  return new Response(null, { status: 204 });
}
