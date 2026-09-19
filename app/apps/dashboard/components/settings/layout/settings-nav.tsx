'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building01Icon,
  Cards01Icon,
  CircleLock01Icon,
  User02Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

const ACCOUNT_NAV = [
  { name: 'Perfil', href: 'profile', icon: User02Icon },
  { name: 'Segurança', href: 'security', icon: CircleLock01Icon }
];

const ORGANIZATION_NAV = [
  { name: 'Geral', href: 'general', icon: Building01Icon },
  { name: 'Cobrança', href: 'billing', icon: Cards01Icon },
  { name: 'Membros', href: 'members', icon: UserGroupIcon }
];

type SettingsNavProps = {
  baseSettings: string;
  showOrganizationNav?: boolean;
};

export function SettingsNav({
  baseSettings,
  showOrganizationNav = false
}: SettingsNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    const fullPath = `${baseSettings}/${href}`;
    return pathname === fullPath || pathname.startsWith(fullPath + '/');
  };

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-2.5 rounded-r-md border-l-2 py-2 pl-3 pr-2 text-sm transition-colors',
      isActive(href)
        ? 'border-primary font-medium text-foreground'
        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
    );

  return (
    <nav className="shrink-0 md:w-48">
      <div>
        <p className="mb-1.5 pl-3 text-xs font-medium text-muted-foreground">
          Conta
        </p>
        <ul className="space-y-0.5">
          {ACCOUNT_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={`${baseSettings}/${item.href}`}
                className={linkClass(item.href)}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={16}
                />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {showOrganizationNav && (
        <div className="mt-6 border-t border-border pt-6">
          <p className="mb-1.5 pl-3 text-xs font-medium text-muted-foreground">
            Organização
          </p>
          <ul className="space-y-0.5">
            {ORGANIZATION_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={`${baseSettings}/${item.href}`}
                  className={linkClass(item.href)}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={16}
                  />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
