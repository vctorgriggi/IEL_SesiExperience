'use client';

import type { ComponentProps, ReactNode } from 'react';
import type { Kpi } from '@/features/iel-demo/analysis/analytics';
import {
  IconInfoCircle,
  IconMinus,
  IconTrendingDown,
  IconTrendingUp
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Card } from '@workspace/ui/shadcn/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

import { corDaVariacao, type EstadoDeCor, type TomDeCor } from './cores';
import { formatarValorKpi, lerValorKpi, lerVariacao } from './formato';
import { MarcadorHistorico } from './marcador-historico';

export type CartaoDeIndicadorProps = Omit<
  ComponentProps<typeof Card>,
  'children'
> & {
  /** Rótulo curto, no topo. Pode quebrar em duas linhas. */
  rotulo: ReactNode;
  /**
   * O rótulo em texto puro, para o `aria-label` do ⓘ ("Sobre {rótulo}").
   * Só é preciso quando `rotulo` não é uma string.
   */
  rotuloTexto?: string;
  /** O número. Fica sempre na cor do texto: a cor mora no ícone e no selo. */
  valor: ReactNode;
  /** Selo à direita do número (variação ou etiqueta). */
  selo?: ReactNode;
  /** Ícone de contexto, num quadradinho tingido no canto esquerdo do topo. */
  icone?: TablerIcon;
  /** Tom do quadradinho do ícone. Padrão: `neutro`. */
  tom?: TomDeCor;
  /** Mini indicador visual logo abaixo do número (pontos, barra fina). */
  indicador?: ReactNode;
  /** Linha única do rodapé, curta. Vazia, não reserva altura. */
  rodape?: ReactNode;
  /**
   * A explicação longa do indicador. Não fica no corpo do cartão: vai para a
   * dica do ⓘ ao lado do rótulo (e para o leitor de tela).
   */
  apoio?: ReactNode;
  /**
   * Frase inteira para o leitor de tela. Quando existe, o desenho do cartão
   * fica `aria-hidden` e o leitor ouve só a frase.
   */
  leitura?: string;
};

/**
 * A ajuda do cartão: um ⓘ de 14px ao lado do rótulo, com a explicação na
 * dica do mouse.
 *
 * A explicação já morou no corpo do cartão, em duas linhas de apoio que
 * ocupavam quase um terço da altura para dizer o que quase nunca se lê. Aqui
 * ela fica a um toque — e continua inteira para o leitor de tela, que não
 * depende de passar o mouse: o `aria-label` nomeia o indicador e o texto vem
 * logo depois, fora do botão (dentro dele o `aria-label` o esconderia).
 */
function AjudaDoIndicador({
  rotulo,
  texto
}: {
  rotulo?: string;
  texto: ReactNode;
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={rotulo ? `Sobre ${rotulo}` : 'Sobre este indicador'}
            className="mt-[3px] inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"
          >
            <IconInfoCircle
              aria-hidden="true"
              className="size-3.5"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-pretty">
          {texto}
        </TooltipContent>
      </Tooltip>
      <span className="sr-only">{texto}</span>
    </>
  );
}

/**
 * O esqueleto de todo cartão de número do /iel: ícone tingido, rótulo e ⓘ no
 * topo, número grande com o selo à direita, mini indicador opcional e uma
 * linha de rodapé.
 *
 * Fundo branco com borda: a cor vem do ícone e do selo, no máximo dois pontos
 * de cor por cartão. O topo tem altura mínima de duas linhas de rótulo, para
 * os números de uma mesma fileira ficarem na mesma altura. O rodapé é uma
 * linha só e fica colado embaixo (`mt-auto`), então os cartões de uma mesma
 * fileira terminam na mesma altura; sem rodapé, nada é reservado. O cartão
 * ocupa a altura toda da célula (`h-full`).
 */
const AMBIENTE_GLOW: Record<TomDeCor, string> = {
  empresa: 'bg-blue-500/10 dark:bg-blue-400/10',
  pessoa: 'bg-teal-500/10 dark:bg-teal-400/10',
  combina: 'bg-emerald-500/10 dark:bg-emerald-400/10',
  atencao: 'bg-amber-500/10 dark:bg-amber-400/10',
  difere: 'bg-rose-500/10 dark:bg-rose-400/10',
  neutro: 'bg-slate-500/10 dark:bg-slate-400/10'
};

const ICONE_GRADIENTE: Record<TomDeCor, string> = {
  empresa:
    'bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-sm shadow-blue-500/25 ring-1 ring-white/20',
  pessoa:
    'bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-sm shadow-teal-500/25 ring-1 ring-white/20',
  combina:
    'bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-sm shadow-emerald-500/25 ring-1 ring-white/20',
  atencao:
    'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-500/25 ring-1 ring-white/20',
  difere:
    'bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-sm shadow-rose-500/25 ring-1 ring-white/20',
  neutro:
    'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-sm shadow-slate-500/25 ring-1 ring-white/20'
};

/**
 * A barra do tom: some, e no hover cresce da esquerda para a direita no topo
 * do cartão. É a mesma família de cor do quadradinho do ícone, então o cartão
 * inteiro fica falando uma cor só.
 */
const BARRA_DO_TOM: Record<TomDeCor, string> = {
  empresa: 'bg-gradient-to-r from-blue-600 to-indigo-700',
  pessoa: 'bg-gradient-to-r from-teal-600 to-emerald-700',
  combina: 'bg-gradient-to-r from-emerald-600 to-green-700',
  atencao: 'bg-gradient-to-r from-amber-500 to-orange-600',
  difere: 'bg-gradient-to-r from-rose-600 to-red-700',
  neutro: 'bg-gradient-to-r from-slate-500 to-slate-700'
};

const BADGE_VARIAÇÃO: Record<EstadoDeCor, string> = {
  combina:
    'bg-emerald-500/10 text-emerald-700 ring-emerald-600/25 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/30',
  atencao:
    'bg-amber-500/10 text-amber-700 ring-amber-600/25 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30',
  difere:
    'bg-rose-500/10 text-rose-700 ring-rose-600/25 dark:bg-rose-500/20 dark:text-rose-300 dark:ring-rose-500/30',
  neutro:
    'bg-muted/80 text-muted-foreground ring-border/50 dark:bg-muted/40 dark:text-muted-foreground'
};

/**
 * O esqueleto de todo cartão de número do /iel: ícone tingido, rótulo e ⓘ no
 * topo, número grande com o selo à direita, mini indicador opcional e uma
 * linha de rodapé.
 */
export function CartaoDeIndicador({
  rotulo,
  rotuloTexto,
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
      className={cn(
        '@container/card group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/75 bg-card/95 p-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/25',
        className
      )}
      {...props}
    >
      {/* A barra do tom, no topo: cresce da esquerda no hover e no foco */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100 group-focus-within:scale-x-100 motion-reduce:transition-none',
          BARRA_DO_TOM[tom]
        )}
      />

      {/* Ambient background glow suave no canto superior direito */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -right-6 -top-6 size-28 rounded-full blur-2xl opacity-25 transition-opacity duration-300 group-hover:opacity-45',
          AMBIENTE_GLOW[tom]
        )}
      />

      {leitura ? <p className="sr-only">{leitura}</p> : null}

      <div className="relative flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {Icone ? (
            <span
              aria-hidden="true"
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105',
                ICONE_GRADIENTE[tom]
              )}
            >
              <Icone className="size-3.5" />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-1 items-center justify-between gap-1.5">
            <span className="line-clamp-2 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              {rotulo}
            </span>
            {apoio ? (
              <AjudaDoIndicador
                rotulo={
                  rotuloTexto ??
                  (typeof rotulo === 'string' ? rotulo : undefined)
                }
                texto={apoio}
              />
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <div className="min-w-0 text-2xl font-extrabold leading-none tracking-tight tabular-nums text-foreground">
            {valor}
          </div>
          {selo ? <div className="shrink-0">{selo}</div> : null}
        </div>

        {indicador}
      </div>

      {rodape ? (
        <div
          aria-hidden={oculto}
          className="relative mt-2 text-[11px] leading-tight text-muted-foreground"
        >
          {rodape}
        </div>
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
   * Linha única do rodapé. Padrão: a direção da variação em palavras
   * ("Subiu no período"), ou "Sem comparação" quando `variacao` é `null`.
   */
  rodape?: ReactNode;
  /** A explicação do ⓘ. Padrão: `kpi.descricao`. */
  apoio?: ReactNode;
  /**
   * Indicador em que cair é o resultado desejado (reabertura, tempo do
   * ciclo): o selo de variação fica verde quando cai e vermelho quando sobe.
   */
  quedaEBoa?: boolean;
  /** Ícone de contexto, no canto, num quadradinho tingido. */
  icone?: TablerIcon;
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
  Icone: TablerIcon;
} {
  if (kpi.variacao === null) {
    return {
      texto: 'Sem comparação no período',
      curto: 'Sem comparação',
      Icone: IconMinus
    };
  }
  if (kpi.variacao > 0) {
    return { texto: 'Subiu no período', Icone: IconTrendingUp };
  }
  if (kpi.variacao < 0) {
    return { texto: 'Caiu no período', Icone: IconTrendingDown };
  }
  return { texto: 'Estável no período', Icone: IconMinus };
}

/**
 * O *section card* do `dashboard-01` alimentado por um `Kpi` de
 * `analytics.ts`, sobre o `CartaoDeIndicador`: ícone, rótulo e o ⓘ com a
 * descrição → número em 30px tabular → selo da variação → uma linha de
 * rodapé.
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
      rotuloTexto={kpi.rotulo}
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
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset shadow-xs',
              BADGE_VARIAÇÃO[estado]
            )}
          >
            <Icone
              aria-hidden="true"
              className="size-3 stroke-[2.5]"
            />
            <span aria-hidden="true">{kpi.variacaoTexto}</span>
            <span className="sr-only">{variacaoFalada}</span>
          </span>
        ) : null
      }
      rodape={
        rodape ?? (
          <div className="flex w-full items-center justify-between gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 font-medium',
                estado === 'combina'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : estado === 'difere'
                    ? 'text-rose-700 dark:text-rose-400'
                    : estado === 'atencao'
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-muted-foreground'
              )}
            >
              <Icone
                aria-hidden="true"
                className="size-3 shrink-0 stroke-[2]"
              />
              <span className="truncate">
                {curto && kpi.variacao === null ? curto : texto}
              </span>
            </span>
            {kpi.variacao !== null ? (
              <span className="shrink-0 font-normal text-muted-foreground/60">
                vs. anterior
              </span>
            ) : null}
          </div>
        )
      }
      apoio={apoio ?? kpi.descricao}
    />
  );
}
