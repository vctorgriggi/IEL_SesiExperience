'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Logout01Icon,
  Menu01Icon,
  Settings01Icon,
  SidebarLeft01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { APP_NAME } from '@workspace/common/app';
import { routes } from '@workspace/routes';
import { Button, cn } from '@workspace/ui';

import { signOutAction } from '~/features/auth/actions/sign-out';
import { ChatModelSelector, type ChatModel } from './chat-model-selector';

export type Balance = { freeRemaining: number; credits: number };

type ChatHeaderProps = {
  title?: string;
  model: ChatModel;
  availableModels: readonly ChatModel[];
  onModelChange: (model: ChatModel) => void;
  modelSelectorDisabled?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
  onSidebarCollapseToggle?: () => void;
  balance?: Balance | null;
  onBuyCredits?: () => void;
  className?: string;
};

function BalancePill({
  balance,
  onBuy
}: {
  balance: Balance;
  onBuy?: () => void;
}) {
  const remaining =
    balance.freeRemaining > 0 ? balance.freeRemaining : balance.credits;
  const label =
    balance.freeRemaining > 0 ? 'mensagens grátis' : 'mensagens compradas';
  const empty = remaining === 0;

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
          empty
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-border bg-muted text-foreground'
        )}
      >
        <span
          className={cn(
            'font-semibold tabular-nums',
            empty ? 'text-destructive' : 'text-foreground'
          )}
        >
          {remaining}
        </span>
        {label}
      </span>
      {onBuy && (
        <Button
          type="button"
          variant="outline"
          onClick={onBuy}
          className="h-11 px-3 text-xs md:h-8"
        >
          Comprar
        </Button>
      )}
    </div>
  );
}

export function ChatHeader({
  title,
  model,
  availableModels,
  onModelChange,
  modelSelectorDisabled,
  user,
  onSidebarToggle,
  sidebarCollapsed,
  onSidebarCollapseToggle,
  balance,
  onBuyCredits,
  className
}: ChatHeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setUserMenuOpen((open) => {
        if (open) userButtonRef.current?.focus();
        return false;
      });
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background px-4',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onSidebarToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="size-11 shrink-0 md:hidden"
            aria-label="Abrir menu"
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              size={20}
            />
          </Button>
        )}
        {onSidebarCollapseToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onSidebarCollapseToggle}
            aria-expanded={!sidebarCollapsed}
            className="hidden size-9 shrink-0 md:flex"
            aria-label={
              sidebarCollapsed
                ? 'Expandir barra lateral'
                : 'Recolher barra lateral'
            }
          >
            <HugeiconsIcon
              icon={SidebarLeft01Icon}
              size={18}
            />
          </Button>
        )}
        <Link
          href="/chat"
          className="inline-flex shrink-0 items-center rounded-md py-2.5 font-semibold text-foreground hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {APP_NAME}
        </Link>
        {title && (
          <>
            <span
              aria-hidden
              className="hidden shrink-0 text-border md:inline"
            >
              /
            </span>
            <span className="hidden min-w-0 truncate text-sm text-muted-foreground md:inline">
              {title}
            </span>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {balance && (
          <BalancePill
            balance={balance}
            onBuy={onBuyCredits}
          />
        )}
        <ChatModelSelector
          value={model}
          models={availableModels}
          onChange={onModelChange}
          disabled={modelSelectorDisabled}
        />
        {user && (
          <div
            className="relative"
            ref={userMenuRef}
          >
            <Button
              ref={userButtonRef}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label="Menu do usuário"
              className="size-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted/50 p-0 md:size-9"
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-sm font-medium text-muted-foreground">
                  {(user.name ?? user.email ?? 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </Button>
            {userMenuOpen && (
              <ul
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 min-w-[11rem] rounded-xl border border-border bg-popover py-1 shadow-lg"
              >
                <li
                  role="none"
                  className="border-b border-border px-3 pb-2 pt-1"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.name ?? 'Sua conta'}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </li>
                <li
                  role="none"
                  className="pt-1"
                >
                  <Link
                    href={routes.aiChat.settings}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:bg-muted"
                  >
                    <HugeiconsIcon
                      icon={Settings01Icon}
                      size={18}
                      className="shrink-0"
                    />
                    Configurações
                  </Link>
                </li>
                <li
                  role="none"
                  className="mt-1 border-t border-border pt-1"
                >
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                    >
                      <HugeiconsIcon
                        icon={Logout01Icon}
                        size={18}
                        className="shrink-0"
                      />
                      Sair
                    </button>
                  </form>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
