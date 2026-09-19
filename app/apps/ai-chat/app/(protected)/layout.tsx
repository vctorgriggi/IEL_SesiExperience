import type { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { dedupedAuth } from '@workspace/auth';
import { getRequestStoragePathname } from '@workspace/auth/redirect';

export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const session = await dedupedAuth();

  if (!session) {
    const path = getRequestStoragePathname() ?? '/chat';
    const params = new URLSearchParams({ callbackUrl: path });
    redirect(`/sign-in?${params}`);
  }

  return <>{children}</>;
}
