import 'server-only';

import type { UserOrganization } from '@/features/organizations/types';

import { getAuthContext } from '@workspace/auth/context';

import { getOrganizationsByUserId } from './get-organizations-by-user-id';

/**
 * Organizações do usuário atual no contexto da requisição (RSC/layouts).
 */
export async function getUserOrganizations(): Promise<UserOrganization[]> {
  const ctx = await getAuthContext();
  const userId = ctx.session?.user?.id;
  if (!userId) {
    return [];
  }
  return getOrganizationsByUserId(userId);
}
