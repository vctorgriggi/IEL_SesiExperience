'use client';

import { History } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

/** Texto do marcador, exportado para quem precisar repetir em legenda. */
export const TEXTO_HISTORICO =
  'Histórico simulado dos últimos 12 meses: é o que o retorno de um toque passa a medir';

/**
 * Marca discreta de número que vem do histórico simulado
 * (`Kpi.fonte === 'historico'`).
 *
 * Os números do histórico não são medidos: foram gerados para mostrar o que
 * o retorno de um toque passa a medir. A tela não pode fingir que são reais,
 * e também não pode gritar isso em cada cartão. Fica um ícone de 12px em
 * `text-muted-foreground`, com a explicação no `Tooltip`.
 *
 * ```tsx
 * <span className="flex items-center gap-1">
 *   Retorno das empresas {kpi.fonte === 'historico' ? <MarcadorHistorico /> : null}
 * </span>
 * ```
 */
export function MarcadorHistorico({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/*
         * O nome vai em texto `sr-only`, não em `aria-label`: num `span` sem
         * papel o rótulo é ignorado por vários leitores de tela.
         */}
        <span
          tabIndex={0}
          className={cn(
            'inline-flex shrink-0 items-center text-muted-foreground',
            className
          )}
        >
          <History
            aria-hidden="true"
            className="size-3"
          />
          <span className="sr-only">{TEXTO_HISTORICO}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{TEXTO_HISTORICO}</TooltipContent>
    </Tooltip>
  );
}
