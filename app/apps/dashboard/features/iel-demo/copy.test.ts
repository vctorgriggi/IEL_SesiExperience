import { describe, expect, it } from 'vitest';

import { COPY, missingAnswers, verdict, verdictState } from './copy';

describe('verdict', () => {
  it('interpreta o número acima do corte', () => {
    expect(verdict(49, 35)).toBe('49% — combina com a empresa');
  });

  it('diz o mínimo quando fica abaixo do corte', () => {
    expect(verdict(28, 35)).toBe('28% — abaixo do mínimo de 35%');
  });

  it('trata o corte exato como compatível', () => {
    expect(verdict(35, 35)).toBe('35% — combina com a empresa');
  });

  it('não transforma ausência de resposta em zero', () => {
    expect(verdict(null, 35)).toBe('ainda não respondeu');
    expect(verdictState(null, 35)).toBe('sem-resposta');
  });

  it('arredonda para o inteiro que a tela mostra', () => {
    expect(verdict(48.6, 35)).toBe('49% — combina com a empresa');
  });

  it('está disponível pelo glossário', () => {
    expect(COPY.verdict(49, 35)).toBe(verdict(49, 35));
  });
});

describe('missingAnswers', () => {
  it('conta o que já chegou, no formato da fala', () => {
    expect(missingAnswers(2, 5)).toBe('Faltam respostas — 2 de 5');
  });

  it('não pede respostas quando todas chegaram', () => {
    expect(missingAnswers(5, 5)).toBe('5 de 5 — respondido');
  });

  it('sem nada esperado, não há contagem a mostrar', () => {
    expect(missingAnswers(0, 0)).toBe('ainda não respondeu');
  });
});
