import type {
  AssistantProviderId,
  AssistantRequest,
  AssistantResponse
} from './types';

/**
 * Contrato que todo provedor de análise assistida cumpre, real ou
 * determinístico. Trocar de provider nunca deve exigir mudar a UI: ela só
 * conhece `run(request) → Promise<AssistantResponse>`.
 */
export type AssistantProvider = {
  id: AssistantProviderId;
  run(request: AssistantRequest): Promise<AssistantResponse>;
};
