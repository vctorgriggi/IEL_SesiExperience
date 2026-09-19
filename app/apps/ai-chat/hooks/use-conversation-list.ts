'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@workspace/routes';
import { toast, useDebounce } from '@workspace/ui';

import { apiDelete, apiGet, apiPatch, apiPost } from '~/lib/api-client';
import type { ChatModel } from '~/lib/models';
import {
  CONVERSATIONS_PAGE_SIZE,
  DEFAULT_CONVERSATION_TITLE,
  type Conversation,
  type ConversationPage
} from '~/types/conversation';

const SEARCH_DEBOUNCE_MS = 300;

type Options = {
  conversations: Conversation[];
  defaultModel: ChatModel;
  nextCursor: string | null;
  onConversationsChange: (conversations: Conversation[]) => void;
  onNextCursorChange: (cursor: string | null) => void;
  onNavigate?: () => void;
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export function useConversationList({
  conversations,
  defaultModel,
  nextCursor,
  onConversationsChange,
  onNextCursorChange,
  onNavigate
}: Options) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = useDebounce(searchQuery.trim(), SEARCH_DEBOUNCE_MS);

  // Busca no servidor: o filtro local só enxerga as páginas já carregadas.
  useEffect(() => {
    if (!query) {
      setSearchResults(null);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const page = await apiGet<ConversationPage>(
          api.aiChat.conversations({ q: query, limit: CONVERSATIONS_PAGE_SIZE })
        );
        if (active) setSearchResults(page?.items ?? []);
      } catch {
        if (active) setSearchResults([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [query]);

  // Enquanto a busca não responde, o filtro local dá resposta imediata.
  const visible =
    searchResults ??
    (query
      ? conversations.filter((c) =>
          c.title.toLowerCase().includes(query.toLowerCase())
        )
      : conversations);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const page = await apiGet<ConversationPage>(
        api.aiChat.conversations({
          cursor: nextCursor,
          limit: CONVERSATIONS_PAGE_SIZE
        })
      );
      if (!page) return;
      onConversationsChange([...conversations, ...page.items]);
      onNextCursorChange(page.nextCursor);
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao carregar conversas.'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    conversations,
    isLoadingMore,
    nextCursor,
    onConversationsChange,
    onNextCursorChange
  ]);

  const create = async () => {
    setIsCreating(true);
    try {
      const conv = await apiPost<Conversation>(api.aiChat.conversations(), {
        title: DEFAULT_CONVERSATION_TITLE,
        model: defaultModel
      });
      if (!conv) return;
      onConversationsChange([conv, ...conversations]);
      router.push(`/chat/${conv.id}`);
      onNavigate?.();
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao criar conversa.'));
    } finally {
      setIsCreating(false);
    }
  };

  const remove = async (id: string, isCurrent: boolean) => {
    setDeletingId(id);
    try {
      await apiDelete(api.aiChat.byId(id));
      onConversationsChange(conversations.filter((c) => c.id !== id));
      setSearchResults((prev) =>
        prev ? prev.filter((c) => c.id !== id) : prev
      );
      if (isCurrent) {
        router.push('/chat');
        onNavigate?.();
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao deletar conversa.'));
    } finally {
      setDeletingId(null);
    }
  };

  const rename = async (id: string, rawTitle: string) => {
    const title = rawTitle.trim().slice(0, 120);
    if (!title) return;

    const previous = conversations.find((c) => c.id === id)?.title;
    if (title === previous) return;

    const apply = (value: string) => (list: Conversation[]) =>
      list.map((c) => (c.id === id ? { ...c, title: value } : c));

    // Otimista: o rename é barato e reverter é simples se o PATCH falhar.
    onConversationsChange(apply(title)(conversations));
    setSearchResults((prev) => (prev ? apply(title)(prev) : prev));

    try {
      await apiPatch(api.aiChat.byId(id), { title });
    } catch (err) {
      const revert = apply(previous ?? title);
      onConversationsChange(revert(conversations));
      setSearchResults((prev) => (prev ? revert(prev) : prev));
      toast.error(errorMessage(err, 'Erro ao renomear conversa.'));
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    visible,
    hasSearch: Boolean(query),
    isCreating,
    isLoadingMore,
    deletingId,
    create,
    loadMore,
    remove,
    rename
  };
}
