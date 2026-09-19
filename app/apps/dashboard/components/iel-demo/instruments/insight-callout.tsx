/**
 * Callout de insight: uma leitura, com a cor do estado que a originou.
 *
 * O que ele NÃO faz:
 *
 * - **Não produz a leitura.** Recebe título e detalhe prontos de uma regra
 *   determinística. Não classifica, não ordena, não decide o que é forte.
 * - **Não soma eixos nem vira nota.** Um "Forte em ritmo" descreve um eixo;
 *   três callouts verdes não são um resultado, e a tela nunca deve deixar
 *   parecer que são.
 * - **Não qualifica a pessoa.** O texto que chega aqui fala do encontro
 *   entre duas descrições de condição de trabalho. Este componente não
 *   acrescenta adjetivo nenhum a ele.
 * - **Não esconde a lacuna.** `kind="lacuna"` é um estado de primeira
 *   classe, com a mesma presença visual dos outros — ausência de informação
 *   é notícia, não silêncio.
 */

import type { ReactNode } from 'react';
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  HelpCircleIcon,
  MinusSignIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

export type InsightCalloutKind = 'forte' | 'atencao' | 'lacuna' | 'esclarecer';

/**
 * Cada tipo herda a cor do estado de critério correspondente. Inventar um
 * segundo vocabulário de cor faria a mesma informação mudar de cor entre dois
 * blocos da mesma tela.
 */
const KIND_SPEC: Record<
  InsightCalloutKind,
  { bar: string; text: string; icon: typeof HelpCircleIcon; wash: string }
> = {
  forte: {
    bar: 'bg-success',
    text: 'text-success',
    wash: 'bg-success/[0.05]',
    icon: CheckmarkCircle02Icon
  },
  atencao: {
    bar: 'bg-destructive',
    text: 'text-destructive',
    wash: 'bg-destructive/[0.05]',
    icon: AlertCircleIcon
  },
  lacuna: {
    bar: 'bg-border-strong',
    text: 'text-muted-foreground',
    wash: 'bg-muted/60',
    icon: MinusSignIcon
  },
  esclarecer: {
    bar: 'bg-warning',
    text: 'text-warning',
    wash: 'bg-warning/[0.05]',
    icon: HelpCircleIcon
  }
};

export type InsightCalloutProps = {
  kind: InsightCalloutKind;
  title: ReactNode;
  detail: ReactNode;
  /** Trecho de origem, quando existe um lado informado que sustente a leitura. */
  evidence?: ReactNode;
  className?: string;
};

export function InsightCallout({
  kind,
  title,
  detail,
  evidence,
  className
}: InsightCalloutProps) {
  const spec = KIND_SPEC[kind];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--control-radius)] py-2.5 pl-4 pr-3',
        spec.wash,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 left-0 w-1', spec.bar)}
      />
      <div className="flex gap-2">
        <HugeiconsIcon
          icon={spec.icon}
          size={15}
          aria-hidden="true"
          className={cn('mt-0.5 shrink-0', spec.text)}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            {title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {detail}
          </p>
          {evidence ? (
            <blockquote className="mt-1.5 border-l-2 border-border pl-2.5 text-xs italic leading-relaxed text-muted-foreground">
              “{evidence}”
            </blockquote>
          ) : null}
        </div>
      </div>
    </div>
  );
}
