import { describe, expect, it } from 'vitest';

import {
  compareSelection,
  missingInformation,
  summarizeSelection
} from '../analysis/assistant';
import { buildInitialDemoState } from '../fixtures';
import { getJob } from '../state/selectors';
import { buildAssistantRequestPayload } from './build-request';
import { deterministicProvider } from './deterministic-provider';

describe('deterministicProvider (envolve analysis/assistant.ts)', () => {
  it('produz o mesmo texto que summarizeSelection para a mesma seleção', async () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const applicationIds = ['CAND-01'];

    const expected = summarizeSelection(state, job, applicationIds);
    const request = buildAssistantRequestPayload(
      state,
      job.id,
      applicationIds,
      'resumir-selecao'
    );

    const response = await deterministicProvider.run(request);

    expect(response.text).toBe(
      [expected.title, ...expected.paragraphs].join('\n\n')
    );
    expect(response.provider).toBe('deterministic');
    expect(response.citations.map((c) => c.evidenceId).sort()).toEqual(
      [...expected.usedRecords].sort()
    );
  });

  it('produz o mesmo texto que compareSelection', async () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const applicationIds = ['CAND-01', 'CAND-04'];

    const expected = compareSelection(state, job, applicationIds);
    const request = buildAssistantRequestPayload(
      state,
      job.id,
      applicationIds,
      'comparar-selecionados'
    );

    const response = await deterministicProvider.run(request);

    expect(response.text).toBe(
      [expected.title, ...expected.paragraphs].join('\n\n')
    );
  });

  it('produz o mesmo texto que missingInformation', async () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const applicationIds = ['CAND-01'];

    const expected = missingInformation(state, job, applicationIds);
    const request = buildAssistantRequestPayload(
      state,
      job.id,
      applicationIds,
      'mostrar-lacunas'
    );

    const response = await deterministicProvider.run(request);

    expect(response.text).toBe(
      [expected.title, ...expected.paragraphs].join('\n\n')
    );
  });

  it('respeita o limite de três candidaturas no pedido', () => {
    const state = buildInitialDemoState();
    const job = getJob('VAG-01')!;
    const request = buildAssistantRequestPayload(
      state,
      job.id,
      ['CAND-01', 'CAND-04'],
      'comparar-selecionados'
    );

    expect(request.applicationIds.length).toBeLessThanOrEqual(3);
    expect(request.applications).toHaveLength(2);
  });
});
