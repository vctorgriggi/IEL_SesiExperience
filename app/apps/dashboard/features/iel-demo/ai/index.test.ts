import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    IEL_AI_PROVIDER: undefined as string | undefined,
    ANTHROPIC_API_KEY: undefined as string | undefined
  }
}));

vi.mock('@/env', () => ({ env: mockEnv }));

// O SDK real não deve ser tocado nestes testes: só a seleção do provider.
vi.mock('@anthropic-ai/sdk', () => ({ default: vi.fn() }));

async function importGetAssistantProvider() {
  const mod = await import('./index');
  return mod.getAssistantProvider;
}

describe('getAssistantProvider (seleção por ambiente)', () => {
  it('nunca lança e usa o determinístico sem nenhuma variável de ambiente', async () => {
    mockEnv.IEL_AI_PROVIDER = undefined;
    mockEnv.ANTHROPIC_API_KEY = undefined;
    const getAssistantProvider = await importGetAssistantProvider();

    const provider = getAssistantProvider();

    expect(provider.id).toBe('deterministic');
  });

  it('usa o determinístico quando só o provider está setado, sem chave', async () => {
    mockEnv.IEL_AI_PROVIDER = 'anthropic';
    mockEnv.ANTHROPIC_API_KEY = undefined;
    const getAssistantProvider = await importGetAssistantProvider();

    expect(getAssistantProvider().id).toBe('deterministic');
  });

  it('usa o determinístico quando só a chave está setada, sem o provider', async () => {
    mockEnv.IEL_AI_PROVIDER = undefined;
    mockEnv.ANTHROPIC_API_KEY = 'sk-ant-test';
    const getAssistantProvider = await importGetAssistantProvider();

    expect(getAssistantProvider().id).toBe('deterministic');
  });

  it('usa o provider anthropic quando as duas variáveis estão presentes', async () => {
    mockEnv.IEL_AI_PROVIDER = 'anthropic';
    mockEnv.ANTHROPIC_API_KEY = 'sk-ant-test';
    const getAssistantProvider = await importGetAssistantProvider();

    expect(getAssistantProvider().id).toBe('anthropic');
  });
});
