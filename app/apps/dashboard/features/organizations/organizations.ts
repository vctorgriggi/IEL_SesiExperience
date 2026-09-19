import type { UserOrganization } from '@/features/organizations/types';
import { apiGet } from '@/lib/api-client';

import { api } from '@workspace/routes';

export async function getMyOrganizationsClient(): Promise<UserOrganization[]> {
  const data = await apiGet<UserOrganization[]>(api.users.myOrganizations());
  return data ?? [];
}
