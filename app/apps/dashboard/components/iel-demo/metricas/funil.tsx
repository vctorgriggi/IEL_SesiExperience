'use client';

import type { EtapaDeFunil } from '@/features/iel-demo/analysis/analytics';

import { formatarNumero } from './formato';
import { ValorOculto } from './valor-oculto';

/**
 * Funil em barras horizontais, uma linha por etapa: rótulo, barra
 * proporcional à primeira etapa, número tabular e, abaixo do número, o % da
 * etapa anterior em `text-xs text-muted-foreground`.
 *
 * Não é um `Card`: entra no `CardContent` de quem usa. Etapa com
 * `oculto: true` mostra "—" com o `Tooltip` do recorte mínimo e nenhuma
 * barra. `emApuracao` aparece como "+N em apuração" abaixo do %.
 *
 * Um só tom (`bg-primary` sobre `bg-muted`): é magnitude de uma série só,
 * e o número está escrito ao lado de cada barra.
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

  return (
    // As barras são só desenho (`aria-hidden`): o equivalente em texto é a
    // própria lista — rótulo, número e % de cada etapa, lidos em ordem.
    <ol
      aria-label={titulo}
      className="flex flex-col gap-3"
    >
      {etapas.map((etapa, indice) => {
        const largura =
          topo > 0 && !etapa.oculto
            ? Math.max(etapa.n > 0 ? 1 : 0, (100 * etapa.n) / topo)
            : 0;
        return (
          <li
            key={etapa.id}
            className="grid grid-cols-[minmax(0,11rem)_1fr_5.75rem] items-center gap-3 text-sm"
          >
            <span className="truncate">
              {etapa.rotulo}
              <span className="sr-only">:</span>
            </span>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${largura}%` }}
              />
            </div>
            <div className="flex flex-col items-end leading-tight">
              <span className="font-medium tabular-nums">
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
