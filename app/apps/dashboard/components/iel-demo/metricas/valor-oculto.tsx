'use client';

import { cn } from '@workspace/ui/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

/** Texto do recorte suprimido (PRODUTO.md §5, `MIN_RECORTE`). */
export const TEXTO_OCULTO =
  'Menos de 5 pessoas: oculto para proteger quem respondeu';

/**
 * O "—" de um recorte com `oculto: true`.
 *
 * Grupo com menos de 5 pessoas não mostra número nenhum: nem o valor, nem o
 * percentual. O traço vem com a explicação no `Tooltip`, para ninguém ler
 * "—" como zero ou como erro.
 *
 * ```tsx
 * {etapa.oculto ? <ValorOculto /> : etapa.n}
 * ```
 */
export function ValorOculto({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/*
         * `aria-label` num `span` sem papel é ignorado por vários leitores:
         * o texto vai escrito, em `sr-only`, e o traço fica só para os olhos.
         */}
        <span
          tabIndex={0}
          className={cn('cursor-help text-muted-foreground', className)}
        >
          <span aria-hidden="true">—</span>
          <span className="sr-only">{TEXTO_OCULTO}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{TEXTO_OCULTO}</TooltipContent>
    </Tooltip>
  );
}
