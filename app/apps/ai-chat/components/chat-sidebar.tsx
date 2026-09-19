'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Add01Icon,
  BookOpen01Icon,
  Cancel01Icon,
  Loading03Icon,
  Search01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  Button,
  cn,
  ConfirmationModal,
  EmptyState,
  Input,
  useMediaQuery
} from '@workspace/ui';

import { ConversationItem } from '~/components/conversation-item';
import { useConversationList } from '~/hooks/use-conversation-list';
import {
  DATE_GROUP_LABELS,
  groupConversationsByDate,
  type DateGroup
} from '~/lib/group-conversations-by-date';
import type { ChatModel } from '~/lib/models';
import type { Conversation } from '~/types/conversation';

type ChatSidebarProps = {
  conversations: Conversation[];
  currentId?: string | null;
  defaultModel: ChatModel;
  /** Cursor da próxima página; `null` quando a lista acabou. */
  nextCursor: string | null;
  onConversationsChange: (conversations: Conversation[]) => void;
  onNextCursorChange: (cursor: string | null) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  canOpenKnowledge?: boolean;
  collapsed?: boolean;
};

const GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'last7', 'older'];

export function ChatSidebar({
  conversations,
  currentId,
  defaultModel,
  nextCursor,
  onConversationsChange,
  onNextCursorChange,
  isMobileOpen = false,
  onMobileClose,
  canOpenKnowledge,
  collapsed = false
}: ChatSidebarProps) {
  const pathname = usePathname();
  // No servidor não existe tela nem localStorage: renderizar já com a
  // preferência do cliente faria o HTML divergir e a árvore ser recriada,
  // perdendo os handlers. Só depois de montar essas fontes valem.
  const [mounted, setMounted] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => setMounted(true), []);
  const [pendingDelete, setPendingDelete] = useState<Conversation | null>(null);

  const list = useConversationList({
    conversations,
    defaultModel,
    nextCursor,
    onConversationsChange,
    onNextCursorChange,
    onNavigate: onMobileClose
  });

  const grouped = groupConversationsByDate(list.visible);
  const canLoadMore = !list.hasSearch && nextCursor !== null;

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    await list.remove(id, currentId === id);
  };

  return (
    <>
      {onMobileClose && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
          style={{ display: isMobileOpen ? 'block' : 'none' }}
        />
      )}
      <aside
        inert={
          mounted && !isDesktop && onMobileClose && !isMobileOpen
            ? true
            : undefined
        }
        className={cn(
          'flex h-full flex-col border-r bg-background transition-all duration-200 md:bg-muted/30',
          'fixed left-0 top-0 z-50 md:relative',
          collapsed ? 'w-16' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-2 md:hidden">
          <span className="text-sm font-semibold">Conversas</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="size-11"
            aria-label="Fechar menu"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={20}
            />
          </Button>
        </div>

        <div
          className={cn(
            'flex border-b px-2 py-3',
            collapsed ? 'flex-col items-center gap-2' : 'items-center gap-2'
          )}
        >
          <Button
            type="button"
            variant={collapsed ? 'ghost' : 'default'}
            size={collapsed ? 'icon' : 'sm'}
            className={cn(
              collapsed
                ? 'size-11 shrink-0 md:size-9'
                : 'h-11 flex-1 gap-2 md:h-9'
            )}
            onClick={list.create}
            disabled={list.isCreating}
            aria-label="Nova conversa"
          >
            <HugeiconsIcon
              icon={list.isCreating ? Loading03Icon : Add01Icon}
              size={collapsed ? 18 : 16}
              className={list.isCreating ? 'animate-spin' : undefined}
            />
            {!collapsed && <span className="truncate">Nova conversa</span>}
          </Button>
        </div>

        {!collapsed && (
          <div className="border-b px-2 py-2">
            <label
              htmlFor="busca-conversas"
              className="sr-only"
            >
              Buscar conversas
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="busca-conversas"
                type="search"
                value={list.searchQuery}
                onChange={(e) => list.setSearchQuery(e.target.value)}
                placeholder="Buscar conversas..."
                className="h-11 pl-8"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {list.visible.length === 0 ? (
            !collapsed && (
              <EmptyState
                className="border-none bg-transparent"
                title={
                  list.hasSearch
                    ? 'Nenhuma conversa encontrada'
                    : 'Nenhuma conversa ainda'
                }
                description={
                  list.hasSearch
                    ? 'Tente outro termo de busca.'
                    : 'Comece uma conversa nova para vê-la aqui.'
                }
              />
            )
          ) : (
            <ul className="space-y-4">
              {GROUP_ORDER.map((groupKey) => {
                const items = grouped[groupKey];
                if (items.length === 0) return null;
                return (
                  <li key={groupKey}>
                    {!collapsed && (
                      <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                        {DATE_GROUP_LABELS[groupKey]}
                      </p>
                    )}
                    <ul className="space-y-0.5">
                      {items.map((conversation) => (
                        <li key={conversation.id}>
                          <ConversationItem
                            conversation={conversation}
                            isActive={currentId === conversation.id}
                            isDeleting={list.deletingId === conversation.id}
                            collapsed={collapsed}
                            onNavigate={onMobileClose}
                            onRename={list.rename}
                            onAskDelete={setPendingDelete}
                          />
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}

          {canLoadMore && !collapsed && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={list.loadMore}
              disabled={list.isLoadingMore}
              className="mt-3 w-full justify-center text-xs text-muted-foreground"
            >
              {list.isLoadingMore ? 'Carregando...' : 'Carregar mais'}
            </Button>
          )}
        </nav>

        {canOpenKnowledge && (
          <div className="border-t p-2">
            <Link
              href={routes.aiChat.knowledge}
              onClick={onMobileClose}
              aria-label="Base de conhecimento"
              className={cn(
                'flex h-11 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                pathname === '/knowledge' && 'bg-muted text-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <HugeiconsIcon
                icon={BookOpen01Icon}
                size={18}
                className="shrink-0"
              />
              {!collapsed && <span>Base de conhecimento</span>}
            </Link>
          </div>
        )}
      </aside>

      <ConfirmationModal
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Apagar conversa"
        description={`"${pendingDelete?.title ?? ''}" e todas as mensagens dela serão apagadas. Não dá pra desfazer.`}
        confirmText="Apagar"
        cancelText="Cancelar"
        variant="destructive"
        loading={list.deletingId !== null}
        onConfirm={confirmDelete}
      />
    </>
  );
}
