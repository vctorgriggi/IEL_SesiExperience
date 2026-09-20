import type { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { routes } from '@workspace/routes';

/** Rota /support só para admin/owner. Member é redirecionado para Home. */
export default async function SupportLayout({ children }: PropsWithChildren) {
  const membership = await getCurrentMembership();
  const permissions = can(membership);

  if (!permissions.viewSupport) {
    redirect(routes.dashboard.painel);
  }

  return <>{children}</>;
}
