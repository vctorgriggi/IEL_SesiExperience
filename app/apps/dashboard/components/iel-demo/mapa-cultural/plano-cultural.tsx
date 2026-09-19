'use client';

import { useState } from 'react';
import {
  formatAdherence,
  type AdherenceResult
} from '@/features/iel-demo/analysis/adherence';
import {
  FAIXA_DE_ENCAIXE_LABEL,
  faixaDeAderencia,
  FAIXAS_DE_ADERENCIA,
  LIMITE_SEM_PREDOMINANCIA,
  raioDaAderenciaNoPlano,
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

/**
 * Com uma empresa de referência, o plano deixa de ser um mapa de posições
 * absolutas e passa a ser um alvo: a empresa no centro, e cada pessoa a uma
 * distância que **é** a aderência dela.
 *
 * A versão anterior desenhava a posição absoluta dos dois lados e deixava a
 * distância cair onde caísse. Medido na base, metade dos pares aparecia
 * invertida — alguém com 88% mais longe que alguém com 81% —, porque o plano
 * tem duas dimensões e a aderência mede cinco eixos ponderados. Projetar cinco
 * em duas destrói a ordem, e nenhuma escolha de projeção conserta isso.
 *
 * Aqui o raio carrega o percentual e o ângulo carrega a direção da diferença:
 * de que lado do ambiente a pessoa puxa em relação à empresa. Quem está mais
 * perto tem mais aderência, sempre, porque é a mesma grandeza.
 *
 * No modo Panorama da Base não há contra quem medir, então o plano volta a ser
 * de posições absolutas e os quadrantes voltam a valer.
 */
/**
 * Direção em que a pessoa difere da empresa, preservada da posição absoluta.
 *
 * Empatados no mesmo ponto, o ângulo vem do identificador — determinístico,
 * para que dois talentos idênticos não se sobreponham e a tela não mude de
 * desenho entre recarregamentos.
 */
function anguloDaDiferenca(
  posicao: { x: number; y: number },
  referencia: { x: number; y: number },
  id: string
): number {
  const dx = posicao.x - referencia.x;
  const dy = posicao.y - referencia.y;
  if (Math.abs(dx) > 1e-6 || Math.abs(dy) > 1e-6) return Math.atan2(dy, dx);

  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((hash >>> 0) % 360) * (Math.PI / 180);
}

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

  /** Modo alvo: há uma empresa no centro e percentuais para medir contra ela. */
  const modoAlvo = Boolean(pontoReferencia && aderenciaPorTalento?.size);

  /**
   * Onde cada ponto é desenhado.
   *
   * No modo alvo a empresa vai ao centro do plano e cada pessoa recebe o raio
   * da própria aderência. Fora dele, todo mundo fica na posição absoluta que
   * as respostas produzem.
   */
  function coordenadaDe(ponto: CultureMapPoint): { x: number; y: number } {
    if (!modoAlvo || !pontoReferencia) return ponto.position;
    if (ponto.id === pontoReferencia.id) return { x: 0, y: 0 };

    const total = aderenciaPorTalento?.get(ponto.id)?.total;
    if (total === null || total === undefined) return ponto.position;

    const raio = raioDaAderenciaNoPlano(total);
    const angulo = anguloDaDiferenca(
      ponto.position,
      pontoReferencia.position,
      ponto.id
    );
    return { x: raio * Math.cos(angulo), y: raio * Math.sin(angulo) };
  }

  const pontosDoGrafico: QuadrantChartPoint[] = points.map((ponto) => ({
    id: ponto.id,
    ...coordenadaDe(ponto),
    color: ponto.kind === 'talento' ? COR_DO_TALENTO : COR_DA_EMPRESA,
    symbol: ponto.kind === 'talento' ? 'circle' : 'square',
    tone: tomDe(ponto),
    // Uma etiqueta fixa por gráfico: a empresa de referência. O resto vive no
    // balão de hover e na lista ao lado — um nome por ponto tapava vizinhos.
    label: ponto.id === referenceId ? ponto.name : null,
    /*
     * A voz da equipe só cabe no plano de posições absolutas: no modo alvo o
     * raio já está ocupado pela aderência, e desenhar um segundo ponto ali
     * sugeriria uma segunda medida que não existe.
     */
    tether:
      !modoAlvo && ponto.teamPosition
        ? { x: ponto.teamPosition.x, y: ponto.teamPosition.y }
        : null
  }));

  const conexao =
    pontoReferencia && pontoAlvo && pontoReferencia.id !== pontoAlvo.id
      ? {
          from: coordenadaDe(pontoReferencia),
          to: coordenadaDe(pontoAlvo),
          color: COR_DO_TALENTO,
          label: (() => {
            const a = aderenciaPorTalento?.get(pontoAlvo.id)?.total;
            return a === null || a === undefined
              ? null
              : `${formatAdherence(a)} de aderência`;
          })()
        }
      : null;

  /**
   * Os anéis são a escala do plano no modo alvo: cada um marca onde começa uma
   * faixa. Sem eles o raio seria uma grandeza sem legenda.
   */
  const aneis =
    modoAlvo && showProximityRings
      ? FAIXAS_DE_ADERENCIA.filter((faixa) =>
          Number.isFinite(faixa.aPartirDe)
        ).map((faixa) => ({
          id: faixa.faixa,
          x: 0,
          y: 0,
          radius: raioDaAderenciaNoPlano(faixa.aPartirDe),
          label: `${Math.round(faixa.aPartirDe)}%`,
          color: COR_DA_EMPRESA
        }))
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
      ariaLabel={
        modoAlvo
          ? 'Mapa de cultura: empresa de referência no centro, cada pessoa a uma distância proporcional à aderência'
          : 'Mapa de cultura: posição de talentos e empresas em dois eixos de ambiente de trabalho'
      }
      className={cn('mx-auto', className)}
      connection={conexao}
      axisLabels={modoAlvo ? undefined : ROTULOS_DOS_EIXOS}
      neutralRadius={modoAlvo ? undefined : LIMITE_SEM_PREDOMINANCIA}
      onHoverChange={setHoveredId}
      onSelect={onSelect}
      points={pontosDoGrafico}
      /*
       * Os quadrantes nomeiam regiões de posição absoluta. No modo alvo o
       * ponto está onde a aderência o coloca, não onde a cultura dele cai —
       * manter os rótulos faria a tela afirmar o que o desenho não diz.
       */
      quadrants={
        modoAlvo
          ? []
          : QUADRANTES.map((q) => ({
              ...q,
              highlighted: highlightQuadrant === q.id,
              dimmed: Boolean(highlightQuadrant) && highlightQuadrant !== q.id
            }))
      }
      renderTooltip={renderBalao}
      showCrosshair={!modoAlvo}
      rings={aneis}
    />
  );
}
