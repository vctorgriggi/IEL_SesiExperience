import { describe, expect, it } from 'vitest';

import {
  buildGroundedSystemPrompt,
  formatKnowledgeContext,
  type KnowledgeSearchResult
} from './knowledge';

function result(fileName: string, content: string): KnowledgeSearchResult {
  return { documentId: 'doc-1', fileName, content, similarity: 0.9 };
}

describe('formatKnowledgeContext', () => {
  it('devolve string vazia sem resultados', () => {
    expect(formatKnowledgeContext([])).toBe('');
  });

  it('rotula cada trecho com a fonte e separa com ---', () => {
    const context = formatKnowledgeContext([
      result('guia.md', 'Conteúdo A'),
      result('faq.pdf', 'Conteúdo B')
    ]);

    expect(context).toBe(
      '[Fonte: guia.md]\nConteúdo A\n\n---\n\n[Fonte: faq.pdf]\nConteúdo B'
    );
  });

  it('corta pelo orçamento de chars mantendo trechos inteiros', () => {
    const context = formatKnowledgeContext(
      [result('a.md', 'x'.repeat(100)), result('b.md', 'y'.repeat(100))],
      150
    );

    expect(context).toContain('a.md');
    expect(context).not.toContain('b.md');
  });
});

describe('buildGroundedSystemPrompt', () => {
  it('inclui o prompt base, as regras e o contexto', () => {
    const prompt = buildGroundedSystemPrompt('Você é um assistente.', 'TRECHO');

    expect(prompt).toContain('Você é um assistente.');
    expect(prompt).toContain('exclusivamente');
    expect(prompt).toContain('<contexto>\nTRECHO\n</contexto>');
  });

  it('marca contexto vazio para o modelo admitir que não sabe', () => {
    const prompt = buildGroundedSystemPrompt('Base.', '');
    expect(prompt).toContain('(nenhum trecho relevante encontrado)');
  });
});
