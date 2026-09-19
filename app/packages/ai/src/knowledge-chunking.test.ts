import { describe, expect, it } from 'vitest';

import { chunkText } from './knowledge-chunking';

describe('chunkText', () => {
  it('devolve vazio para texto vazio ou só espaços', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('  \n\n  ')).toEqual([]);
  });

  it('texto curto vira um chunk único sem overlap', () => {
    const chunks = chunkText('Primeiro parágrafo.\n\nSegundo parágrafo.');
    expect(chunks).toEqual([
      { index: 0, content: 'Primeiro parágrafo.\n\nSegundo parágrafo.' }
    ]);
  });

  it('divide parágrafos que não cabem juntos e aplica overlap', () => {
    const chunks = chunkText(`${'a'.repeat(40)}\n\n${'b'.repeat(40)}`, {
      size: 50,
      overlap: 10
    });

    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.content).toBe('a'.repeat(40));
    expect(chunks[1]!.content).toBe(`${'a'.repeat(10)}\n\n${'b'.repeat(40)}`);
  });

  it('quebra bloco único maior que o limite', () => {
    const chunks = chunkText('x'.repeat(200), { size: 50, overlap: 0 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.content.length <= 50)).toBe(true);
    expect(chunks.map((chunk) => chunk.content).join('')).toBe('x'.repeat(200));
  });

  it('prefere quebrar em espaço quando o bloco excede o limite', () => {
    const words = Array.from({ length: 30 }, () => 'palavra').join(' ');
    const chunks = chunkText(words, { size: 50, overlap: 0 });

    expect(chunks.every((chunk) => !chunk.content.startsWith(' '))).toBe(true);
    expect(chunks.every((chunk) => chunk.content.length <= 50)).toBe(true);
  });

  it('normaliza fins de linha do Windows', () => {
    const chunks = chunkText('um\r\n\r\ndois');
    expect(chunks[0]!.content).toBe('um\n\ndois');
  });

  it('mantém índices sequenciais', () => {
    const text = Array.from({ length: 20 }, (_, i) => `Parágrafo ${i}.`).join(
      '\n\n'
    );
    const chunks = chunkText(text, { size: 30, overlap: 5 });

    expect(chunks.map((chunk) => chunk.index)).toEqual(chunks.map((_, i) => i));
  });
});
