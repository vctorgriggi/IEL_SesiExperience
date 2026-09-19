/** Cliente de API do dashboard (same-origin; base URL vazia). */
import {
  createApiClient,
  withOrg,
  type ApiClientOptions
} from '@workspace/common/api-client';

const api = createApiClient('');

export type { ApiClientOptions };
export { withOrg };
export const {
  apiFetch,
  apiGet,
  apiPost,
  apiPatch,
  apiPut,
  apiDelete,
  handleApiResponse
} = api;
