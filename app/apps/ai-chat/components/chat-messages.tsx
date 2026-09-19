'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown01Icon,
  Loading03Icon,
  Robot01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { UIMessage } from 'ai';

import { Button } from '@workspace/ui';

import { MessageBubble } from './message-bubble';

type ChatMessagesProps = {
  messages: UIMessage[];
  isLoading: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
};

export function ChatMessages({
  messages,
  isLoading,
  onRegenerate,
  isRegenerating = false
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const prevMessagesLengthRef = useRef(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom(
      messages.length > prevMessagesLengthRef.current ? 'smooth' : 'auto'
    );
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollFab(distanceFromBottom > 120);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-y-auto"
    >
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="space-y-6">
          {messages.map((message) => {
            const isLastAssistant =
              message.role === 'assistant' &&
              message.id ===
                [...messages].reverse().find((m) => m.role === 'assistant')?.id;
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isLastAssistant={isLastAssistant}
                onRegenerate={onRegenerate}
                isRegenerating={isRegenerating}
              />
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  icon={Robot01Icon}
                  size={16}
                  className="text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={14}
                  className="animate-spin text-muted-foreground"
                />
                <span className="text-sm text-muted-foreground">
                  Gerando resposta...
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollFab && (
        <Button
          type="button"
          variant="secondary"
          size="circle"
          className="absolute bottom-4 right-4 shadow-md"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Rolar para o final"
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={18}
          />
        </Button>
      )}
    </div>
  );
}
