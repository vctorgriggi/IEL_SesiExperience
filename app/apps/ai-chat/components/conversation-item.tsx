'use client';

import { useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import Link from 'next/link';
import {
  BubbleChatIcon,
  Delete01Icon,
  Loading03Icon,
  PencilEdit01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, cn, Input } from '@workspace/ui';

import type { Conversation } from '~/types/conversation';

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  isDeleting: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  onRename: (id: string, title: string) => void;
  onAskDelete: (conversation: Conversation) => void;
};

export function ConversationItem({
  conversation,
  isActive,
  isDeleting,
  collapsed,
  onNavigate,
  onRename,
  onAskDelete
}: ConversationItemProps) {
  const [renameValue, setRenameValue] = useState<string | null>(null);

  const submitRename = (e: FormEvent) => {
    e.preventDefault();
    const value = renameValue;
    setRenameValue(null);
    if (value !== null) onRename(conversation.id, value);
  };

  const stop = (e: MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  if (renameValue !== null && !collapsed) {
    return (
      <form
        onSubmit={submitRename}
        className="px-2 py-1"
      >
        <Input
          autoFocus
          value={renameValue}
          maxLength={120}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={submitRename}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setRenameValue(null);
          }}
          aria-label="Renomear conversa"
        />
      </form>
    );
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg pr-1 text-sm transition-colors hover:bg-muted focus-within:bg-muted md:hover:bg-foreground/[0.06]',
        isActive
          ? 'bg-background font-medium text-foreground shadow-sm'
          : 'text-foreground/80',
        collapsed && 'justify-center pr-0'
      )}
    >
      <Link
        href={`/chat/${conversation.id}`}
        onClick={onNavigate}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-3 md:py-2.5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          collapsed && 'justify-center px-0'
        )}
        title={collapsed ? conversation.title : undefined}
      >
        <HugeiconsIcon
          icon={BubbleChatIcon}
          size={collapsed ? 18 : 14}
          className="shrink-0"
        />
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
        )}
      </Link>
      {!collapsed && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => stop(e, () => setRenameValue(conversation.title))}
            className="size-11 shrink-0 p-0 text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 md:size-8"
            aria-label={`Renomear ${conversation.title}`}
          >
            <HugeiconsIcon
              icon={PencilEdit01Icon}
              size={12}
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => stop(e, () => onAskDelete(conversation))}
            disabled={isDeleting}
            className="size-11 shrink-0 p-0 text-muted-foreground opacity-0 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-50 md:size-8"
            aria-label={`Apagar ${conversation.title}`}
          >
            <HugeiconsIcon
              icon={isDeleting ? Loading03Icon : Delete01Icon}
              size={12}
              className={isDeleting ? 'animate-spin' : undefined}
            />
          </Button>
        </>
      )}
    </div>
  );
}
