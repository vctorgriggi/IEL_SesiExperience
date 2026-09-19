import {
  createApiClient,
  type ApiClientOptions
} from '@workspace/common/api-client';

const api = createApiClient('');

export type { ApiClientOptions };
export const { apiFetch, apiGet, apiPost, apiPatch, apiPut, apiDelete } = api;
