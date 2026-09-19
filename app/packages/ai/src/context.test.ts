import { describe, expect, it } from 'vitest';

import { selectContextMessages } from './context';

function messages(count: number, size = 10) {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `${i}`.padEnd(size, 'x')
  }));
}

describe('selectContextMessages', () => {
  it('devolve tudo quando cabe nos limites', () => {
    const all = messages(5);
    expect(
      selectContextMessages(all, { maxMessages: 10, maxChars: 1000 })
    ).toEqual(all);
  });

  it('mantém as mais recentes ao cortar por quantidade', () => {
    const all = messages(10);
    const selected = selectContextMessages(all, {
      maxMessages: 3,
      maxChars: 10_000
    });

    // O corte pegaria 3, mas a primeira seria do assistente e é descartada.
    expect(selected).toEqual(all.slice(-2));
    expect(selected.length).toBeLessThanOrEqual(3);
  });

  it('corta por orçamento de caracteres', () => {
    const all = messages(10, 100);
    const selected = selectContextMessages(all, {
      maxMessages: 100,
      maxChars: 250
    });

    expect(selected.length).toBeLessThanOrEqual(3);
    expect(selected.at(-1)).toEqual(all.at(-1));
  });

  it('nunca descarta a última mensagem, mesmo maior que o teto', () => {
    const all = [{ role: 'user', content: 'x'.repeat(5000) }];
    expect(
      selectContextMessages(all, { maxMessages: 10, maxChars: 100 })
    ).toEqual(all);
  });

  it('preserva a ordem cronológica', () => {
    const all = messages(6);
    const selected = selectContextMessages(all, {
      maxMessages: 4,
      maxChars: 10_000
    });

    expect(selected.map((m) => m.content)).toEqual(
      all.slice(-4).map((m) => m.content)
    );
  });

  it('aceita lista vazia', () => {
    expect(selectContextMessages([])).toEqual([]);
  });

  it('nunca começa pelo assistente, que a Anthropic recusa', () => {
    // 8 mensagens alternando user/assistant: cortar em 3 cairia num assistant.
    const all = messages(8);
    const selected = selectContextMessages(all, {
      maxMessages: 3,
      maxChars: 10_000
    });

    expect(selected[0]?.role).toBe('user');
    expect(selected.at(-1)).toEqual(all.at(-1));
  });

  it('corta o assistente órfão também quando o limite é de caracteres', () => {
    const all = messages(8, 100);
    const selected = selectContextMessages(all, {
      maxMessages: 100,
      maxChars: 250
    });

    expect(selected[0]?.role).toBe('user');
  });

  it('mantém a última mensagem mesmo que ela não seja do usuário', () => {
    const all = [{ role: 'assistant', content: 'resposta solta' }];
    expect(selectContextMessages(all)).toEqual(all);
  });
});
