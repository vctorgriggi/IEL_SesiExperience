'use client';

import Link from 'next/link';
import { Robot01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import { cn, linkClass } from '@workspace/ui';

import { buildSuggestions } from '~/lib/suggestions';
import { SuggestionChips } from './suggestion-chips';

type ChatWelcomeProps = {
  topics: readonly string[];
  canOpenKnowledge?: boolean;
  onSuggestionSelect: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ChatWelcome({
  topics,
  canOpenKnowledge,
  onSuggestionSelect,
  disabled,
  className
}: ChatWelcomeProps) {
  const prompts = buildSuggestions(topics);

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-end gap-8 px-4 pt-8 pb-6',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <HugeiconsIcon
            icon={Robot01Icon}
            size={24}
            className="text-primary"
          />
        </div>
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
          O que você quer saber?
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {prompts.length > 0
            ? 'Respondo a partir dos documentos da base de conhecimento. Pergunte abaixo ou comece por uma sugestão.'
            : 'Respondo a partir dos documentos da base de conhecimento, que ainda está vazia.'}
        </p>
      </div>

      {prompts.length > 0 ? (
        <SuggestionChips
          prompts={prompts}
          onSelect={onSuggestionSelect}
          disabled={disabled}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {canOpenKnowledge ? (
            <>
              Suba um documento em{' '}
              <Link
                href={routes.aiChat.knowledge}
                className={linkClass}
              >
                Base de conhecimento
              </Link>{' '}
              para eu ter o que responder.
            </>
          ) : (
            'Peça a quem administra a base para subir os documentos.'
          )}
        </p>
      )}
    </div>
  );
}
