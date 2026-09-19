'use client';

import { usePathname } from 'next/navigation';
import type { PlanFeatures } from '@/app/(protected)/layout';
import { UserNavDropdown } from '@/components/shell/user-nav-dropdown';
import type { WorkspaceItem } from '@/components/shell/workspace-switcher';
import { WorkspaceSwitcher } from '@/components/shell/workspace-switcher';
import type { Permissions } from '@/features/members/permissions';
import { useCurrentOrganizationSlug } from '@/hooks/use-current-organization-slug';

import { routes } from '@workspace/routes';
import { SidebarBackdrop, SidebarPanel, SidebarTrigger } from '@workspace/ui';

import { getBottomNavigation, getMainNavigation } from './sidebar-config';
import { SidebarNavLink } from './sidebar-nav-link';

type UserInfo = {
  name: string | null;
  email: string | null;
  image: string | null;
};

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
  organizations?: WorkspaceItem[];
  currentOrgSlug?: string | null;
  permissions: Permissions;
  planFeatures?: PlanFeatures;
  user?: UserInfo | null;
};

export function Sidebar({
  open = false,
  onClose,
  organizations = [],
  currentOrgSlug = null,
  permissions,
  planFeatures = { inviteMembers: false },
  user = null
}: SidebarProps) {
  const pathname = usePathname();
  const routeOrgSlug = useCurrentOrganizationSlug();
  const effectiveOrgSlug = routeOrgSlug ?? currentOrgSlug;
  const mainNav = getMainNavigation(effectiveOrgSlug ?? null);
  const bottomNav = getBottomNavigation(
    effectiveOrgSlug ?? null,
    permissions,
    planFeatures
  );

  return (
    <>
      <SidebarBackdrop
        open={open}
        onClose={onClose}
      />
      <SidebarPanel open={open}>
        <div className="flex h-full flex-col px-4 pt-4 pb-4">
          <div className="mb-4">
            <WorkspaceSwitcher
              organizations={organizations}
              currentSlug={effectiveOrgSlug}
              canManageOrganizations={permissions.updateOrgSettings}
            />
          </div>
          <nav className="space-y-1">
            {mainNav.map((item) => (
              <SidebarNavLink
                key={item.name}
                item={item}
                pathname={pathname}
                onClose={onClose}
              />
            ))}
          </nav>

          <div className="my-4 shrink-0 border-t border-[var(--color-sidebar-border)]" />

          <nav className="space-y-1">
            {bottomNav.map((item) => (
              <SidebarNavLink
                key={item.name}
                item={item}
                pathname={pathname}
                onClose={onClose}
              />
            ))}
          </nav>

          {user && (
            <>
              <div className="my-4 shrink-0 border-t border-[var(--color-sidebar-border)]" />
              <div className="mt-auto shrink-0 pt-2">
                <UserNavDropdown
                  user={{
                    name: user.name ?? undefined,
                    email: user.email ?? undefined,
                    image: user.image ?? undefined
                  }}
                  settingsHref={
                    effectiveOrgSlug
                      ? routes.dashboard.org(effectiveOrgSlug).settings.profile
                      : '/'
                  }
                  triggerExtra={
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.name ?? 'Usuário'}
                      </p>
                      {user.email ? (
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      ) : null}
                    </div>
                  }
                />
              </div>
            </>
          )}
        </div>
      </SidebarPanel>
    </>
  );
}

export function SidebarMobileTrigger({
  open,
  onToggle
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <SidebarTrigger
      open={open}
      onToggle={onToggle}
      openLabel="Abrir menu"
      closeLabel="Fechar menu"
    />
  );
}
