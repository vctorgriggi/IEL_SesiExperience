import 'server-only';

import { handleApiResponse } from '@/lib/api-client';
import { fetchSameOrigin } from '@/lib/fetch-same-origin';

import { api } from '@workspace/routes';

export type ValidateInvitationResult =
  | { valid: true; organizationName: string; role: string; email: string }
  | { valid: false };

export async function validateInvitationToken(
  token: string
): Promise<ValidateInvitationResult> {
  const res = await fetchSameOrigin(api.invitations.validate(token), {
    method: 'GET'
  });

  if (!res.ok) {
    return { valid: false };
  }

  const data = await handleApiResponse<ValidateInvitationResult>(res);

  return data ?? { valid: false };
}
