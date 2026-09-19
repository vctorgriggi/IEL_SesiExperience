import {
  chunkText,
  consumeDemoQuota,
  createKnowledgeDocument,
  extractDocumentText,
  failKnowledgeDocument,
  finalizeKnowledgeDocument,
  KNOWLEDGE_MAX_TEXT_CHARS,
  releaseDemoQuota
} from '@workspace/ai';
import { dedupedAuth } from '@workspace/auth';
import { getClientIp } from '@workspace/common/client-ip';
import { validateDocumentFile } from '@workspace/common/file-validation';

import { jsonError } from '~/lib/api-response';
import { embedChunks } from '~/lib/embeddings';
import { canEditKnowledge } from '~/lib/knowledge-access';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  const session = await dedupedAuth();
  const userId = session?.user?.id;
  if (!userId) return jsonError('Não autorizado', 401);

  // Na demonstração qualquer visitante alimenta a base, limitado por IP; o
  // admin sobe à vontade para preparar o conteúdo.
  const unlimited = canEditKnowledge(session.user?.email);
  const ip = getClientIp(req.headers);
  const demo = unlimited ? null : await consumeDemoQuota(ip, 'uploads');

  if (demo && !demo.ok) {
    return jsonError(
      `Você usou os ${demo.limit} envios da demonstração. Compre um pacote para continuar.`,
      402,
      { code: 'DEMO_LIMIT', used: demo.used, limit: demo.limit }
    );
  }

  const releaseDemo = async () => {
    if (demo) await releaseDemoQuota(ip, 'uploads').catch(() => undefined);
  };

  // Envio recusado não gasta a cota do visitante.
  const fail = async (message: string, status: number): Promise<Response> => {
    await releaseDemo();
    return jsonError(message, status);
  };

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) {
    return fail('Envie um arquivo.', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateDocumentFile(buffer, file.name);
  if (!validated.ok) return fail(validated.error.message, 400);

  let text: string;
  try {
    text = await extractDocumentText(buffer, validated.data.contentType);
  } catch {
    return fail('Não foi possível ler o conteúdo do arquivo.', 400);
  }
  if (!text) return fail('O arquivo não tem texto extraível.', 400);
  if (text.length > KNOWLEDGE_MAX_TEXT_CHARS) {
    return fail('Documento grande demais para indexar.', 400);
  }

  const document = await createKnowledgeDocument({
    fileName: file.name.slice(0, 255),
    mimeType: validated.data.contentType,
    uploadedBy: userId
  });

  try {
    const chunks = chunkText(text);
    const embeddings = await embedChunks(chunks.map((chunk) => chunk.content));
    await finalizeKnowledgeDocument(
      document.id,
      chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i]! }))
    );
    return Response.json({
      ...document,
      status: 'ready',
      chunkCount: chunks.length
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Falha ao indexar o documento';
    await failKnowledgeDocument(document.id, message).catch(() => undefined);
    return fail('Falha ao indexar o documento.', 502);
  }
}
