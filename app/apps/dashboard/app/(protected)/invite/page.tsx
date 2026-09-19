import { redirect } from 'next/navigation';
import { getUserOrganizations } from '@/features/organizations/data/get-user-organizations';

import { routes } from '@workspace/routes';

export default async function InvitePage() {
  const organizations = await getUserOrganizations();
  const slug = organizations[0]?.slug ?? null;

  if (!slug) {
    redirect(routes.dashboard.onboarding.index);
  }

  redirect(routes.dashboard.org(slug).settings.members);
}
