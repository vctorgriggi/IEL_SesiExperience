'use client';

import {
  Copy01Icon,
  RefreshIcon,
  Robot01Icon,
  UserIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button, cn, toast } from '@workspace/ui';

import { useCopyToClipboard } from '~/hooks/use-copy-to-clipboard';
import { messageText } from '~/lib/ui-message';
import { CodeBlock } from './code-block';

type MessageBubbleProps = {
  message: UIMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
};

export function MessageBubble({
  message,
  isLastAssistant = false,
  onRegenerate,
  isRegenerating = false
}: MessageBubbleProps) {
  const { copy, copied } = useCopyToClipboard();

  const isUser = message.role === 'user';
  const text = messageText(message);

  const handleCopy = async () => {
    await copy(text);
    toast.success('Mensagem copiada!');
  };

  return (
    <div
      className={cn(
        'group flex gap-3',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <HugeiconsIcon
            icon={UserIcon}
            size={16}
          />
        ) : (
          <HugeiconsIcon
            icon={Robot01Icon}
            size={16}
          />
        )}
      </div>

      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-1 sm:max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          {message.role === 'assistant' ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.includes('language-');
                  return isBlock ? (
                    <CodeBlock
                      className={className}
                      language={className ?? undefined}
                    >
                      {children}
                    </CodeBlock>
                  ) : (
                    <code
                      className="rounded bg-background/50 px-1 py-0.5 text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-2 list-inside list-disc space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-2 list-inside list-decimal space-y-1">
                    {children}
                  </ol>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80"
                  >
                    {children}
                  </a>
                )
              }}
            >
              {text}
            </ReactMarkdown>
          ) : (
            <span className="whitespace-pre-wrap">{text}</span>
          )}
        </div>

        <div
          className={cn(
            'flex items-center gap-1 transition-opacity duration-150',
            'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
            '[@media(hover:none)]:opacity-100',
            copied && 'opacity-100',
            isUser ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-11 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground md:h-7"
            onClick={handleCopy}
            aria-label={copied ? 'Copiado' : 'Copiar mensagem'}
          >
            <HugeiconsIcon
              icon={Copy01Icon}
              size={12}
            />
            {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          {!isUser && isLastAssistant && onRegenerate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground md:h-7"
              onClick={onRegenerate}
              disabled={isRegenerating}
              aria-label="Regenerar resposta"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                size={12}
                className={isRegenerating ? 'animate-spin' : ''}
              />
              Regenerar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
