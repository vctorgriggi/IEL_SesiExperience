import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthLogo } from '@/components/layout/auth-logo';
import { getOrganizationsByUserId } from '@/features/organizations/data/get-organizations-by-user-id';
import { createTitle } from '@/lib/formatters';

import { dedupedAuth } from '@workspace/auth';
import { getRequestStoragePathname } from '@workspace/auth/redirect';
import { routes } from '@workspace/routes';

export const metadata: Metadata = {
  title: createTitle('Autenticação')
};

function isChangeEmailRoute(): boolean {
  const pathname = getRequestStoragePathname();
  const requestPrefix = routes.dashboard.auth.changeEmail.requestById('');

  return !!pathname && pathname.startsWith(requestPrefix);
}

export default async function AuthLayout({ children }: PropsWithChildren) {
  const session = await dedupedAuth();
  if (!isChangeEmailRoute() && session?.user?.id) {
    const orgs = await getOrganizationsByUserId(session.user.id);
    const slug = orgs[0]?.slug;

    if (!slug) {
      return redirect(routes.dashboard.onboarding.index);
    }

    return redirect(routes.dashboard.org(slug).home);
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-8 sm:px-6 sm:py-10 dark:bg-background">
      <div className="mx-auto flex w-full max-w-[400px] min-w-[320px] flex-col items-center gap-6">
        <Link
          href={routes.marketing.index}
          className="animate-auth-fade-in block w-fit mx-auto focus:outline-none"
        >
          <AuthLogo />
        </Link>
        {children}
      </div>
    </main>
  );
}
