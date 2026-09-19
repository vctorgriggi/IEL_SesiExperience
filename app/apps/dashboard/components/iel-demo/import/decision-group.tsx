'use client';

import type { ReactNode } from 'react';
import {
  ArrowRightLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  MinusIcon,
  TriangleAlertIcon
} from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';

/**
 * O que a importação faz com um grupo de linhas, em palavra comum.
 *
 * O vocabulário da leitura de fit — "Combina", "Difere", "Ainda não
 * respondeu" — não diz nada sobre uma planilha: "8 pessoas novas — Combina"
 * confunde quem está conferindo uma importação. O padrão visual é o mesmo
 * `Badge outline` do restante do produto; o que muda é a palavra e o ícone.
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

/** Cor só no ícone, como manda a diretriz visual. */
const ICONE: Record<EstadoDaImportacao, ReactNode> = {
  entram: <CheckIcon className="text-success" />,
  atualizam: <ArrowRightLeftIcon className="text-success" />,
  'sem-mudanca': <MinusIcon className="text-muted-foreground" />,
  'com-erro': <TriangleAlertIcon className="text-warning" />
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
  return (
    <Collapsible className={cn('border-b last:border-0', className)}>
      <CollapsibleTrigger
        disabled={!children}
        className="group flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {titulo}
            </span>
            <Badge
              variant="outline"
              className="text-muted-foreground"
            >
              {ICONE[estado]}
              {PALAVRA[estado]}
            </Badge>
          </span>
          {resumo ? (
            <span className="max-w-[80ch] text-xs leading-relaxed text-muted-foreground">
              {resumo}
            </span>
          ) : null}
        </span>
        {children ? (
          <ChevronDownIcon
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
          />
        ) : null}
      </CollapsibleTrigger>
      {children ? (
        <CollapsibleContent className="pb-4">{children}</CollapsibleContent>
      ) : null}
    </Collapsible>
  );
}
