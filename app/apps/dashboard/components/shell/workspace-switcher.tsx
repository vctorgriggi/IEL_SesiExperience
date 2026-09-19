'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { openCreateOrganizationModal } from '@/components/onboarding/create-organization-modal';
import { Add01Icon, ArrowUpDownIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { APP_NAME } from '@workspace/common/app';
import { routes } from '@workspace/routes';
import { cn, PopupMenu, type MenuItem } from '@workspace/ui';

import { dispatchOrgSwitchStart } from './org-switch-loader';

export type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

type WorkspaceSwitcherProps = {
  organizations: WorkspaceItem[];
  currentSlug: string | null;
  canManageOrganizations?: boolean;
};

function renderOrgMenuItem(
  item: MenuItem,
  _options: { onClick: (e: React.SyntheticEvent) => void }
) {
  const data = item.data as
    | { org: WorkspaceItem; currentSlug: string | null }
    | undefined;
  if (!data) return item.label;
  const { org, currentSlug } = data;
  const isCurrent = org.slug === currentSlug;
  return (
    <span
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
        isCurrent
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {org.logo ? (
        <Image
          src={org.logo}
          alt=""
          width={24}
          height={24}
          className="size-6 shrink-0 rounded-full object-cover"
          unoptimized={org.logo.startsWith('http')}
        />
      ) : (
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-semibold">
          {org.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span
        className="truncate text-[13px] font-bold leading-[18px] text-primary"
        style={{ fontFamily: 'var(--font-nunito)' }}
      >
        {org.name}
      </span>
    </span>
  );
}

export function WorkspaceSwitcher({
  organizations,
  currentSlug,
  canManageOrganizations = true
}: WorkspaceSwitcherProps) {
  const router = useRouter();

  const current =
    organizations.find((o) => o.slug === currentSlug) ?? organizations[0];
  const displayName = current?.name ?? `${APP_NAME} - Espaço de trabalho`;

  const handleCreateNew = () => {
    openCreateOrganizationModal();
  };

  const model: MenuItem[] = useMemo(() => {
    const orgItems: MenuItem[] = organizations.map((org) => ({
      label: org.name,
      data: { org, currentSlug },
      template: renderOrgMenuItem,
      command: () => {
        if (org.slug === currentSlug) return;
        dispatchOrgSwitchStart();
        router.push(routes.dashboard.select(org.slug));
      }
    }));
    const createItem: MenuItem = {
      label: 'Criar nova organização',
      icon: (
        <HugeiconsIcon
          icon={Add01Icon}
          size={18}
          className="shrink-0"
        />
      ),
      command: () => handleCreateNew()
    };
    if (canManageOrganizations) {
      return [...orgItems, { separator: true }, createItem];
    }
    return orgItems;
  }, [organizations, currentSlug, canManageOrganizations, router]);

  if (organizations.length === 0) {
    const href = canManageOrganizations
      ? routes.dashboard.index
      : routes.dashboard.index;
    return (
      <Link
        href={href}
        className="flex items-center gap-2 rounded-full border-1 border-primary/80 bg-base-100 px-3 py-1.5 transition-opacity hover:opacity-90 min-w-0"
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-semibold">
          A
        </span>
        <span
          className="truncate text-[13px] font-bold leading-[18px] text-primary"
          style={{ fontFamily: 'var(--font-nunito)' }}
        >
          {APP_NAME} - Espaço de trabalho
        </span>
        <HugeiconsIcon
          icon={ArrowUpDownIcon}
          size={16}
          className="shrink-0 text-base-content/70"
        />
      </Link>
    );
  }

  return (
    <PopupMenu
      model={model}
      className="w-full min-w-0"
      trigger={({ toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-controls={id}
          aria-haspopup="listbox"
          aria-label="Trocar workspace"
          className={cn(
            'flex w-full items-center gap-2 rounded-full border-1 border-primary/30 bg-base-100 px-3 py-1.5 text-left transition-shadow min-w-0',
            'focus:ring-2 focus:ring-primary/30 focus:outline-none'
          )}
        >
          {current?.logo ? (
            <span className="flex size-7 shrink-0 overflow-hidden rounded-full bg-primary">
              <Image
                src={current.logo}
                alt=""
                width={28}
                height={28}
                className="size-full object-cover"
                unoptimized={current.logo.startsWith('http')}
              />
            </span>
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content text-xs font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span
            className="flex-1 truncate text-[13px] font-bold leading-[18px] text-primary"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            {displayName}
          </span>
          <HugeiconsIcon
            icon={ArrowUpDownIcon}
            size={16}
            className="shrink-0 text-base-content/70"
          />
        </button>
      )}
    />
  );
}
