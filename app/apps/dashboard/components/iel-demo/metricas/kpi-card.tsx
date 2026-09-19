'use client';

import type { ComponentProps, ReactNode } from 'react';
import type { Kpi } from '@/features/iel-demo/analysis/analytics';
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import {
  BADGE_DE_ESTADO,
  corDaVariacao,
  ICONE_TINGIDO,
  SELO,
  type TomDeCor
} from './cores';
import { formatarValorKpi, lerValorKpi, lerVariacao } from './formato';
import { MarcadorHistorico } from './marcador-historico';

export type CartaoDeIndicadorProps = Omit<
  ComponentProps<typeof Card>,
  'children'
> & {
  /** Rótulo curto, no topo. Pode quebrar em duas linhas. */
  rotulo: ReactNode;
  /** O número. Fica sempre na cor do texto: a cor mora no ícone e no selo. */
  valor: ReactNode;
  /** Selo à direita do número (variação ou etiqueta). */
  selo?: ReactNode;
  /** Ícone de contexto, num quadradinho tingido no canto esquerdo do topo. */
  icone?: LucideIcon;
  /** Tom do quadradinho do ícone. Padrão: `neutro`. */
  tom?: TomDeCor;
  /** Mini indicador visual logo abaixo do número (pontos, barra fina). */
  indicador?: ReactNode;
  /** Linha forte do rodapé. */
  rodape?: ReactNode;
  /** Linha de apoio do rodapé, em `text-muted-foreground`. */
  apoio?: ReactNode;
  /**
   * Frase inteira para o leitor de tela. Quando existe, o desenho do cartão
   * fica `aria-hidden` e o leitor ouve só a frase.
   */
  leitura?: string;
};

/**
 * O esqueleto de todo cartão de número do /iel: ícone tingido e rótulo no
 * topo, número grande com o selo à direita, mini indicador opcional e rodapé.
 *
 * Fundo branco com borda: a cor vem do ícone e do selo, no máximo dois pontos
 * de cor por cartão. O topo tem altura mínima de duas linhas de rótulo, para
 * os números de uma mesma fileira ficarem na mesma altura; o apoio reserva
 * duas linhas e o rodapé fica colado embaixo (`mt-auto`), para o rodapé de
 * um cartão alinhar com o do vizinho mesmo quando um apoio quebra e o outro
 * não. O cartão ocupa a altura toda da célula (`h-full`).
 */
export function CartaoDeIndicador({
  rotulo,
  valor,
  selo,
  icone: Icone,
  tom = 'neutro',
  indicador,
  rodape,
  apoio,
  leitura,
  className,
  ...props
}: CartaoDeIndicadorProps) {
  const oculto = leitura ? true : undefined;

  return (
    <Card
      className={cn('@container/card h-full gap-3 py-4 shadow-xs', className)}
      {...props}
    >
      {leitura ? <p className="sr-only">{leitura}</p> : null}
      <CardHeader
        aria-hidden={oculto}
        className="flex flex-col gap-2"
      >
        <div className="flex min-h-10 w-full items-center gap-3">
          {Icone ? (
            <span
              aria-hidden="true"
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg',
                ICONE_TINGIDO[tom]
              )}
            >
              <Icone className="size-4" />
            </span>
          ) : null}
          <CardDescription className="line-clamp-2 min-w-0 flex-1 leading-5">
            {rotulo}
          </CardDescription>
        </div>
        {/*
         * O selo mora na linha do número, logo depois dele: no topo ele
         * disputava espaço com o rótulo, que a 1280px virava "Retorno das…".
         */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <CardTitle className="min-w-0 text-3xl font-semibold tabular-nums">
            {valor}
          </CardTitle>
          {selo ? <div className="shrink-0">{selo}</div> : null}
        </div>
        {indicador}
      </CardHeader>
      {rodape || apoio ? (
        <CardFooter
          aria-hidden={oculto}
          className="mt-auto flex-col items-start gap-1 pt-1 text-sm"
        >
          {rodape ? (
            // O rodapé cresce para cima quando quebra: o apoio tem altura fixa
            // de duas linhas e o bloco fica colado embaixo, então a última
            // linha do rodapé alinha com a do vizinho.
            <span className="flex max-w-full min-w-0 items-center gap-2 font-medium">
              {rodape}
            </span>
          ) : null}
          {apoio ? (
            <span className="line-clamp-2 min-h-10 text-muted-foreground">
              {apoio}
            </span>
          ) : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export type KpiCardProps = {
  kpi: Kpi;
  /**
   * Substitui o número do cartão quando a leitura pede outra forma
   * (ex.: "29 de 37"). Padrão: `kpi.valor` formatado pela unidade.
   */
  valor?: ReactNode;
  /**
   * Linha forte do rodapé. Padrão: a direção da variação em palavras
   * ("Subiu no período"), ou "Sem comparação" quando `variacao` é `null`.
   */
  rodape?: ReactNode;
  /** Linha de apoio do rodapé, em `text-muted-foreground`. Padrão: `kpi.descricao`. */
  apoio?: ReactNode;
  /**
   * Indicador em que cair é o resultado desejado (reabertura, tempo do
   * ciclo): o selo de variação fica verde quando cai e vermelho quando sobe.
   */
  quedaEBoa?: boolean;
  /** Ícone de contexto, no canto, num quadradinho tingido. */
  icone?: LucideIcon;
  /** Tom do quadradinho do ícone. Padrão: `neutro`. */
  tom?: TomDeCor;
  /** Mini indicador visual abaixo do número. */
  indicador?: ReactNode;
  /** Classe extra no `Card`, para o grid (ex.: `lg:col-span-2`). */
  className?: string;
};

function direcao(kpi: Kpi): {
  texto: string;
  curto?: string;
  Icone: LucideIcon;
} {
  if (kpi.variacao === null) {
    return {
      texto: 'Sem comparação no período',
      curto: 'Sem comparação',
      Icone: Minus
    };
  }
  if (kpi.variacao > 0) {
    return { texto: 'Subiu no período', Icone: TrendingUp };
  }
  if (kpi.variacao < 0) {
    return { texto: 'Caiu no período', Icone: TrendingDown };
  }
  return { texto: 'Estável no período', Icone: Minus };
}

/**
 * O *section card* do `dashboard-01` alimentado por um `Kpi` de
 * `analytics.ts`, sobre o `CartaoDeIndicador`: ícone e rótulo → número em
 * 30px tabular → selo da variação → rodapé em duas linhas.
 *
 * O selo da variação é o único lugar em que o cartão diz "bom" ou "ruim":
 * verde quando melhorou, vermelho quando piorou, cinza sem variação. Quem
 * decide o que é melhorar é `quedaEBoa` — "tempo do ciclo" caindo é bom, e a
 * cor não pode dizer o contrário. A palavra ("Subiu no período") continua no
 * rodapé: a cor nunca fala sozinha.
 *
 * Número do histórico simulado (`fonte: 'historico'`) leva o
 * `MarcadorHistorico` ao lado do rótulo.
 *
 * Use num grid `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`. Cinco cartões não
 * cabem numa linha a 1440px: use `lg:grid-cols-6` com
 * `className="lg:col-span-2"` nos três primeiros e `lg:col-span-3` nos dois
 * últimos, como na lista de Empresas.
 *
 * ```tsx
 * const kpis = getInicioKpis(state, periodo);
 * <KpiCard kpi={kpis.retornoEmpresas} icone={Building2} tom="empresa" />
 * <KpiCard kpi={kpis.tempoCiclo} quedaEBoa icone={Clock} tom="atencao" />
 * ```
 */
export function KpiCard({
  kpi,
  valor,
  rodape,
  apoio,
  quedaEBoa = false,
  icone,
  tom,
  indicador,
  className
}: KpiCardProps) {
  const { texto, curto, Icone } = direcao(kpi);
  const variacaoFalada = lerVariacao(kpi);
  const estado = corDaVariacao(kpi.variacao, quedaEBoa);

  return (
    <CartaoDeIndicador
      className={className}
      icone={icone}
      tom={tom}
      indicador={indicador}
      rotulo={
        <>
          {kpi.rotulo}
          {kpi.fonte === 'historico' ? (
            <>
              {' '}
              <MarcadorHistorico className="align-[-1px]" />
            </>
          ) : null}
        </>
      }
      valor={
        valor ?? (
          <>
            <span aria-hidden="true">{formatarValorKpi(kpi)}</span>
            <span className="sr-only">{lerValorKpi(kpi)}</span>
          </>
        )
      }
      selo={
        kpi.variacaoTexto ? (
          <Badge
            variant="outline"
            className={cn(SELO, BADGE_DE_ESTADO[estado])}
          >
            {/*
             * "↗ +10 p.p." não se lê: o selo fica para os olhos e o leitor
             * de tela ouve a frase inteira.
             */}
            <Icone aria-hidden="true" />
            <span aria-hidden="true">{kpi.variacaoTexto}</span>
            <span className="sr-only">{variacaoFalada}</span>
          </Badge>
        ) : null
      }
      rodape={
        rodape ?? (
          <>
            {/*
             * Com o selo, a frase já foi lida por extenso logo acima. Em
             * cartão estreito (4 por linha a 1280px), "Sem comparação no
             * período" quebrava em duas linhas e desalinhava o rodapé dos
             * vizinhos: fica só "Sem comparação".
             */}
            <span
              aria-hidden={variacaoFalada ? 'true' : undefined}
              className="truncate"
            >
              {curto ? (
                <>
                  <span className="@max-3xs/card:hidden">{texto}</span>
                  <span className="hidden @max-3xs/card:inline">{curto}</span>
                </>
              ) : (
                texto
              )}
            </span>{' '}
            <Icone
              aria-hidden="true"
              className="size-4 shrink-0"
            />
          </>
        )
      }
      apoio={apoio ?? kpi.descricao}
    />
  );
}
