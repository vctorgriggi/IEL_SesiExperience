'use client';

import { useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent, RefObject } from 'react';
import { MailSend01Icon, StopIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, cn } from '@workspace/ui';

type ChatInputProps = {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  onStop: () => void;
  disabled?: boolean;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  className?: string;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  onStop,
  disabled,
  textareaRef: externalRef,
  className
}: ChatInputProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? localRef;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(60, Math.min(el.scrollHeight, 200))}px`;
  }, [value, textareaRef]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div className={cn('px-4 py-4', className)}>
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-3xl"
      >
        <div
          className={cn(
            'flex items-end gap-2 rounded-xl border bg-background px-3 py-2 shadow-sm',
            'transition-[box-shadow,border-color] focus-within:border-primary/50 focus-within:shadow-md'
          )}
        >
          <label
            htmlFor="campo-mensagem"
            className="sr-only"
          >
            Mensagem
          </label>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem…"
            rows={1}
            disabled={disabled}
            className="min-h-[60px] max-h-[200px] w-full flex-1 resize-none border-0 bg-transparent py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
            id="campo-mensagem"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              size="circle"
              className="size-9 min-h-[44px] min-w-[44px] shrink-0 touch-manipulation"
              onClick={onStop}
              aria-label="Parar geração"
            >
              <HugeiconsIcon
                icon={StopIcon}
                size={16}
              />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="default"
              size="circle"
              className="size-9 min-h-[44px] min-w-[44px] shrink-0 touch-manipulation"
              disabled={!value.trim() || disabled}
              aria-label="Enviar mensagem"
            >
              <HugeiconsIcon
                icon={MailSend01Icon}
                size={16}
              />
            </Button>
          )}
        </div>
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
        Respostas geradas por IA podem conter erros. Verifique informações
        importantes.
      </p>
    </div>
  );
}
