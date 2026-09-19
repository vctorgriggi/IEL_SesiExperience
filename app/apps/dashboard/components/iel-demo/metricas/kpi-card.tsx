'use client';

import type { ReactNode } from 'react';
import type { Kpi } from '@/features/iel-demo/analysis/analytics';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { formatarValorKpi } from './formato';
import { MarcadorHistorico } from './marcador-historico';

export type KpiCardProps = {
  kpi: Kpi;
  /**
   * Substitui o número do cartão quando a leitura pede outra forma
   * (ex.: "29 de 37"). Padrão: `kpi.valor` formatado pela unidade.
   */
  valor?: ReactNode;
  /**
   * Linha forte do rodapé. Padrão: a direção da variação em palavras
   * ("Subiu em relação aos 90 dias anteriores"), ou "Sem comparação" quando
   * `variacao` é `null`.
   */
  rodape?: ReactNode;
  /** Linha de apoio do rodapé, em `text-muted-foreground`. Padrão: `kpi.descricao`. */
  apoio?: ReactNode;
  /** Classe extra no `Card`, para o grid (ex.: `lg:col-span-2`). */
  className?: string;
};

function direcao(kpi: Kpi): { texto: string; Icone: typeof TrendingUp } {
  if (kpi.variacao === null) {
    return { texto: 'Sem comparação no período', Icone: Minus };
  }
  if (kpi.variacao > 0) {
    return { texto: 'Subiu no período', Icone: TrendingUp };
  }
  if (kpi.variacao < 0) {
    return {
      texto: 'Caiu no período',
      Icone: TrendingDown
    };
  }
  return { texto: 'Estável no período', Icone: Minus };
}

/**
 * O *section card* do `dashboard-01` alimentado por um `Kpi` de
 * `analytics.ts`: rótulo → número em 24px tabular → `Badge outline` com a
 * variação → rodapé em duas linhas.
 *
 * Número do histórico simulado (`fonte: 'historico'`) leva o
 * `MarcadorHistorico` ao lado do rótulo. A seta da variação é neutra, sem
 * verde nem vermelho: "tempo para completar o perfil" caindo é bom, e a cor
 * não pode dizer o contrário.
 *
 * Use num grid `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`. Cinco cartões não
 * cabem numa linha a 1440px (o selo espreme o rótulo): use `lg:grid-cols-6`
 * com `className="lg:col-span-2"` nos três primeiros e `lg:col-span-3` nos dois
 * últimos, como na lista de Empresas.
 *
 * ```tsx
 * const kpis = getInicioKpis(state, periodo);
 * <KpiCard kpi={kpis.retornoEmpresas} />
 * <KpiCard kpi={kpis.roteirosUsados} valor={`${usados} de ${gerados}`} rodape="gerados no período" />
 * ```
 */
export function KpiCard({
  kpi,
  valor,
  rodape,
  apoio,
  className
}: KpiCardProps) {
  const { texto, Icone } = direcao(kpi);

  return (
    <Card
      className={cn(
        '@container/card from-primary/5 to-card bg-gradient-to-t shadow-xs',
        className
      )}
    >
      <CardHeader>
        <CardDescription>
          {kpi.rotulo}
          {kpi.fonte === 'historico' ? (
            <>
              {' '}
              <MarcadorHistorico className="align-[-1px]" />
            </>
          ) : null}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {valor ?? formatarValorKpi(kpi)}
        </CardTitle>
        {kpi.variacaoTexto ? (
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 font-normal"
            >
              <Icone className="size-3" />
              {kpi.variacaoTexto}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <span className="line-clamp-1 flex items-center gap-2 font-medium">
          {rodape ?? (
            <>
              {texto} <Icone className="size-4 shrink-0" />
            </>
          )}
        </span>
        <span className="line-clamp-2 text-muted-foreground">
          {apoio ?? kpi.descricao}
        </span>
      </CardFooter>
    </Card>
  );
}
