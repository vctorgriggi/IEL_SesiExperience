'use client';

import { useId, useState, type ReactNode } from 'react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

import { Panel } from '../shared/ui';

/**
 * Seção recolhida com assunto próprio.
 *
 * `HowItWorks` é para método e existe uma vez por tela; `SummaryRow` é para
 * uma linha de lista que abre. Faltava a terceira forma: um bloco inteiro que
 * não pertence à primeira dobra — o histórico da pessoa, o gráfico, a lista
 * de requisitos — e que precisa continuar alcançável sem empurrar o número
 * principal para fora da tela.
 *
 * O rótulo diz o que tem dentro e o contador diz o tamanho, para que abrir
 * seja uma decisão informada e não uma pescaria.
 */
export function CollapsibleSection({
  title,
  meta,
  defaultOpen = false,
  children,
  className
}: {
  title: string;
  /** Uma linha curta: quantos itens, de quando, de onde. */
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const [aberto, setAberto] = useState(defaultOpen);
  const painelId = useId();

  return (
    <Panel
      elevation={1}
      padding="none"
      className={cn('overflow-hidden', className)}
    >
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((atual) => !atual)}
        className="iel-interactive flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {title}
          </span>
          {meta ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {meta}
            </span>
          ) : null}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          aria-hidden="true"
          className={cn(
            'shrink-0 text-muted-foreground transition-transform',
            aberto && 'rotate-180'
          )}
        />
      </button>
      <div
        id={painelId}
        hidden={!aberto}
        className="border-t border-border px-5 py-5"
      >
        {children}
      </div>
    </Panel>
  );
}
