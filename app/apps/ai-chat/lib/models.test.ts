import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CHAT_MODEL,
  modelLabel,
  modelProvider,
  modelsForProviders,
  parseChatModel,
  resolveDefaultModel
} from './models';

describe('parseChatModel', () => {
  it('aceita ids do catálogo', () => {
    expect(parseChatModel('gpt-4o')).toBe('gpt-4o');
    expect(parseChatModel('claude-sonnet-5')).toBe('claude-sonnet-5');
  });

  it('rejeita o que não está no catálogo', () => {
    expect(parseChatModel('gpt-5-turbo')).toBeNull();
    expect(parseChatModel('gpt-4o ')).toBeNull();
    expect(parseChatModel('')).toBeNull();
    expect(parseChatModel(null)).toBeNull();
    expect(parseChatModel(undefined)).toBeNull();
  });
});

describe('modelsForProviders', () => {
  it('lista só os modelos do provider configurado', () => {
    const openaiOnly = modelsForProviders(['openai']);
    expect(openaiOnly.length).toBeGreaterThan(0);
    expect(openaiOnly.every((m) => modelProvider(m) === 'openai')).toBe(true);

    const anthropicOnly = modelsForProviders(['anthropic']);
    expect(anthropicOnly.length).toBeGreaterThan(0);
    expect(anthropicOnly.every((m) => modelProvider(m) === 'anthropic')).toBe(
      true
    );
  });

  it('com os dois providers lista os dois catálogos', () => {
    const both = modelsForProviders(['openai', 'anthropic']);
    expect(both.length).toBe(
      modelsForProviders(['openai']).length +
        modelsForProviders(['anthropic']).length
    );
  });

  it('sem provider configurado não lista nada', () => {
    expect(modelsForProviders([])).toEqual([]);
  });
});

describe('resolveDefaultModel', () => {
  it('prefere o padrão quando ele está habilitado', () => {
    expect(resolveDefaultModel(modelsForProviders(['openai']))).toBe(
      DEFAULT_CHAT_MODEL
    );
  });

  it('cai no primeiro disponível quando o padrão não está', () => {
    const anthropicOnly = modelsForProviders(['anthropic']);
    const resolved = resolveDefaultModel(anthropicOnly);
    expect(resolved).toBe(anthropicOnly[0]);
    expect(resolved).not.toBe(DEFAULT_CHAT_MODEL);
  });

  it('retorna null sem nenhum provider', () => {
    expect(resolveDefaultModel([])).toBeNull();
  });
});

describe('modelLabel', () => {
  it('todo modelo do catálogo tem label', () => {
    for (const model of modelsForProviders(['openai', 'anthropic'])) {
      expect(modelLabel(model).length).toBeGreaterThan(0);
    }
  });
});
