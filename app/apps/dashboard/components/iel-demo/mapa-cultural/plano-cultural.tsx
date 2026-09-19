'use client';

import { useState } from 'react';
import {
  formatAdherence,
  type AdherenceResult
} from '@/features/iel-demo/analysis/adherence';
import {
  FAIXA_DE_ENCAIXE_LABEL,
  faixaDeAderencia,
  FAIXAS_DE_ENCAIXE,
  LIMITE_SEM_PREDOMINANCIA,
  TIPO_DE_CULTURA_LABEL,
  type ClassificacaoCultural
} from '@/features/iel-demo/analysis/mapa-cultural';
import { plural } from '@/features/iel-demo/format';
import type { CultureMapPoint } from '@/features/iel-demo/state/selectors';

import {
  QuadrantChart,
  type QuadrantChartPoint,
  type QuadrantChartQuadrant,
  type QuadrantChartTone
} from '@workspace/charts/quadrant-chart';
import { cn } from '@workspace/ui';

/**
 * Azul-marinho para a multidão, coral da marca para a empresa.
 *
 * Três trocas levaram até aqui, e as duas primeiras caducaram quando o tema
 * mudou. O par original (`--chart-1` e `--chart-2`) media ΔE 0,3 em
 * deuteranopia: a olho nu parecem distintos, para quem tem daltonismo
 * verde-vermelho são a mesma cor. O âmbar que veio depois virou tinta de
 * superfície no tema Mind RH — `--chart-4` é a cor da borda, e o quadrado da
 * empresa sumia no fundo claro.
 *
 * O par atual separa em ΔE 53,1 na visão normal e não cai abaixo de 40 em
 * nenhum tipo de daltonismo. Não é coincidência: `--chart-3` é o coral da
 * marca, reservado no tema para "a marca do 35%, ponto de atenção" — e a
 * empresa de referência é justamente o ponto contra o qual tudo é medido.
 *
 * A forma reforça: círculo para pessoa, quadrado para empresa. Nenhuma leitura
 * do mapa depende só da cor.
 */
export const COR_DO_TALENTO = 'hsl(var(--chart-1))';
export const COR_DA_EMPRESA = 'hsl(var(--chart-3))';

/** Limite da faixa "muito próximo", na mesma escala do plano. */
const RAIO_MUITO_PROXIMO =
  FAIXAS_DE_ENCAIXE.find((f) => f.faixa === 'muito-proximo')?.ate ?? 0.5;

const QUADRANTES: QuadrantChartQuadrant[] = [
  { id: 'colaborativa', label: 'Colaborativa', corner: 'top-left' },
  { id: 'inovadora', label: 'Inovadora', corner: 'top-right' },
  { id: 'estruturada', label: 'Estruturada', corner: 'bottom-left' },
  { id: 'resultados', label: 'Resultados', corner: 'bottom-right' }
];

const ROTULOS_DOS_EIXOS = {
  top: 'Flexível',
  bottom: 'Estável',
  left: 'Pessoas',
  right: 'Entrega'
};

export interface PlanoCulturalProps {
  points: CultureMapPoint[];
  selectedId?: string | null;
  referenceId?: string | null;
  highlightQuadrant?: ClassificacaoCultural | null;
  showProximityRings?: boolean;
  /**
   * Recorte em primeiro plano. Quem fica de fora continua desenhado, só que
   * discreto: o mapa não esconde nem descarta ninguém, apenas ordena a leitura.
   * `null` trata todos os pontos com o mesmo peso.
   */
  focusIds?: Set<string> | null;
  /** Aderência por talento, para o balão repetir o número que a lista mostra. */
  aderenciaPorTalento?: Map<string, AdherenceResult>;
  onSelect?: (id: string) => void;
  className?: string;
}

export function PlanoCultural({
  points,
  selectedId,
  referenceId,
  highlightQuadrant,
  showProximityRings = false,
  focusIds,
  aderenciaPorTalento,
  onSelect,
  className
}: PlanoCulturalProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const pontoReferencia = referenceId
    ? (points.find((p) => p.id === referenceId) ?? null)
    : null;

  const pontoAlvo =
    points.find((p) => p.id === hoveredId) ??
    (selectedId && selectedId !== referenceId
      ? (points.find((p) => p.id === selectedId) ?? null)
      : null);

  function tomDe(ponto: CultureMapPoint): QuadrantChartTone {
    if (ponto.id === referenceId) return 'reference';
    if (ponto.id === selectedId) return 'selected';
    if (focusIds && !focusIds.has(ponto.id)) return 'muted';
    return 'default';
  }

  const pontosDoGrafico: QuadrantChartPoint[] = points.map((ponto) => ({
    id: ponto.id,
    x: ponto.position.x,
    y: ponto.position.y,
    color: ponto.kind === 'talento' ? COR_DO_TALENTO : COR_DA_EMPRESA,
    symbol: ponto.kind === 'talento' ? 'circle' : 'square',
    tone: tomDe(ponto),
    // Uma etiqueta fixa por gráfico: a empresa de referência. O resto vive no
    // balão de hover e na lista ao lado — um nome por ponto tapava vizinhos.
    label: ponto.id === referenceId ? ponto.name : null,
    tether: ponto.teamPosition
      ? { x: ponto.teamPosition.x, y: ponto.teamPosition.y }
      : null
  }));

  const conexao =
    pontoReferencia && pontoAlvo && pontoReferencia.id !== pontoAlvo.id
      ? {
          from: {
            x: pontoReferencia.position.x,
            y: pontoReferencia.position.y
          },
          to: { x: pontoAlvo.position.x, y: pontoAlvo.position.y },
          color: COR_DO_TALENTO
        }
      : null;

  const aneis =
    pontoReferencia && showProximityRings
      ? [
          {
            id: 'muito-proximo',
            x: pontoReferencia.position.x,
            y: pontoReferencia.position.y,
            radius: RAIO_MUITO_PROXIMO,
            color: COR_DA_EMPRESA
          }
        ]
      : [];

  function renderBalao(ponto: QuadrantChartPoint) {
    const original = points.find((p) => p.id === ponto.id);
    if (!original) return null;

    const aderencia = aderenciaPorTalento?.get(original.id) ?? null;

    return (
      <div className="min-w-[150px] max-w-[210px] rounded-lg border border-border bg-popover p-2.5 text-xs shadow-md">
        <div className="flex items-center justify-between gap-1.5 border-b border-border/60 pb-1">
          <span className="truncate font-semibold text-foreground">
            {original.name}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-medium text-muted-foreground">
            <span
              aria-hidden
              className={cn(
                'size-2 shrink-0',
                original.kind === 'talento' ? 'rounded-full' : 'rounded-[2px]'
              )}
              style={{
                backgroundColor:
                  original.kind === 'talento' ? COR_DO_TALENTO : COR_DA_EMPRESA
              }}
            />
            {original.kind === 'talento' ? 'Talento' : 'Empresa'}
          </span>
        </div>
        <p className="mt-1 text-[11px] font-medium text-foreground">
          Cultura {TIPO_DE_CULTURA_LABEL[original.culture]}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {plural(
            original.position.eixosRespondidos.length,
            'eixo respondido',
            'eixos respondidos'
          )}
          {original.divergentAxes > 0
            ? ` · ${plural(original.divergentAxes, 'eixo divergente', 'eixos divergentes')}`
            : ''}
        </p>
        {aderencia ? (
          <p className="mt-1 flex items-baseline justify-between gap-2 border-t border-border/60 pt-1 text-[10px] font-semibold text-foreground">
            <span>
              {FAIXA_DE_ENCAIXE_LABEL[faixaDeAderencia(aderencia.total ?? 0)]}
            </span>
            <span className="tabular-nums">
              {formatAdherence(aderencia.total)}{' '}
              <span className="font-normal text-muted-foreground">
                aderência
              </span>
            </span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <QuadrantChart
      ariaLabel="Mapa de cultura: posição de talentos e empresas em dois eixos de ambiente de trabalho"
      axisLabels={ROTULOS_DOS_EIXOS}
      className={cn('mx-auto', className)}
      connection={conexao}
      neutralRadius={LIMITE_SEM_PREDOMINANCIA}
      onHoverChange={setHoveredId}
      onSelect={onSelect}
      points={pontosDoGrafico}
      quadrants={QUADRANTES.map((q) => ({
        ...q,
        highlighted: highlightQuadrant === q.id,
        dimmed: Boolean(highlightQuadrant) && highlightQuadrant !== q.id
      }))}
      renderTooltip={renderBalao}
      rings={aneis}
    />
  );
}
