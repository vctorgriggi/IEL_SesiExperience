import { redirect } from 'next/navigation';

import { getAuthOrganizationContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

export default async function OrganizationSlugIndexPage() {
  const ctx = await getAuthOrganizationContext();
  redirect(routes.dashboard.org(ctx.organization.slug).home);
}
