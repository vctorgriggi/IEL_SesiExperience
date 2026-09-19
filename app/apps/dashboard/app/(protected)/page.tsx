import { redirect } from 'next/navigation';
import { getUserOrganizations } from '@/features/organizations/data/get-user-organizations';

import { routes } from '@workspace/routes';

export default async function ProtectedRootPage() {
  const organizations = await getUserOrganizations();
  if (organizations.length === 0) {
    redirect(routes.dashboard.onboarding.index);
  }
  redirect(routes.dashboard.org(organizations[0].slug).home);
}
