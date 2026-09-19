'use client';

import { useState } from 'react';
import type { PlanFeatures } from '@/app/(protected)/layout';
import { BreadcrumbProvider } from '@/components/layout/breadcrumb';
import { OrgSwitchLoader } from '@/components/shell/org-switch-loader';
import { ProtectedHeader } from '@/components/shell/protected-header';
import type { WorkspaceItem } from '@/components/shell/workspace-switcher';
import type { Permissions } from '@/features/members/permissions';
import type { UserOrganization } from '@/features/organizations/types';

import { Sidebar } from './sidebar';
import { SidebarStateProvider } from './sidebar/sidebar-context';

type UserInfo = {
  name: string | null;
  email: string | null;
  image: string | null;
};

export type ProtectedLayoutClientProps = {
  children: React.ReactNode;
  currentOrgSlug?: string | null;
  organizations: UserOrganization[];
  hideSidebar?: boolean;
  permissions: Permissions;
  planFeatures?: PlanFeatures;
  user?: UserInfo | null;
};

export function ProtectedLayoutClient({
  children,
  currentOrgSlug = null,
  organizations,
  hideSidebar = false,
  permissions,
  planFeatures = { inviteMembers: false },
  user = null
}: ProtectedLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const workspaceItems: WorkspaceItem[] = organizations;
  const showSidebar = !hideSidebar;

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <>
      <OrgSwitchLoader />
      <BreadcrumbProvider>
        {!showSidebar ? (
          <div className="flex h-screen flex-col">
            <main className="flex-1 overflow-auto bg-background">
              {children}
            </main>
          </div>
        ) : (
          <SidebarStateProvider
            open={mobileOpen}
            onClose={closeMobile}
            onToggle={toggleMobile}
          >
            <div className="flex h-screen w-full max-w-full min-w-0 bg-background overflow-x-hidden">
              <Sidebar
                open={mobileOpen}
                onClose={closeMobile}
                organizations={workspaceItems}
                currentOrgSlug={currentOrgSlug}
                permissions={permissions}
                planFeatures={planFeatures}
                user={user}
              />

              <div className="flex min-w-0 flex-1 flex-col w-full min-w-0 max-w-full overflow-x-hidden lg:pl-58">
                <ProtectedHeader
                  sidebarOpen={mobileOpen}
                  onSidebarToggle={toggleMobile}
                />

                <main className="min-h-0 flex-1 overflow-auto min-w-0">
                  {children}
                </main>
              </div>
            </div>
          </SidebarStateProvider>
        )}
      </BreadcrumbProvider>
    </>
  );
}
