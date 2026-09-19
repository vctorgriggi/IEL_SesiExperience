import type { PlanFeatures } from '@/app/(protected)/layout';
import { getEventsIndexPath } from '@/features/events/routing/event-navigation';
import type { Permissions } from '@/features/members/permissions';
import {
  Calendar01Icon,
  Calendar03Icon,
  DashboardSquare01Icon,
  HeadphonesIcon,
  Location01Icon,
  Settings01Icon,
  UserAdd01Icon
} from '@hugeicons/core-free-icons';

import { routes } from '@workspace/routes';

export type SidebarNavItem = {
  name: string;
  href: string;
  icon: typeof DashboardSquare01Icon;
  matchType?: 'dashboard' | 'settings' | 'calendar' | 'events' | 'map';
};

export function getMainNavigation(
  currentOrgSlug: string | null
): SidebarNavItem[] {
  return [
    {
      name: 'Painel',
      href: currentOrgSlug ? routes.dashboard.org(currentOrgSlug).home : '/',
      icon: DashboardSquare01Icon,
      matchType: 'dashboard'
    },
    {
      name: 'Calendário',
      href: currentOrgSlug
        ? routes.dashboard.org(currentOrgSlug).calendar.index
        : '/',
      icon: Calendar03Icon,
      matchType: 'calendar'
    },
    {
      name: 'Eventos',
      href: currentOrgSlug ? getEventsIndexPath(currentOrgSlug) : '/',
      icon: Calendar01Icon,
      matchType: 'events'
    },
    {
      name: 'Mapa',
      href: currentOrgSlug
        ? routes.dashboard.org(currentOrgSlug).map.index
        : '/',
      icon: Location01Icon,
      matchType: 'map'
    }
  ];
}

export function getBottomNavigation(
  currentOrgSlug: string | null,
  permissions: Permissions,
  planFeatures: PlanFeatures = { inviteMembers: false }
): SidebarNavItem[] {
  const items: SidebarNavItem[] = [];

  if (permissions.inviteMembers && planFeatures.inviteMembers) {
    items.push({
      name: 'Convidar membros',
      href: currentOrgSlug
        ? routes.dashboard.org(currentOrgSlug).settings.members
        : '/',
      icon: UserAdd01Icon
    });
  }

  if (permissions.viewSupport) {
    items.push({
      name: 'Suporte',
      href: currentOrgSlug
        ? routes.dashboard.org(currentOrgSlug).support.index
        : '/',
      icon: HeadphonesIcon
    });
  }

  items.push({
    name: 'Configurações',
    href: currentOrgSlug
      ? routes.dashboard.org(currentOrgSlug).settings.index
      : '/',
    icon: Settings01Icon,
    matchType: 'settings'
  });

  return items;
}

export function isNavItemActive(
  pathname: string,
  item: SidebarNavItem
): boolean {
  if (item.matchType === 'dashboard') {
    return pathname === '/home' || pathname.endsWith('/home');
  }
  if (item.matchType === 'settings')
    return /^\/[^/]+\/settings(\/|$)/.test(pathname);
  if (item.matchType === 'calendar')
    return /^\/[^/]+\/calendar(\/|$|\?)/.test(pathname);
  if (item.matchType === 'events')
    return /^\/[^/]+\/events(\/|$)/.test(pathname);
  if (item.matchType === 'map') return /^\/[^/]+\/map(\/|$)/.test(pathname);
  return pathname === item.href;
}
