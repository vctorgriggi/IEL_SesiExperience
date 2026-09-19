import { describe, expect, it, vi } from 'vitest';

import { buildInitialDemoState } from '../fixtures';
import { getJob } from '../state/selectors';
import { anthropicProvider } from './anthropic-provider';
import { buildAssistantRequestPayload } from './build-request';
import { deterministicProvider } from './deterministic-provider';

vi.mock('server-only', () => ({}));

vi.mock('@/env', () => ({
  env: { IEL_AI_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'sk-ant-test' }
}));

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn()
}));

vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create: mockCreate };
  }
}));

function buildRequest() {
  const state = buildInitialDemoState();
  const job = getJob('VAG-01')!;
  return buildAssistantRequestPayload(
    state,
    job.id,
    ['CAND-01'],
    'resumir-selecao'
  );
}

describe('anthropicProvider (chamada real ao modelo, SDK mockado)', () => {
  it('cai para o determinístico quando o JSON do modelo é inválido', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'isto não é JSON válido {' }]
    });

    const request = buildRequest();
    const expected = await deterministicProvider.run(request);
    const response = await anthropicProvider.run(request);

    expect(response.provider).toBe('deterministic');
    expect(response.text).toBe(expected.text);
  });

  it('cai para o determinístico quando o JSON não atende ao schema esperado', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        { type: 'text', text: JSON.stringify({ resumo: 'campo errado' }) }
      ]
    });

    const response = await anthropicProvider.run(buildRequest());

    expect(response.provider).toBe('deterministic');
  });

  it('cai para o determinístico quando a chamada ao SDK falha', async () => {
    mockCreate.mockRejectedValueOnce(new Error('network down'));

    const response = await anthropicProvider.run(buildRequest());

    expect(response.provider).toBe('deterministic');
  });

  it('usa a resposta do modelo quando o JSON é válido', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            text: 'Resumo gerado pelo modelo.',
            citations: [{ evidenceId: 'EVD-ANA-01', label: 'Currículo' }]
          })
        }
      ]
    });

    const response = await anthropicProvider.run(buildRequest());

    expect(response.provider).toBe('anthropic');
    expect(response.text).toBe('Resumo gerado pelo modelo.');
    expect(response.citations).toEqual([
      { evidenceId: 'EVD-ANA-01', label: 'Currículo' }
    ]);
  });
});
