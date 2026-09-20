'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getDuasPontas,
  getFunilDoPeriodo,
  getInicioKpis,
  getStatusIntegracoes,
  PERIODO_LABEL,
  type IntegracaoStatus,
  type Kpi,
  type Periodo
} from '@/features/iel-demo/analysis/analytics';
import { DEMO_REFERENCE_DATE } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getRegiaoDaPersona,
  getVisibleJobs
} from '@/features/iel-demo/state/selectors';
import {
  IconAlertCircle,
  IconArrowBackUp,
  IconArrowRight,
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCheck,
  IconClock,
  IconHourglass,
  IconInbox,
  IconInfoCircle,
  IconMessage,
  IconMessageCircleQuestion,
  IconPhone,
  IconRefresh,
  IconSend,
  IconShieldCheck
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Progress } from '@workspace/ui/shadcn/progress';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

import { RodapeDaTabela, usePaginacao } from '../jobs/table-pagination';
import { usePageHeader } from '../layout/page-header-context';
import { ManagerOverview } from '../manager/manager-overview';
import { ICONE_NO_TOM, LADO } from '../metricas/cores';
import { formatarNumero } from '../metricas/formato';
import { Funil } from '../metricas/funil';
import { KpiCard } from '../metricas/kpi-card';
import { MarcadorHistorico } from '../metricas/marcador-historico';
import { PERIODO_PADRAO, SeletorPeriodo } from '../metricas/seletor-periodo';
import { PainelDaRegional } from './painel-da-regional';
import {
  montarPendencias,
  PENDENCIAS_VISIVEIS,
  TIPO_DE_PENDENCIA_LABEL,
  type NivelDePrioridade,
  type Pendencia,
  type TipoDePendencia
} from './pendencias';

const ROTA_DO_BI = routes.dashboard.iel.bi;

/**
 * Ícone tingido de cada grupo da fila: o tom diz o tipo de coisa antes do
 * texto.
 */
const ICONE_DO_GRUPO: Record<
  TipoDePendencia,
  { Icone: TablerIcon; tom: string }
> = {
  respostas: { Icone: IconInbox, tom: ICONE_NO_TOM.pessoa },
  perguntas: { Icone: IconMessageCircleQuestion, tom: ICONE_NO_TOM.atencao },
  ligacao: { Icone: IconPhone, tom: ICONE_NO_TOM.pessoa },
  envio: { Icone: IconSend, tom: ICONE_NO_TOM.combina },
  questionario: { Icone: IconHourglass, tom: ICONE_NO_TOM.neutro },
  cultura: { Icone: IconBuildingSkyscraper, tom: ICONE_NO_TOM.empresa }
};

/** Pendências em grupos, na ordem em que chegam (já ordenadas por urgência). */
function agrupar(
  pendencias: Pendencia[]
): { tipo: TipoDePendencia; itens: Pendencia[] }[] {
  const grupos: { tipo: TipoDePendencia; itens: Pendencia[] }[] = [];
  for (const pendencia of pendencias) {
    const ultimo = grupos.at(-1);
    if (ultimo && ultimo.tipo === pendencia.tipo) ultimo.itens.push(pendencia);
    else grupos.push({ tipo: pendencia.tipo, itens: [pendencia] });
  }
  return grupos;
}

function getPrioridadeInfo(prioridade: NivelDePrioridade): {
  rotulo: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (prioridade) {
    case 'alta':
      return {
        rotulo: 'Alta',
        badgeClass:
          'bg-rose-500/10 text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:bg-rose-500/20 dark:text-rose-400',
        dotClass: 'bg-rose-500'
      };
    case 'media':
      return {
        rotulo: 'Média',
        badgeClass:
          'bg-amber-500/10 text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:bg-amber-500/20 dark:text-amber-400',
        dotClass: 'bg-amber-500'
      };
    case 'normal':
      return {
        rotulo: 'Normal',
        badgeClass:
          'bg-muted/80 text-muted-foreground ring-1 ring-inset ring-border/50 dark:bg-muted/40 dark:text-muted-foreground',
        dotClass: 'bg-muted-foreground/60'
      };
  }
}

/** "Bom dia", "Boa tarde" ou "Boa noite" pela hora de quem abre. */
function saudacao(hora: number): string {
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "segunda-feira, 14 de setembro" — a data da demonstração por extenso. */
function dataPorExtenso(iso: string): string {
  return new Date(`${iso}T12:00:00.000Z`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC'
  });
}

/**
 * A tela de abertura: o que precisa de mim hoje e como o período está indo.
 */
export function OverviewScreen() {
  const { state, persona } = useIelDemo();
  /*
   * Quem atende uma regional lê outra tela: o quadro da meta no lugar dos
   * quatro indicadores do estado. Não é simplificação por gosto — os
   * indicadores de início são calculados sobre a base inteira, e mostrá-los
   * ao lado de uma carteira regional colocaria dois números que não fecham
   * na mesma tela. A leitura estadual continua inteira na gerência.
   */
  const regiao = useMemo(() => getRegiaoDaPersona(state), [state]);
  const vagasDaRegional = useMemo(
    () => (regiao ? getVisibleJobs(state).length : 0),
    [state, regiao]
  );
  const [todas, setTodas] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_PADRAO);
  const [filtroPrioridade, setFiltroPrioridade] = useState<
    'todas' | NivelDePrioridade
  >('todas');

  const pendencias = useMemo(() => montarPendencias(state), [state]);

  const contadoresPrioridade = useMemo(() => {
    const contagem = { alta: 0, media: 0, normal: 0 };
    for (const p of pendencias) {
      contagem[p.prioridade]++;
    }
    return contagem;
  }, [pendencias]);

  const pendenciasFiltradas = useMemo(() => {
    if (filtroPrioridade === 'todas') return pendencias;
    return pendencias.filter((p) => p.prioridade === filtroPrioridade);
  }, [pendencias, filtroPrioridade]);

  // Posição global no ranking de prioridade (1º, 2º, 3º...)
  const mapaRanking = useMemo(() => {
    const mapa = new Map<string, number>();
    pendencias.forEach((p, idx) => {
      mapa.set(p.id, idx + 1);
    });
    return mapa;
  }, [pendencias]);

  const lista = todas
    ? pendenciasFiltradas
    : pendenciasFiltradas.slice(0, PENDENCIAS_VISIVEIS);
  const paginacao = usePaginacao(lista);
  const cabe = pendenciasFiltradas.length <= PENDENCIAS_VISIVEIS;

  const kpis = useMemo(() => getInicioKpis(state, periodo), [state, periodo]);
  const funil = useMemo(
    () => getFunilDoPeriodo(state, periodo),
    [state, periodo]
  );
  const pontas = useMemo(() => getDuasPontas(state), [state]);
  const integracoes = useMemo(() => getStatusIntegracoes(), []);
  const candidatos = useMemo(
    () => new Set(state.applications.map((a) => a.talentId)).size,
    [state.applications]
  );

  usePageHeader({ breadcrumb: [{ label: 'Início' }] });

  if (persona.kind === 'gestor') {
    return <ManagerOverview />;
  }

  const empregare = integracoes.find((i) => i.id === 'empregare');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1
              className="text-2xl font-bold tracking-tight text-foreground"
              suppressHydrationWarning
            >
              {saudacao(new Date().getHours())}
            </h1>
            {empregare ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <IconRefresh
                  aria-hidden="true"
                  className="size-3"
                />
                {empregare.rotulo} {empregare.detalhe.toLowerCase()}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {dataPorExtenso(DEMO_REFERENCE_DATE)}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 font-medium text-foreground/75">
              {regiao
                ? plural(
                    vagasDaRegional,
                    'vaga na regional',
                    'vagas na regional'
                  )
                : plural(
                    kpis.vagasAtivas.valor ?? 0,
                    'vaga ativa',
                    'vagas ativas'
                  )}
            </span>
            <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 font-medium text-foreground/75">
              {formatarNumero(candidatos)}{' '}
              {candidatos === 1 ? 'pessoa na base' : 'pessoas na base'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SeletorPeriodo
            value={periodo}
            onChange={setPeriodo}
          />
        </div>
      </div>

      {regiao ? (
        <div data-tour="inicio-indicadores">
          <PainelDaRegional
            regiao={regiao}
            state={state}
          />
        </div>
      ) : (
        <div
          data-tour="inicio-indicadores"
          className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            kpi={kpis.vagasAtivas}
            icone={IconBriefcase}
            tom="empresa"
          />
          <KpiCard
            kpi={kpis.respostaQuestionario}
            icone={IconMessage}
            tom="pessoa"
          />
          <KpiCard
            kpi={kpis.retornoEmpresas}
            icone={IconArrowBackUp}
            tom="empresa"
          />
          <KpiCard
            kpi={kpis.permanencia90}
            icone={IconShieldCheck}
            tom="combina"
          />
        </div>
      )}

      {/*
       * Fila larga (7/12) e, à direita, o funil e as duas pontas empilhados.
       */}
      <div className="grid items-stretch gap-4 lg:grid-cols-12">
        <Card
          data-tour="inicio-fila"
          className="h-full rounded-2xl border border-border/75 bg-card/95 shadow-xs lg:col-span-7"
        >
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  Precisa de você hoje
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Sobre o ranking de prioridades"
                      className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none"
                    >
                      <IconInfoCircle
                        aria-hidden="true"
                        className="size-3.5"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-80 rounded-xl p-3 text-xs leading-relaxed shadow-lg">
                    <div className="font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <span>Critério do Ranking de Prioridade:</span>
                    </div>
                    <ul className="space-y-1.5 text-muted-foreground">
                      <li>
                        <strong className="text-rose-600 dark:text-rose-400">
                          🔴 Alta:
                        </strong>{' '}
                        Dúvidas travando o processo ou acompanhamentos com prazo
                        de 30 dias correndo.
                      </li>
                      <li>
                        <strong className="text-amber-600 dark:text-amber-400">
                          🟡 Média:
                        </strong>{' '}
                        Vagas com candidatos compatíveis prontos para remessa
                        (ordenadas por maior volume de talentos).
                      </li>
                      <li>
                        <strong className="text-muted-foreground">
                          ⚪ Normal:
                        </strong>{' '}
                        Candidatos pendentes de questionário de fit ou perfil em
                        aberto.
                      </li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>

              {todas ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTodas(false);
                    paginacao.irPara(0);
                  }}
                >
                  Só os {PENDENCIAS_VISIVEIS} mais urgentes
                </Button>
              ) : null}
            </div>

            <CardDescription className="text-xs">
              {pendenciasFiltradas.length === 0
                ? 'Nenhuma pendência neste filtro.'
                : `${plural(pendenciasFiltradas.length, 'pendência', 'pendências')} ordenadas por critério de impacto e prazo.`}
            </CardDescription>

            {/* Filtros rápidos por nível de prioridade */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setFiltroPrioridade('todas');
                  paginacao.irPara(0);
                }}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer',
                  filtroPrioridade === 'todas'
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                )}
              >
                Todas ({pendencias.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroPrioridade('alta');
                  paginacao.irPara(0);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer',
                  filtroPrioridade === 'alta'
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 font-medium dark:text-rose-400'
                )}
              >
                <span className="size-1.5 rounded-full bg-rose-500" />
                Alta ({contadoresPrioridade.alta})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroPrioridade('media');
                  paginacao.irPara(0);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer',
                  filtroPrioridade === 'media'
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 font-medium dark:text-amber-400'
                )}
              >
                <span className="size-1.5 rounded-full bg-amber-500" />
                Média ({contadoresPrioridade.media})
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroPrioridade('normal');
                  paginacao.irPara(0);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-all cursor-pointer',
                  filtroPrioridade === 'normal'
                    ? 'bg-slate-700 text-white font-semibold shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                )}
              >
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                Normal ({contadoresPrioridade.normal})
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {pendenciasFiltradas.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma pendência encontrada com o filtro selecionado.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <Table>
                  <TableCaption className="sr-only">
                    Precisa de você hoje: pendências em ordem de prioridade de
                    impacto e prazo
                  </TableCaption>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead
                        scope="col"
                        className="w-[52px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        #
                      </TableHead>
                      <TableHead
                        scope="col"
                        className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        O que fazer & Critério
                      </TableHead>
                      <TableHead
                        scope="col"
                        className="w-[110px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        Prioridade
                      </TableHead>
                      <TableHead
                        scope="col"
                        className="w-[160px] text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        <span className="sr-only">Ação</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agrupar(paginacao.linhas).map((grupo, indice) => (
                      <Fragment key={`${grupo.tipo}-${indice}`}>
                        <TableRow className="hover:bg-transparent bg-muted/20 border-b border-border/40">
                          <TableHead
                            scope="colgroup"
                            colSpan={4}
                            className="h-auto py-2.5 px-4 text-xs font-semibold text-muted-foreground"
                          >
                            <GrupoDaFila
                              tipo={grupo.tipo}
                              prioridade={grupo.itens[0]?.prioridade}
                            />
                          </TableHead>
                        </TableRow>
                        {grupo.itens.map((pendencia) => {
                          const rank = mapaRanking.get(pendencia.id) ?? 1;
                          const prioInfo = getPrioridadeInfo(
                            pendencia.prioridade
                          );
                          const isTop3 = rank <= 3;
                          return (
                            <TableRow
                              key={pendencia.id}
                              className="hover:bg-muted/30 transition-colors group"
                            >
                              <TableCell className="w-[52px] text-center py-3">
                                <span
                                  className={cn(
                                    'inline-flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                                    isTop3
                                      ? 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/30 dark:text-rose-300'
                                      : 'bg-muted/60 text-muted-foreground'
                                  )}
                                >
                                  {rank}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-0 whitespace-normal py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="block truncate font-medium text-foreground">
                                    {pendencia.titulo}
                                  </span>
                                  {pendencia.criterio ? (
                                    <span className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                      {pendencia.criterio}
                                    </span>
                                  ) : null}
                                </div>
                                <span className="block truncate text-xs text-muted-foreground mt-0.5">
                                  {pendencia.resumo}
                                </span>
                              </TableCell>
                              <TableCell className="w-[110px] text-center py-3">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                    prioInfo.badgeClass
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'size-1.5 rounded-full',
                                      prioInfo.dotClass
                                    )}
                                  />
                                  {prioInfo.rotulo}
                                </span>
                              </TableCell>
                              <TableCell className="text-right py-3 w-[160px]">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg font-medium transition-all hover:border-primary/40 hover:text-primary"
                                  asChild
                                >
                                  <Link href={pendencia.href}>
                                    {pendencia.verbo}
                                  </Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {todas ? (
              <RodapeDaTabela
                paginacao={paginacao}
                resumo={plural(
                  pendenciasFiltradas.length,
                  'pendência',
                  'pendências'
                )}
              />
            ) : null}
          </CardContent>
          {/* "Ver todos" no pé da lista, colado embaixo: é onde o olho chega
              depois da última linha. */}
          {cabe || todas ? null : (
            <CardFooter className="mt-auto justify-between gap-4 text-sm text-muted-foreground">
              <span>
                Os {PENDENCIAS_VISIVEIS} mais urgentes de {pendencias.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTodas(true);
                  paginacao.irPara(0);
                }}
              >
                Ver todos ({pendencias.length})
              </Button>
            </CardFooter>
          )}
        </Card>

        <div
          data-tour="inicio-funil"
          className="flex flex-col gap-4 lg:col-span-5"
        >
          <Card className="flex-1 rounded-2xl border border-border/75 bg-card/95 shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                Funil do período <MarcadorHistorico />
              </CardTitle>
              <CardDescription>
                {PERIODO_LABEL[periodo]}, vagas encerradas
              </CardDescription>
              <CardAction>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link href={ROTA_DO_BI}>
                    Ver no BI <IconArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <Funil
                etapas={funil}
                titulo={`Funil do período, ${PERIODO_LABEL[periodo]}`}
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/75 bg-card/95 shadow-xs">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                As duas pontas
              </CardTitle>
              <CardDescription>
                Retrato de agora, nas vagas ativas
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Ponta kpi={pontas.empresasPerfilCompleto} />
              <Ponta kpi={pontas.candidatosConcluiram} />
            </CardContent>
            <CardFooter className="flex flex-wrap gap-x-4 gap-y-1 border-t text-xs text-muted-foreground [.border-t]:pt-4">
              {integracoes.map((integracao) => (
                <Integracao
                  key={integracao.id}
                  integracao={integracao}
                />
              ))}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** Nome do grupo da fila com o ícone tingido no tom do tipo e badge de prioridade. */
function GrupoDaFila({
  tipo,
  prioridade
}: {
  tipo: TipoDePendencia;
  prioridade?: NivelDePrioridade;
}) {
  const { Icone, tom } = ICONE_DO_GRUPO[tipo];
  const prioInfo = prioridade ? getPrioridadeInfo(prioridade) : null;
  return (
    <div className="flex items-center justify-between w-full pr-1">
      <span className="flex items-center gap-2">
        <Icone
          aria-hidden="true"
          className={cn('size-4 shrink-0', tom)}
        />
        {/*
         * 14px, o corpo do produto: o cabeçalho de grupo estava em 12px,
         * menor do que as linhas que ele encabeça. Quem separa aqui é o peso
         * e o ícone no tom, não o tamanho para baixo.
         */}
        <span className="text-sm font-semibold text-foreground">
          {TIPO_DE_PENDENCIA_LABEL[tipo]}
        </span>
      </span>
      {prioInfo ? (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            prioInfo.badgeClass
          )}
        >
          <span className={cn('size-1.5 rounded-full', prioInfo.dotClass)} />
          Prioridade {prioInfo.rotulo}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Uma das pontas: rótulo, % grande e a barra no tom do lado (empresa em
 * azul, candidato em verde-azulado), com a base em texto pequeno.
 */
function Ponta({ kpi }: { kpi: Kpi }) {
  const id = `ponta-${kpi.id}`;
  const lado =
    kpi.id === 'empresas-perfil-completo' ? LADO.empresa : LADO.pessoa;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span
          id={id}
          className="flex items-center gap-2 font-medium"
        >
          <span
            aria-hidden="true"
            className={cn('size-2.5 shrink-0 rounded-full', lado.preenchimento)}
          />
          {kpi.rotulo}
        </span>
        {/* A barra logo abaixo já lê o valor com o rótulo. */}
        <span
          aria-hidden="true"
          className="text-2xl font-bold tabular-nums text-foreground"
        >
          {kpi.valor === null ? '—' : `${kpi.valor}%`}
        </span>
      </div>
      {/* Sem base, a barra fica indeterminada: "0%" seria mentira. */}
      <Progress
        aria-labelledby={id}
        value={kpi.valor}
        className={cn(
          'h-2.5 bg-muted/60 overflow-hidden rounded-full',
          lado === LADO.empresa
            ? '[&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-blue-600 [&>[data-slot=progress-indicator]]:to-indigo-600'
            : '[&>[data-slot=progress-indicator]]:bg-gradient-to-r [&>[data-slot=progress-indicator]]:from-teal-600 [&>[data-slot=progress-indicator]]:to-emerald-600',
          '[&>[data-slot=progress-indicator]]:rounded-full'
        )}
      />
      <span className="text-xs text-muted-foreground tabular-nums">
        {kpi.id === 'empresas-perfil-completo'
          ? `sobre ${plural(kpi.n, 'empresa com vaga ativa', 'empresas com vaga ativa')}`
          : `sobre ${plural(kpi.n, 'candidatura fora do prazo de 2 dias', 'candidaturas fora do prazo de 2 dias')}`}
      </span>
    </div>
  );
}

/** Uma integração em uma linha discreta: ícone de estado e nome. */
function Integracao({ integracao }: { integracao: IntegracaoStatus }) {
  const Icone =
    integracao.estado === 'ok'
      ? IconCheck
      : integracao.estado === 'atencao'
        ? IconAlertCircle
        : IconClock;
  return (
    <span
      className="flex items-center gap-1"
      title={integracao.detalhe}
    >
      <Icone
        aria-hidden="true"
        className={
          integracao.estado === 'atencao'
            ? 'size-3 text-[hsl(var(--brand-accent))]'
            : 'size-3'
        }
      />
      {integracao.rotulo}
      {integracao.estado === 'configurando' ? ' em configuração' : null}
      {/* O `title` não chega ao toque nem a todo leitor: o estado vai escrito. */}
      <span className="sr-only">: {integracao.detalhe}</span>
    </span>
  );
}
