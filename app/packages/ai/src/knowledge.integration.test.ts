import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  aiKnowledgeChunkTable,
  aiKnowledgeDocumentTable,
  db,
  eq,
  userTable
} from '@workspace/database';

import {
  buildGroundedSystemPrompt,
  createKnowledgeDocument,
  deleteKnowledgeDocument,
  extractDocumentText,
  finalizeKnowledgeDocument,
  formatKnowledgeContext,
  searchKnowledgeChunks
} from './knowledge';
import { chunkText } from './knowledge-chunking';

const enabled = process.env.RUN_AI_INTEGRATION_TESTS === '1';

function unitVector(position: number): number[] {
  const vector = new Array<number>(1536).fill(0);
  vector[position] = 1;
  return vector;
}

describe.skipIf(!enabled)('base de conhecimento (integração)', () => {
  let userId: string;
  let documentId: string;

  beforeAll(async () => {
    const [user] = await db
      .insert(userTable)
      .values({
        name: 'Teste knowledge IA',
        email: `ai-knowledge-${Date.now()}@test.local`
      })
      .returning({ id: userTable.id });
    userId = user!.id;

    const document = await createKnowledgeDocument({
      fileName: 'guia.md',
      mimeType: 'text/markdown',
      uploadedBy: userId
    });
    documentId = document.id;
    expect(document.status).toBe('processing');

    await finalizeKnowledgeDocument(documentId, [
      { index: 0, content: 'Trecho sobre preços', embedding: unitVector(0) },
      { index: 1, content: 'Trecho sobre suporte', embedding: unitVector(1) }
    ]);
  });

  afterAll(async () => {
    await db
      .delete(aiKnowledgeDocumentTable)
      .where(eq(aiKnowledgeDocumentTable.id, documentId))
      .catch(() => undefined);
    await db.delete(userTable).where(eq(userTable.id, userId));
  });

  it('busca devolve o trecho mais próximo primeiro', async () => {
    const results = await searchKnowledgeChunks(unitVector(0), {
      minSimilarity: 0
    });

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results[0]!.content).toBe('Trecho sobre preços');
    expect(results[0]!.fileName).toBe('guia.md');
    expect(results[0]!.similarity).toBeCloseTo(1, 5);
  });

  it('filtra pelo piso de similaridade', async () => {
    const results = await searchKnowledgeChunks(unitVector(0), {
      minSimilarity: 0.5
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.content).toBe('Trecho sobre preços');
  });

  it('ignora documentos que não estão prontos', async () => {
    const pending = await createKnowledgeDocument({
      fileName: 'pendente.md',
      mimeType: 'text/markdown',
      uploadedBy: userId
    });
    await db.insert(aiKnowledgeChunkTable).values({
      documentId: pending.id,
      chunkIndex: 0,
      content: 'Trecho não indexado',
      embedding: unitVector(2)
    });

    const results = await searchKnowledgeChunks(unitVector(2), {
      minSimilarity: 0.5
    });
    expect(results).toHaveLength(0);

    await deleteKnowledgeDocument(pending.id);
  });

  it('remover o documento remove os chunks em cascata', async () => {
    const document = await createKnowledgeDocument({
      fileName: 'temporario.md',
      mimeType: 'text/markdown',
      uploadedBy: userId
    });
    await finalizeKnowledgeDocument(document.id, [
      { index: 0, content: 'Descartável', embedding: unitVector(3) }
    ]);

    expect(await deleteKnowledgeDocument(document.id)).toBe(true);

    const chunks = await db
      .select({ id: aiKnowledgeChunkTable.id })
      .from(aiKnowledgeChunkTable)
      .where(eq(aiKnowledgeChunkTable.documentId, document.id));
    expect(chunks).toHaveLength(0);
  });

  it('recusa id que não é uuid', async () => {
    expect(await deleteKnowledgeDocument('not-a-uuid')).toBe(false);
  });

  it('percorre o pipeline inteiro: extrair, chunkar, indexar e recuperar', async () => {
    const markdown = `# Política de reembolso

Reembolsos são processados em até 7 dias úteis após a solicitação.

## Suporte

O suporte atende de segunda a sexta, das 9h às 18h.`;

    const text = await extractDocumentText(
      Buffer.from(markdown, 'utf-8'),
      'text/markdown'
    );
    expect(text).toContain('Reembolsos');

    const chunks = chunkText(text, { size: 120, overlap: 20 });
    expect(chunks.length).toBeGreaterThan(1);

    const document = await createKnowledgeDocument({
      fileName: 'politica.md',
      mimeType: 'text/markdown',
      uploadedBy: userId
    });
    await finalizeKnowledgeDocument(
      document.id,
      chunks.map((chunk) => ({
        ...chunk,
        embedding: unitVector(100 + chunk.index)
      }))
    );

    const hits = await searchKnowledgeChunks(unitVector(100), {
      minSimilarity: 0.5
    });
    expect(hits[0]?.fileName).toBe('politica.md');

    const context = formatKnowledgeContext(hits);
    expect(context).toContain('[Fonte: politica.md]');
    expect(
      buildGroundedSystemPrompt('Você é um assistente.', context)
    ).toContain('exclusivamente');

    // Pergunta que a base não cobre: nenhum trecho passa o piso e o prompt
    // avisa o modelo, que é o que sustenta o "não sei" do grounding estrito.
    const miss = await searchKnowledgeChunks(unitVector(900), {
      minSimilarity: 0.5
    });
    expect(miss).toHaveLength(0);
    expect(
      buildGroundedSystemPrompt('x', formatKnowledgeContext(miss))
    ).toContain('nenhum trecho relevante encontrado');

    await deleteKnowledgeDocument(document.id);
  });
});
