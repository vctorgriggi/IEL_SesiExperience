'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { trackEvent } from '@workspace/analytics';
import { api } from '@workspace/routes';
import { toast } from '@workspace/ui';

import { useSidebarCollapsed } from '~/hooks/use-sidebar-collapsed';
import { apiGet, apiPatch, apiPost } from '~/lib/api-client';
import { parseChatModel, type ChatModel } from '~/lib/models';
import { toUIMessages } from '~/lib/ui-message';
import {
  DEFAULT_CONVERSATION_TITLE,
  type Conversation,
  type ConversationWithMessages
} from '~/types/conversation';
import { BuyCreditsDialog } from './buy-credits-dialog';
import type { Balance } from './chat-header';
import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';
import { ChatSidebar } from './chat-sidebar';
import { ChatWelcome } from './chat-welcome';
import { WelcomeDialog } from './onboarding/welcome-dialog';

type ChatShellProps = {
  /** Primeira página da lista de conversas. */
  conversations: Conversation[];
  nextCursor: string | null;
  initialConversation: ConversationWithMessages | null;
  /** Modelos habilitados no servidor e qual usar por padrão. */
  availableModels: readonly ChatModel[];
  defaultModel: ChatModel;
  knowledgeTopics: readonly string[];
  canOpenKnowledge?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
};

export function ChatShell({
  conversations: initialConversations,
  nextCursor: initialNextCursor,
  initialConversation,
  availableModels,
  defaultModel,
  knowledgeTopics,
  canOpenKnowledge,
  user = null
}: ChatShellProps) {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const sidebar = useSidebarCollapsed();
  const [conversationList, setConversationList] =
    useState<Conversation[]>(initialConversations);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor
  );
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(initialConversation?.id ?? null);
  const [model, setModel] = useState<ChatModel>(() => {
    // O modelo salvo na conversa pode não estar mais habilitado neste deploy.
    const saved = parseChatModel(initialConversation?.model);
    return saved && availableModels.includes(saved) ? saved : defaultModel;
  });
  const [input, setInput] = useState('');
  const [balance, setBalance] = useState<Balance | null>(null);
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  // Keep the current conversation id and model available inside async callbacks
  // (useChat's onFinish captures its initial closure) without stale reads.
  const conversationIdRef = useRef(currentConversationId);
  conversationIdRef.current = currentConversationId;
  const modelRef = useRef(model);
  modelRef.current = model;

  const fetchBalance = useCallback(async () => {
    try {
      const data = await apiGet<Balance>(api.aiChat.balance());
      setBalance(data ?? null);
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // O título é gerado no servidor depois da primeira resposta.
  const syncConversationTitle = useCallback(async () => {
    const convId = conversationIdRef.current;
    if (!convId) return;
    try {
      const conv = await apiGet<Conversation>(api.aiChat.byId(convId));
      if (!conv?.title) return;
      setConversationList((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: conv.title } : c))
      );
    } catch {
      // título continua o que está na lista
    }
  }, []);

  const { messages, sendMessage, status, stop, regenerate } = useChat({
    transport: new DefaultChatTransport({ api: api.chat() }),
    messages: initialConversation?.messages
      ? toUIMessages(initialConversation.messages)
      : undefined,
    onError: (err) => {
      const raw = err?.message ?? '';
      let message = 'Erro ao gerar resposta. Tente novamente.';
      let code: string | undefined;
      try {
        const parsed = JSON.parse(raw) as { error?: string; code?: string };
        if (parsed.error) message = parsed.error;
        code = parsed.code;
      } catch {
        if (raw) message = raw;
      }
      toast.error(message);
      if (code === 'NO_CREDITS' || code === 'DEMO_LIMIT') {
        setShowBuyCredits(true);
      }
    },
    // Quem grava a conversa é o servidor, no /api/chat: assim a resposta não
    // se perde se o usuário parar no meio ou fechar a aba.
    onFinish: () => {
      fetchBalance();
      syncConversationTitle();
    }
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const submitMessage = async (userMessage: string) => {
    const trimmed = userMessage.trim();
    if (!trimmed) return;

    let convId = currentConversationId;

    if (!convId) {
      try {
        const conv = await apiPost<Conversation>(api.aiChat.conversations(), {
          title: DEFAULT_CONVERSATION_TITLE,
          model
        });
        if (!conv) return;
        convId = conv.id;
        setCurrentConversationId(convId);
        conversationIdRef.current = convId;
        setConversationList((prev) => [conv, ...prev]);
        window.history.replaceState(null, '', `/chat/${convId}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Erro ao criar conversa.'
        );
        return;
      }
    }

    trackEvent('ai_chat_message_sent', { model });
    sendMessage({ text: trimmed }, { body: { model, conversationId: convId } });
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = input;
    setInput('');
    await submitMessage(value);
  };

  const handleSuggestionSelect = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleRegenerate = useCallback(() => {
    if (isLoading) return;
    // `regenerate: true` faz o servidor substituir a última resposta em vez de
    // acrescentar outra.
    regenerate({
      body: {
        model: modelRef.current,
        conversationId: conversationIdRef.current,
        regenerate: true
      }
    });
  }, [isLoading, regenerate]);

  const handleModelChange = (newModel: ChatModel) => {
    setModel(newModel);
    trackEvent('ai_chat_model_changed', { model: newModel });

    // Persiste a escolha para a conversa reabrir no mesmo modelo.
    const convId = conversationIdRef.current;
    if (!convId) return;
    void apiPatch(api.aiChat.byId(convId), { model: newModel }).catch(() => {
      // Trocar de modelo é uma preferência: se não gravar, a conversa continua
      // funcionando com o modelo escolhido nesta sessão.
    });
  };

  const currentTitle = currentConversationId
    ? (conversationList.find((c) => c.id === currentConversationId)?.title ??
      'Conversa')
    : DEFAULT_CONVERSATION_TITLE;

  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={conversationList}
        currentId={currentConversationId}
        defaultModel={defaultModel}
        nextCursor={nextCursor}
        onConversationsChange={setConversationList}
        onNextCursorChange={setNextCursor}
        isMobileOpen={sidebarMobileOpen}
        onMobileClose={() => setSidebarMobileOpen(false)}
        canOpenKnowledge={canOpenKnowledge}
        collapsed={sidebar.collapsed}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatHeader
          title={currentTitle}
          model={model}
          availableModels={availableModels}
          onModelChange={handleModelChange}
          modelSelectorDisabled={isLoading}
          user={user}
          onSidebarToggle={() => setSidebarMobileOpen((v) => !v)}
          sidebarCollapsed={sidebar.collapsed}
          onSidebarCollapseToggle={sidebar.toggle}
          balance={balance}
          onBuyCredits={() => setShowBuyCredits(true)}
        />

        {showWelcome ? (
          <ChatWelcome
            topics={knowledgeTopics}
            canOpenKnowledge={canOpenKnowledge}
            onSuggestionSelect={handleSuggestionSelect}
            disabled={isLoading}
          />
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            onRegenerate={handleRegenerate}
            isRegenerating={isLoading}
          />
        )}

        <ChatInput
          textareaRef={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onStop={stop}
        />
      </div>

      <BuyCreditsDialog
        open={showBuyCredits}
        onOpenChange={setShowBuyCredits}
        onSuccess={fetchBalance}
      />

      <WelcomeDialog />
    </div>
  );
}
