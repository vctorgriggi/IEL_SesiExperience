'use client';

import Link from 'next/link';
import {
  ADHERENCE_THRESHOLD,
  formatAdherence
} from '@/features/iel-demo/analysis/adherence';
import { CULTURE_QUESTIONS } from '@/features/iel-demo/analysis/culture';
import {
  faixaDeAderencia,
  resumirDivergencia,
  TIPO_DE_CULTURA_DESCRICAO,
  TIPO_DE_CULTURA_LABEL
} from '@/features/iel-demo/analysis/mapa-cultural';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCultureFit,
  type CultureMapPoint
} from '@/features/iel-demo/state/selectors';
import {
  ArrowRight01Icon,
  Building01Icon,
  Cancel01Icon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import { Button } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';

import { FaixaBadge } from './faixa-badge';
import { COR_DA_EMPRESA, COR_DO_TALENTO } from './plano-cultural';

export interface DetalhePontoCulturalProps {
  ponto: CultureMapPoint;
  empresaReferencia?: CultureMapPoint | null;
  vagaContextoId?: string | null;
  onClear: () => void;
}

export function DetalhePontoCultural({
  ponto,
  empresaReferencia,
  vagaContextoId,
  onClear
}: DetalhePontoCulturalProps) {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;
  const isTalento = ponto.kind === 'talento';

  /*
   * A leitura eixo a eixo só existe no estado, não no ponto do mapa — e é ela
   * que diz no que os dois lados diferem, que é o que se leva para a conversa.
   */
  const leitura =
    isTalento && empresaReferencia
      ? getCultureFit(state, ponto.id, empresaReferencia.id)
      : null;

  /** Lida a partir do próprio percentual, para os dois nunca se contradizerem. */
  const faixa = leitura?.aderencia
    ? faixaDeAderencia(leitura.aderencia.total ?? 0)
    : null;

  const resumo =
    leitura && faixa
      ? resumirDivergencia(
          leitura.talentPosition,
          leitura.companyPosition,
          leitura.axes,
          faixa
        )
      : null;

  /** Para mostrar, ao lado de cada eixo, quanto ele puxou o total. */
  const aderenciaPorEixo = new Map(
    (leitura?.aderencia?.byAxis ?? []).map((eixo) => [
      eixo.axisId,
      eixo.adherence
    ])
  );

  const linkHref = isTalento
    ? vagaContextoId
      ? iel.talents.byId(ponto.id).inJob(vagaContextoId)
      : iel.talents.byId(ponto.id).index
    : iel.companies.index;

  return (
    <div className="iel-panel relative overflow-hidden border-primary/40 bg-gradient-to-br from-card via-card to-primary/[0.04] p-4 shadow-sm">
      {/* Botão Fechar Destaque */}
      <Button
        aria-label="Desmarcar seleção"
        className="absolute right-3 top-3 size-7 text-muted-foreground hover:text-foreground"
        onClick={onClear}
        size="icon"
        variant="ghost"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={16}
        />
      </Button>

      <div className="flex items-start gap-3">
        {/* Mesmo tom do ponto correspondente no plano. */}
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted"
          style={{ color: isTalento ? COR_DO_TALENTO : COR_DA_EMPRESA }}
        >
          <HugeiconsIcon
            icon={isTalento ? UserGroupIcon : Building01Icon}
            size={20}
          />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">
              {ponto.name}
            </h3>
            <Badge variant={isTalento ? 'secondary' : 'outline'}>
              {isTalento ? 'Talento' : 'Empresa'}
            </Badge>
            {faixa ? <FaixaBadge faixa={faixa} /> : null}
          </div>

          {ponto.detail ? (
            <p className="text-xs text-muted-foreground">{ponto.detail}</p>
          ) : null}

          {/* Diagnóstico de Encaixe em Relação à Empresa Selecionada */}
          {empresaReferencia && resumo ? (
            <div className="mt-3 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Aderência cultural
                </span>
                <span className="text-[11px] text-muted-foreground">
                  vs {empresaReferencia.name}
                </span>
              </div>

              {/*
                O número e o que o sustenta, lado a lado. O denominador é
                exigência: "4 de 5 eixos" evita ler 80% como se os cinco
                tivessem sido respondidos.
              */}
              {leitura?.aderencia ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    {formatAdherence(leitura.aderencia.total)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    sobre {leitura.aderencia.coverage.answeredAxes} de{' '}
                    {CULTURE_QUESTIONS.length} eixos
                  </span>
                  {!leitura.aderencia.compatible ? (
                    <Badge
                      className="border-[hsl(var(--brand-accent))]/40 bg-[hsl(var(--brand-accent))]/10 text-[hsl(var(--brand-accent))]"
                      variant="outline"
                    >
                      Abaixo do corte de {formatAdherence(ADHERENCE_THRESHOLD)}
                    </Badge>
                  ) : null}
                </div>
              ) : null}

              <p className="text-xs leading-relaxed text-muted-foreground">
                {resumo.mesmaRegiao ? (
                  <>
                    Os dois lados descrevem um ambiente{' '}
                    <strong className="font-semibold text-foreground">
                      {resumo.tendenciaDaEmpresa}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    A empresa descreve um ambiente{' '}
                    <strong className="font-semibold text-foreground">
                      {resumo.tendenciaDaEmpresa}
                    </strong>
                    , enquanto a pessoa espera um{' '}
                    <strong className="font-semibold text-foreground">
                      {resumo.tendenciaDoTalento}
                    </strong>
                    .
                  </>
                )}{' '}
                {resumo.recomendacao}
              </p>

              {/*
                O que exatamente divergiu. A frase acima resume a região do
                plano; só o eixo diz o que levar para a conversa.
              */}
              {resumo.eixosDivergentes.length > 0 ? (
                <div className="space-y-1.5 border-t border-primary/15 pt-2">
                  <p className="text-[11px] font-semibold text-foreground">
                    Onde vale alinhar
                  </p>
                  <ul className="space-y-1.5">
                    {resumo.eixosDivergentes.map((eixo) => (
                      <li
                        className="text-[11px] leading-relaxed"
                        key={eixo.axisId}
                      >
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {eixo.axisLabel}
                          </span>
                          {aderenciaPorEixo.has(eixo.axisId) ? (
                            <span className="shrink-0 tabular-nums text-muted-foreground">
                              {formatAdherence(
                                aderenciaPorEixo.get(eixo.axisId)!
                              )}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                          <span>
                            Empresa: {eixo.opcaoDaEmpresa.toLowerCase()}
                          </span>
                          <span>
                            Pessoa: {eixo.opcaoDoTalento.toLowerCase()}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="border-t border-primary/15 pt-2 text-[11px] text-muted-foreground">
                  Nenhum eixo divergiu entre os{' '}
                  {plural(
                    resumo.eixosConvergentes.length,
                    'eixo comparado',
                    'eixos comparados'
                  )}
                  .
                </p>
              )}
            </div>
          ) : null}

          <div className="mt-3 space-y-2">
            <div className="rounded-md border border-border/70 bg-muted/40 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  Cultura {TIPO_DE_CULTURA_LABEL[ponto.culture]}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {plural(
                    ponto.position.eixosRespondidos.length,
                    'eixo respondido',
                    'eixos respondidos'
                  )}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {TIPO_DE_CULTURA_DESCRICAO[ponto.culture]}
              </p>
            </div>

            {ponto.divergentAxes > 0 ? (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-2 text-xs text-warning-foreground">
                <span className="font-semibold">Atenção da equipe: </span>
                {plural(
                  ponto.divergentAxes,
                  'eixo divergente',
                  'eixos divergentes'
                )}{' '}
                entre o que a empresa declara e o relato da equipe no dia a dia.
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex items-center justify-between pt-1">
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              href={linkHref}
            >
              {isTalento
                ? vagaContextoId
                  ? 'Ver perfil do talento na vaga'
                  : 'Ver perfil completo do talento'
                : 'Ver contexto da empresa'}
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
