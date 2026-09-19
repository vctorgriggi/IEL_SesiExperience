'use client';

import { useId, useState, type ReactNode } from 'react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

/**
 * Bloco que começa fechado.
 *
 * A mesa de seleção responde "quem eu envio para esta vaga?". A lista
 * completa, o resgate do filtro e o detalhamento por critério ajudam a
 * responder, mas nenhum deles precisa estar aberto para a pergunta ser lida:
 * ficam atrás de um clique, com a contagem visível no rótulo, que é o que
 * decide se vale abrir.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  tone = 'default',
  className
}: {
  /** Uma frase com o número: é ela que decide se vale abrir. */
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** `atencao` para o que pede uma segunda olhada, como o resgate. */
  tone?: 'default' | 'atencao';
  className?: string;
}) {
  const [aberto, setAberto] = useState(defaultOpen);
  const painelId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((atual) => !atual)}
        className={cn(
          'iel-interactive flex w-full items-center gap-2 rounded-[var(--control-radius)] px-4 py-3 text-left text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          tone === 'atencao' ? 'text-warning' : 'text-foreground'
        )}
      >
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          aria-hidden="true"
          className={cn(
            'shrink-0 transition-transform',
            tone === 'atencao' ? 'text-warning' : 'text-muted-foreground',
            aberto && 'rotate-180'
          )}
        />
        <span className="min-w-0">{summary}</span>
      </button>
      <div
        id={painelId}
        hidden={!aberto}
      >
        {children}
      </div>
    </div>
  );
}
