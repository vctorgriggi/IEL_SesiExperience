import { buildAssistantRequestPayload } from '@/features/iel-demo/ai/build-request';
import { buildInitialDemoState } from '@/features/iel-demo/fixtures';
import { getJob } from '@/features/iel-demo/state/selectors';
import { describe, expect, it } from 'vitest';

import { POST } from '../route';

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/iel/assistant', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

describe('POST /api/iel/assistant', () => {
  it('rejeita corpo que não é JSON', async () => {
    const req = new Request('http://localhost/api/iel/assistant', {
      method: 'POST',
      body: '{ isto não é json'
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejeita pedido sem os campos exigidos', async () => {
    const res = await POST(jsonRequest({ kind: 'resumir-selecao' }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('rejeita mais de três candidaturas selecionadas', async () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const payload = buildAssistantRequestPayload(
      state,
      job.id,
      ['CAND-01', 'CAND-02', 'CAND-03', 'CAND-04'],
      'comparar-selecionados'
    );

    const res = await POST(jsonRequest(payload));

    expect(res.status).toBe(400);
  });

  it('devolve 200 e uma resposta determinística para um pedido válido', async () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const payload = buildAssistantRequestPayload(
      state,
      job.id,
      ['CAND-01'],
      'resumir-selecao'
    );

    const res = await POST(jsonRequest(payload));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.provider).toBe('deterministic');
    expect(typeof body.text).toBe('string');
  });
});
