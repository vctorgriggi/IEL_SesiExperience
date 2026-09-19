'use client';

import { useState, type ReactNode } from 'react';

import { useSidebarCollapsed } from '~/hooks/use-sidebar-collapsed';
import type { Conversation } from '~/types/conversation';
import { ChatHeader } from './chat-header';
import type { ChatModel } from './chat-model-selector';
import { ChatSidebar } from './chat-sidebar';

type AppShellProps = {
  title: string;
  conversations: Conversation[];
  nextCursor: string | null;
  defaultModel: ChatModel;
  canOpenKnowledge?: boolean;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  children: ReactNode;
};

export function AppShell({
  title,
  conversations,
  nextCursor,
  defaultModel,
  canOpenKnowledge,
  user,
  children
}: AppShellProps) {
  const [list, setList] = useState(conversations);
  const [cursor, setCursor] = useState(nextCursor);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebar = useSidebarCollapsed();

  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar
        conversations={list}
        defaultModel={defaultModel}
        nextCursor={cursor}
        onConversationsChange={setList}
        onNextCursorChange={setCursor}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        canOpenKnowledge={canOpenKnowledge}
        collapsed={sidebar.collapsed}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatHeader
          title={title}
          model={defaultModel}
          availableModels={[]}
          onModelChange={() => undefined}
          user={user}
          onSidebarToggle={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebar.collapsed}
          onSidebarCollapseToggle={sidebar.toggle}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
