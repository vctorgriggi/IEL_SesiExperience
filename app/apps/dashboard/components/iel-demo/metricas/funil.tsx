'use client';

import type { EtapaDeFunil } from '@/features/iel-demo/analysis/analytics';

import { cn } from '@workspace/ui/lib/utils';

import { ESCALA, TEXTO_DE_ESTADO } from './cores';
import { formatarNumero } from './formato';
import { ValorOculto } from './valor-oculto';

/**
 * Degrau da `ESCALA` de cada etapa: do claro no topo ao escuro no fim, para
 * a etapa final (o resultado) ser a mais forte, num degradê suave (2 a 4): a
 * cor forte do card é o laranja da maior perda. O degrau 1 fica de fora: é
 * claro demais para uma barra de 12px sobre o trilho.
 */
function degrauDaEtapa(indice: number, total: number): string {
  const degraus = ESCALA.slice(1, 4);
  if (total <= 1) return degraus[degraus.length - 1] ?? '';
  const posicao = Math.round((indice * (degraus.length - 1)) / (total - 1));
  return degraus[posicao] ?? '';
}

/** Índice da etapa com a maior perda sobre a anterior, ou -1 se não houver. */
function etapaDaMaiorPerda(etapas: EtapaDeFunil[]): number {
  let alvo = -1;
  let maior = 0;
  etapas.forEach((etapa, indice) => {
    if (indice === 0 || etapa.oculto || etapa.pctDaAnterior === null) return;
    const perda = 100 - etapa.pctDaAnterior;
    if (perda > maior) {
      maior = perda;
      alvo = indice;
    }
  });
  return alvo;
}

/**
 * Funil em barras horizontais, uma linha por etapa: rótulo, barra
 * proporcional à primeira etapa, número grande à direita e, abaixo dele, o %
 * da etapa anterior em `text-xs`.
 *
 * Não é um `Card`: entra no `CardContent` de quem usa. Etapa com
 * `oculto: true` mostra "—" com o `Tooltip` do recorte mínimo e nenhuma
 * barra. `emApuracao` aparece como "+N em apuração" abaixo do %.
 *
 * As barras seguem a `ESCALA` verde-azulada, do claro ao escuro. A etapa
 * onde mais gente se perde ganha, em laranja, o rótulo "−35% aqui".
 *
 * Dentro de um pai `flex flex-col` (o `CardContent` de um cartão esticado
 * pelo vizinho), a lista ocupa a altura que sobrar e as etapas se distribuem
 * nela, em vez de ficarem espremidas no topo com um vão embaixo.
 *
 * ```tsx
 * <Funil etapas={getFunilDoPeriodo(state, periodo)} />
 * ```
 */
export function Funil({
  etapas,
  rotuloDaPorcentagem = 'da anterior',
  titulo = 'Funil, etapa por etapa'
}: {
  etapas: EtapaDeFunil[];
  /** Complemento do % sobre a etapa anterior: "62% da anterior". */
  rotuloDaPorcentagem?: string;
  /** Nome da lista para o leitor de tela. */
  titulo?: string;
}) {
  const primeira = etapas[0];
  const topo = primeira && !primeira.oculto ? primeira.n : 0;
  const maiorPerda = etapaDaMaiorPerda(etapas);

  return (
    // As barras são só desenho (`aria-hidden`): o equivalente em texto é a
    // própria lista — rótulo, número e % de cada etapa, lidos em ordem.
    <ol
      aria-label={titulo}
      className="@container/funil flex flex-1 flex-col justify-between gap-3.5"
    >
      {etapas.map((etapa, indice) => {
        const largura =
          topo > 0 && !etapa.oculto
            ? Math.max(etapa.n > 0 ? 1 : 0, (100 * etapa.n) / topo)
            : 0;
        const eAMaiorPerda = indice === maiorPerda;
        return (
          <li
            key={etapa.id}
            className="grid grid-cols-[minmax(0,7.5rem)_1fr_6rem] items-center gap-3 text-sm @md/funil:grid-cols-[minmax(0,11rem)_1fr_6.5rem]"
          >
            {/* Em coluna estreita o rótulo quebra em duas linhas, e a barra
                fica com o espaço. */}
            <span className="leading-tight">
              {etapa.rotulo}
              <span className="sr-only">:</span>
            </span>
            <div
              className="h-3 overflow-hidden rounded-full bg-muted/70"
              aria-hidden
            >
              <div
                className={cn(
                  'h-full rounded-full',
                  degrauDaEtapa(indice, etapas.length)
                )}
                style={{ width: `${largura}%` }}
              />
            </div>
            <div className="flex flex-col items-end leading-tight">
              <span className="text-lg font-semibold tabular-nums">
                {etapa.oculto ? <ValorOculto /> : formatarNumero(etapa.n)}
              </span>
              {indice > 0 ? (
                <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {etapa.oculto || etapa.pctDaAnterior === null ? (
                    <span aria-hidden="true">—</span>
                  ) : (
                    `${etapa.pctDaAnterior}% ${rotuloDaPorcentagem}`
                  )}
                </span>
              ) : null}
              {eAMaiorPerda && etapa.pctDaAnterior !== null ? (
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap tabular-nums',
                    TEXTO_DE_ESTADO.atencao
                  )}
                >
                  <span aria-hidden="true">
                    −{100 - etapa.pctDaAnterior}% aqui
                  </span>
                  <span className="sr-only">
                    , a maior perda do funil: {100 - etapa.pctDaAnterior}% a
                    menos que a etapa anterior
                  </span>
                </span>
              ) : null}
              {etapa.emApuracao && !etapa.oculto ? (
                <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  +{formatarNumero(etapa.emApuracao)} em apuração
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
