'use client';

import { createContext, useMemo } from 'react';

import type { getAuthOrganizationContext } from '@workspace/auth/context';

export type OrganizationLayoutContextValue = Awaited<
  ReturnType<typeof getAuthOrganizationContext>
>;

const OrganizationLayoutContext =
  createContext<OrganizationLayoutContextValue | null>(null);

export function OrganizationLayoutProvider({
  session,
  organization,
  children
}: {
  session: OrganizationLayoutContextValue['session'];
  organization: OrganizationLayoutContextValue['organization'];
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({ session, organization }),
    [session, organization]
  );
  return (
    <OrganizationLayoutContext.Provider value={value}>
      {children}
    </OrganizationLayoutContext.Provider>
  );
}
