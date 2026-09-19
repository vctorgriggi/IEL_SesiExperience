'use client';

import { useId, useState, type ReactNode } from 'react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

/**
 * O que a importação faz com um grupo de linhas, em palavra comum.
 *
 * `SummaryRow` é o mesmo padrão resumo → detalhe, mas o vocabulário dele é o
 * da leitura de fit ("Combina", "Difere", "Ainda não respondeu") e nenhuma
 * dessas palavras diz nada sobre uma planilha: "8 pessoas novas — Combina"
 * confunde quem está conferindo uma importação. O padrão visual e de teclado
 * é o mesmo; o que muda é a palavra ao lado do ponto.
 */
export type EstadoDaImportacao =
  | 'entram'
  | 'atualizam'
  | 'sem-mudanca'
  | 'com-erro';

const PALAVRA: Record<EstadoDaImportacao, string> = {
  entram: 'Entram',
  atualizam: 'Atualizam',
  'sem-mudanca': 'Sem mudança',
  'com-erro': 'Com erro'
};

const COR_DO_PONTO: Record<EstadoDaImportacao, string> = {
  entram: 'bg-success',
  atualizam: 'bg-success',
  'sem-mudanca': 'bg-muted-foreground',
  'com-erro': 'bg-warning'
};

const COR_DO_TEXTO: Record<EstadoDaImportacao, string> = {
  entram: 'text-success',
  atualizam: 'text-success',
  'sem-mudanca': 'text-muted-foreground',
  'com-erro': 'text-warning'
};

export function GrupoDeDecisao({
  titulo,
  estado,
  resumo,
  children,
  className
}: {
  titulo: ReactNode;
  estado: EstadoDaImportacao;
  /** Uma frase. Se precisa de duas, a segunda é detalhe. */
  resumo?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const detalheId = useId();
  const temDetalhe = Boolean(children);

  const cabecalho = (
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-sm font-medium text-foreground">{titulo}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium',
            COR_DO_TEXTO[estado]
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'size-1.5 shrink-0 rounded-full',
              COR_DO_PONTO[estado]
            )}
          />
          {PALAVRA[estado]}
        </span>
      </span>
      {resumo ? (
        <span className="iel-prose text-xs leading-relaxed text-muted-foreground">
          {resumo}
        </span>
      ) : null}
    </span>
  );

  return (
    <div className={cn('border-b border-border last:border-0', className)}>
      {temDetalhe ? (
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={detalheId}
          onClick={() => setAberto((atual) => !atual)}
          className="iel-interactive flex w-full items-start gap-3 px-1 py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          {cabecalho}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            aria-hidden="true"
            className={cn(
              'mt-1 shrink-0 text-muted-foreground transition-transform',
              aberto && 'rotate-180'
            )}
          />
        </button>
      ) : (
        <div className="flex w-full items-start gap-3 px-1 py-3">
          {cabecalho}
        </div>
      )}
      {temDetalhe ? (
        <div
          id={detalheId}
          hidden={!aberto}
          className="px-1 pb-4 pt-1"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
