'use client';

import type { ReactNode } from 'react';
import { useMemo, useTransition } from 'react';
import {
  AUTH_SETTINGS_PATH,
  SIGN_OUT_CALLBACK_URL
} from '@/features/auth/constants';
import { Logout01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { signOut } from 'next-auth/react';

import { cn, PopupMenu, type MenuItem } from '@workspace/ui';

interface UserNavDropdownUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserNavDropdownProps {
  user: UserNavDropdownUser;
  settingsHref?: string;
  className?: string;
  triggerExtra?: ReactNode;
}

export function UserNavDropdown({
  user,
  settingsHref = AUTH_SETTINGS_PATH,
  className,
  triggerExtra
}: UserNavDropdownProps) {
  const [isPending, startTransition] = useTransition();

  async function handleSignOut() {
    startTransition(async () => {
      try {
        await signOut({
          callbackUrl: SIGN_OUT_CALLBACK_URL,
          redirect: true
        });
      } catch {
        window.location.assign(SIGN_OUT_CALLBACK_URL);
      }
    });
  }

  const model: MenuItem[] = useMemo(
    () => [
      {
        label: 'Configurações',
        icon: (
          <HugeiconsIcon
            icon={Settings01Icon}
            size={18}
            className="shrink-0"
          />
        ),
        url: settingsHref
      },
      { separator: true },
      {
        label: isPending ? 'Saindo...' : 'Sair',
        icon: (
          <HugeiconsIcon
            icon={Logout01Icon}
            size={18}
            className="shrink-0"
          />
        ),
        command: () => handleSignOut(),
        disabled: isPending
      }
    ],
    [settingsHref, isPending]
  );

  const hasTriggerExtra = triggerExtra != null;

  return (
    <PopupMenu
      model={model}
      className={className}
      trigger={({ toggle, id }) => (
        <button
          type="button"
          onClick={toggle}
          aria-controls={id}
          aria-haspopup="menu"
          aria-label="Menu do usuário"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg border border-transparent text-left outline-none transition-colors focus:ring-2 focus:ring-primary/50',
            hasTriggerExtra
              ? 'min-w-0 py-1.5 pr-1 hover:bg-muted'
              : 'size-9 shrink-0 justify-center overflow-hidden rounded-full border-primary bg-background'
          )}
        >
          <span
            className={cn(
              'inline-flex shrink-0 overflow-hidden rounded-full border border-primary bg-background',
              hasTriggerExtra ? 'size-8' : 'size-9'
            )}
          >
            {user.image ? (
              <img
                src={user.image}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {(user.name ?? 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </span>
          {hasTriggerExtra && triggerExtra}
        </button>
      )}
    />
  );
}
