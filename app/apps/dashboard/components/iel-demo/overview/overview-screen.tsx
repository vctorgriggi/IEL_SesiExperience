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
import { ArrowRight, Check, CircleAlert, Clock, RefreshCw } from 'lucide-react';

import { Badge } from '@workspace/ui/shadcn/badge';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { RodapeDaTabela, usePaginacao } from '../jobs/table-pagination';
import { usePageHeader } from '../layout/page-header-context';
import { ManagerOverview } from '../manager/manager-overview';
import { formatarNumero } from '../metricas/formato';
import { Funil } from '../metricas/funil';
import { KpiCard } from '../metricas/kpi-card';
import { MarcadorHistorico } from '../metricas/marcador-historico';
import { PERIODO_PADRAO, SeletorPeriodo } from '../metricas/seletor-periodo';
import {
  montarPendencias,
  PENDENCIAS_VISIVEIS,
  TIPO_DE_PENDENCIA_LABEL,
  type Pendencia,
  type TipoDePendencia
} from './pendencias';

// TODO: trocar por `routes.dashboard.iel.bi` quando a rota do BI entrar em
// `@workspace/routes` (a tela está sendo feita em paralelo).
const ROTA_DO_BI = '/iel/bi';

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
 *
 * A fila continua sendo a primeira coisa à esquerda — é por ela que a
 * analista começa o dia. Acima, quatro números do período; à direita, o
 * funil e as duas pontas (empresa com perfil completo, candidato que
 * respondeu). Os números que vêm do histórico simulado levam o marcador de
 * relógio: são o que o retorno de um toque passa a medir, não medições.
 *
 * O período abre em 90 dias: em 30 a base é pequena e o número balança.
 */
export function OverviewScreen() {
  const { state, persona } = useIelDemo();
  const [todas, setTodas] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_PADRAO);

  const pendencias = useMemo(() => montarPendencias(state), [state]);
  const lista = todas ? pendencias : pendencias.slice(0, PENDENCIAS_VISIVEIS);
  const paginacao = usePaginacao(lista);

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

  usePageHeader({ breadcrumb: [{ label: 'Hoje' }] });

  if (persona.kind === 'gestor') {
    return <ManagerOverview />;
  }

  const empregare = integracoes.find((i) => i.id === 'empregare');
  const cabe = pendencias.length <= PENDENCIAS_VISIVEIS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* A hora é a de quem abre; no servidor pode dar outra saudação. */}
          <h1
            className="text-xl font-semibold tracking-tight"
            suppressHydrationWarning
          >
            {saudacao(new Date().getHours())}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dataPorExtenso(DEMO_REFERENCE_DATE)} ·{' '}
            {plural(kpis.vagasAtivas.valor ?? 0, 'vaga ativa', 'vagas ativas')}{' '}
            · {formatarNumero(candidatos)}{' '}
            {candidatos === 1 ? 'pessoa na base' : 'pessoas na base'}
          </p>
          {empregare ? (
            <div>
              <Badge
                variant="outline"
                className="gap-1 font-normal text-muted-foreground"
              >
                <RefreshCw className="size-3" />
                {empregare.rotulo} {empregare.detalhe.toLowerCase()}
              </Badge>
            </div>
          ) : null}
        </div>
        <SeletorPeriodo
          value={periodo}
          onChange={setPeriodo}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard kpi={kpis.vagasAtivas} />
        <KpiCard kpi={kpis.respostaQuestionario} />
        <KpiCard kpi={kpis.retornoEmpresas} />
        <KpiCard kpi={kpis.permanencia90} />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Precisa de você hoje
            </CardTitle>
            <CardDescription>
              {pendencias.length === 0
                ? 'Nada em aberto.'
                : `${plural(pendencias.length, 'pendência', 'pendências')}, na ordem em que compensa resolver`}
            </CardDescription>
            {cabe ? null : (
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTodas((atual) => !atual);
                    paginacao.irPara(0);
                  }}
                >
                  {todas
                    ? `Só os ${PENDENCIAS_VISIVEIS} mais urgentes`
                    : `Ver todos (${pendencias.length})`}
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {pendencias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Quando chegar uma resposta ou uma vaga ficar parada, a linha
                aparece aqui.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>O que fazer</TableHead>
                      <TableHead className="w-[180px] text-right">
                        <span className="sr-only">Ação</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agrupar(paginacao.linhas).map((grupo, indice) => (
                      <Fragment key={`${grupo.tipo}-${indice}`}>
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={2}
                            className="pt-4 text-xs font-medium text-muted-foreground"
                          >
                            {TIPO_DE_PENDENCIA_LABEL[grupo.tipo]}
                          </TableCell>
                        </TableRow>
                        {grupo.itens.map((pendencia) => (
                          <TableRow key={pendencia.id}>
                            <TableCell className="max-w-0 whitespace-normal">
                              <span className="block truncate font-medium">
                                {pendencia.titulo}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {pendencia.resumo}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={pendencia.href}>
                                  {pendencia.verbo}
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {todas ? (
              <RodapeDaTabela
                paginacao={paginacao}
                resumo={plural(pendencias.length, 'pendência', 'pendências')}
              />
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1 text-base font-medium">
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
                    Ver no BI <ArrowRight />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <Funil etapas={funil} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
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

/** Uma das pontas: rótulo, % e a barra, com a base em texto pequeno. */
function Ponta({ kpi }: { kpi: Kpi }) {
  const id = `ponta-${kpi.id}`;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span id={id}>{kpi.rotulo}</span>
        <span className="font-medium tabular-nums">
          {kpi.valor === null ? '—' : `${kpi.valor}%`}
        </span>
      </div>
      <Progress
        aria-labelledby={id}
        value={kpi.valor ?? 0}
        className="h-1.5"
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
      ? Check
      : integracao.estado === 'atencao'
        ? CircleAlert
        : Clock;
  return (
    <span
      className="flex items-center gap-1"
      title={integracao.detalhe}
    >
      <Icone
        className={
          integracao.estado === 'atencao'
            ? 'size-3 text-[hsl(var(--brand-accent))]'
            : 'size-3'
        }
      />
      {integracao.rotulo}
      {integracao.estado === 'configurando' ? ' em configuração' : null}
    </span>
  );
}
