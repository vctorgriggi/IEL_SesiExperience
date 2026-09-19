import type { PropsWithChildren } from 'react';
import { OrganizationLayoutProvider } from '@/components/layout/organization-layout-provider';

import { getAuthOrganizationContext } from '@workspace/auth/context';

export default async function OrganizationSlugLayout({
  children
}: PropsWithChildren) {
  const ctx = await getAuthOrganizationContext();

  return (
    <OrganizationLayoutProvider
      session={ctx.session}
      organization={ctx.organization}
    >
      {children}
    </OrganizationLayoutProvider>
  );
}
