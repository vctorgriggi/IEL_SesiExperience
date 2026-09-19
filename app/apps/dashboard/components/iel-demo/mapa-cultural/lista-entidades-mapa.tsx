'use client';

import {
  ADHERENCE_THRESHOLD,
  formatAdherence,
  type AdherenceResult
} from '@/features/iel-demo/analysis/adherence';
import { CULTURE_QUESTIONS } from '@/features/iel-demo/analysis/culture';
import {
  faixaDeAderencia,
  MINIMO_DE_EIXOS_PARA_RANQUEAR,
  temBaseParaRanquear,
  TIPO_DE_CULTURA_LABEL
} from '@/features/iel-demo/analysis/mapa-cultural';
import { plural } from '@/features/iel-demo/format';
import type { CultureMapPoint } from '@/features/iel-demo/state/selectors';
import {
  Building01Icon,
  Cancel01Icon,
  Search01Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn, Input } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';

import { DetalhePontoCultural } from './detalhe-ponto-cultural';
import { FaixaBadge } from './faixa-badge';
import { COR_DA_EMPRESA, COR_DO_TALENTO } from './plano-cultural';

export interface ListaEntidadesMapaProps {
  pontos: CultureMapPoint[];
  todosPontos: CultureMapPoint[];
  selecionadoId: string | null;
  empresaReferencia?: CultureMapPoint | null;
  /**
   * Aderência de cada talento à empresa de referência. Vazio fora do modo
   * Empresa & Talentos: sem uma empresa contra a qual medir, não há posição a
   * atribuir e a lista volta a ser só uma lista.
   */
  aderenciaPorTalento?: Map<string, AdherenceResult>;
  vagaContextoId?: string | null;
  busca: string;
  quadranteAtivo: string | null;
  onSelect: (id: string | null) => void;
  onBuscaChange: (termo: string) => void;
  onLimparQuadrante: () => void;
}

export function ListaEntidadesMapa({
  pontos,
  todosPontos,
  selecionadoId,
  empresaReferencia,
  aderenciaPorTalento,
  vagaContextoId,
  busca,
  quadranteAtivo,
  onSelect,
  onBuscaChange,
  onLimparQuadrante
}: ListaEntidadesMapaProps) {
  const pontoSelecionadoObj =
    todosPontos.find((p) => p.id === selecionadoId) ?? null;

  return (
    <div className="flex flex-col space-y-3">
      {/* Card de Destaque do Selecionado */}
      {pontoSelecionadoObj ? (
        <DetalhePontoCultural
          empresaReferencia={empresaReferencia}
          onClear={() => onSelect(null)}
          ponto={pontoSelecionadoObj}
          vagaContextoId={vagaContextoId}
        />
      ) : null}

      {/* Barra de Pesquisa */}
      <div className="relative">
        <HugeiconsIcon
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          icon={Search01Icon}
        />
        <Input
          className="pl-9 pr-8 text-xs"
          onChange={(event) => onBuscaChange(event.target.value)}
          placeholder="Buscar por nome ou setor..."
          value={busca}
        />
        {busca ? (
          <button
            aria-label="Limpar busca"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onBuscaChange('')}
            type="button"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={14}
            />
          </button>
        ) : null}
      </div>

      {/* Lista de Entidades */}
      <div className="flex-1">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{plural(pontos.length, 'registro', 'registros')}</span>
          {quadranteAtivo ? (
            <button
              className="text-primary hover:underline"
              onClick={onLimparQuadrante}
              type="button"
            >
              Limpar filtro de região
            </button>
          ) : null}
        </div>

        <ul className="max-h-[380px] space-y-1.5 overflow-y-auto pr-1">
          {pontos.map((ponto, indice) => {
            const isSelected = ponto.id === selecionadoId;
            const isTalento = ponto.kind === 'talento';
            const isReferencia = ponto.id === empresaReferencia?.id;

            const aderencia = isTalento
              ? aderenciaPorTalento?.get(ponto.id)
              : undefined;

            /*
             * A posição conta só quem tem base suficiente, e por isso não pode
             * sair do índice do array: a empresa de referência abre a lista sem
             * número, e quem está abaixo do piso vem depois, também sem número.
             */
            const posicao = (aderencia ? temBaseParaRanquear(aderencia) : false)
              ? pontos.slice(0, indice).filter((anterior) =>
                  (() => {
                    const a = aderenciaPorTalento?.get(anterior.id);
                    return a ? temBaseParaRanquear(a) : false;
                  })()
                ).length + 1
              : null;

            /* Primeira linha sem base suficiente: ganha o separador acima. */
            const anterior = pontos[indice - 1];
            const aderenciaAnterior = anterior
              ? aderenciaPorTalento?.get(anterior.id)
              : undefined;
            const abreGrupoSemBase =
              Boolean(aderencia) &&
              !(aderencia ? temBaseParaRanquear(aderencia) : false) &&
              (!aderenciaAnterior || temBaseParaRanquear(aderenciaAnterior));

            return (
              <li key={`${ponto.kind}-${ponto.id}`}>
                {abreGrupoSemBase ? (
                  <p className="mb-1.5 mt-3 border-t border-border/60 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sem base suficiente para posição
                    <span className="ml-1 font-normal normal-case tracking-normal">
                      · menos de {MINIMO_DE_EIXOS_PARA_RANQUEAR} eixos
                      respondidos pelos dois lados
                    </span>
                  </p>
                ) : null}
                <button
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : isReferencia
                        ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/30'
                        : 'border-border/70 bg-card hover:border-border hover:bg-muted/40'
                  )}
                  onClick={() => onSelect(isSelected ? null : ponto.id)}
                  type="button"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {posicao !== null ? (
                      <span className="w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {posicao}
                      </span>
                    ) : null}

                    {/* Mesmo tom do ponto correspondente no plano. */}
                    <div
                      className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold"
                      style={{
                        color: isTalento ? COR_DO_TALENTO : COR_DA_EMPRESA
                      }}
                    >
                      <HugeiconsIcon
                        icon={isTalento ? UserGroupIcon : Building01Icon}
                        size={14}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            'truncate text-xs font-medium text-foreground',
                            isSelected && 'font-semibold text-primary'
                          )}
                        >
                          {ponto.name}
                        </p>
                        {isReferencia ? (
                          <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                            Empresa Alvo
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {TIPO_DE_CULTURA_LABEL[ponto.culture]} ·{' '}
                        {ponto.position.eixosRespondidos.length} eixos
                        {ponto.divergentAxes > 0
                          ? ` · ${ponto.divergentAxes} diverg.`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {aderencia ? (
                    <div className="shrink-0 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={cn(
                            'text-sm font-semibold tabular-nums',
                            temBaseParaRanquear(aderencia)
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {formatAdherence(aderencia.total)}
                        </span>
                        {/*
                          A faixa lê o próprio percentual ao lado dela — e só
                          aparece quando o percentual se sustenta.
                        */}
                        {temBaseParaRanquear(aderencia) ? (
                          <FaixaBadge
                            faixa={faixaDeAderencia(aderencia.total ?? 0)}
                          />
                        ) : null}
                      </div>
                      {/*
                        O denominador fica à vista, e tanto o corte quanto a
                        falta de base são ditos por escrito: estado de critério
                        nunca depende só da cor.
                      */}
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {!temBaseParaRanquear(aderencia) ? (
                          <>
                            só {aderencia.coverage.answeredAxes} de{' '}
                            {CULTURE_QUESTIONS.length} eixos em comum
                          </>
                        ) : aderencia.compatible ? (
                          <>
                            aderência · {aderencia.coverage.answeredAxes} de{' '}
                            {CULTURE_QUESTIONS.length} eixos
                          </>
                        ) : (
                          <span className="font-medium text-warning">
                            abaixo do corte de{' '}
                            {formatAdherence(ADHERENCE_THRESHOLD)}
                          </span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <Badge variant={isTalento ? 'secondary' : 'outline'}>
                      {isTalento ? 'Talento' : 'Empresa'}
                    </Badge>
                  )}
                </button>
              </li>
            );
          })}

          {pontos.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhum cadastro encontrado para os filtros selecionados.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
