'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ESTADO_ROTEIRO_LABEL,
  getEmpresasKpis,
  getPermanenciaPorCoorte,
  getRetornoDasEmpresas,
  getRoteirosDeLigacao,
  PERIODO_LABEL,
  type CoortePermanencia,
  type EstadoRoteiro,
  type Periodo,
  type RetornoEmpresa
} from '@/features/iel-demo/analysis/analytics';
import { CULTURE_INVITE_DEADLINE_DAYS } from '@/features/iel-demo/analysis/culture-invites';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getCompanyCultureProfile,
  getCompanyListRows,
  getCultureInvites,
  getCultureReading,
  getCultureSampleProgress,
  getJobRanking,
  getJobsByCompany,
  getReferralListSelection,
  JOB_STAGE_LABEL,
  REFERRAL_LIMIT,
  type CompanyListRow,
  type CultureSampleProgress
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  ClipboardCheck,
  Clock,
  Lightbulb,
  Phone,
  Reply,
  Search,
  Timer,
  Users,
  type LucideIcon
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { Textarea, toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
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
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
import { Progress } from '@workspace/ui/shadcn/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@workspace/ui/shadcn/sheet';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@workspace/ui/shadcn/tabs';

import { usePageHeader } from '../layout/page-header-context';
import { MapaDaEmpresa } from '../mapa-cultural/mapa-da-empresa';
import {
  BADGE_DE_ESTADO,
  LADO,
  PREENCHIMENTO_CLARO,
  PREENCHIMENTO_DE_ESTADO,
  SELO,
  type TomDeCor
} from '../metricas/cores';
import { CartaoDeIndicador, KpiCard } from '../metricas/kpi-card';
import { MarcadorHistorico } from '../metricas/marcador-historico';
import { PERIODO_PADRAO, SeletorPeriodo } from '../metricas/seletor-periodo';
import { ValorOculto } from '../metricas/valor-oculto';
import { ABAS_SEM_ROLAGEM } from '../shared/abas';
import { formatarDataCurta, formatarDataHora } from '../shared/datas';
import { CompanyCultureTable } from './culture-profile';
import { CultureInviteForm, CultureSampleTable } from './culture-sample';
import { CustoDaRotatividadeCard } from './custo-da-rotatividade';

/**
 * A empresa vista pelo analista.
 *
 * Duas telas: a lista, que é uma tabela de empresas com o andamento da
 * consulta, e o detalhe, que responde "como se trabalha aqui?" em cartões de
 * seção e três abas. Convidar e cobrar a amostra são trabalho do IEL — o
 * gestor vê a leitura da própria empresa e mais nada (PRODUTO.md §5.1).
 */

/** Um cartão de seção, na gramática do block: descrição, número, rodapé. */
function SectionCard({
  description,
  value,
  badge,
  footer,
  hint,
  icone,
  tom
}: {
  description: string;
  value: string;
  badge?: React.ReactNode;
  footer: string;
  hint?: string;
  icone: LucideIcon;
  tom: TomDeCor;
}) {
  return (
    <CartaoDeIndicador
      rotulo={description}
      valor={value}
      selo={badge}
      icone={icone}
      tom={tom}
      rodape={footer}
      apoio={hint}
    />
  );
}

/** O prazo como frase curta de badge: uma contagem, não uma data. */
function deadlineLabel(progress: CultureSampleProgress): string {
  if (progress.total > 0 && progress.answered === progress.total) {
    return 'todos responderam';
  }
  const days = progress.daysLeft;
  if (days === null) return 'sem prazo';
  if (progress.overdue) return 'prazo vencido';
  if (days <= 0) return 'vence hoje';
  return `vence em ${plural(days, 'dia', 'dias')}`;
}

type AbaEmpresas = 'com-vaga' | 'aguardando-equipe' | 'todas';

const ABAS_EMPRESAS: AbaEmpresas[] = ['com-vaga', 'aguardando-equipe', 'todas'];

const TODOS_OS_SETORES = 'todos';

/**
 * A lista de empresas do IEL.
 *
 * São mais de 2.500 empresas atendidas, e a pergunta da tela não é "quais
 * existem", é "com quem eu tenho trabalho agora". Por isso abre em "Com vaga
 * aberta", filtra por nome, cidade e setor, e pagina **antes** de desenhar:
 * a tabela nunca monta mais linhas do que a página mostra. A leitura pesada
 * (vagas, amostra e perfil de cada empresa) é feita uma vez em
 * `getCompanyListRows` e memorizada; buscar e trocar de aba só filtram.
 */
export function CompaniesScreen() {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;
  const [aba, setAba] = useState<AbaEmpresas>('com-vaga');
  const [busca, setBusca] = useState('');
  const [setor, setSetor] = useState(TODOS_OS_SETORES);
  const [pagina, setPagina] = useState(0);
  const [porPagina, setPorPagina] = useState(10);
  const [periodo, setPeriodo] = useState<Periodo>(PERIODO_PADRAO);

  usePageHeader({ breadcrumb: [{ label: 'Empresas' }] });

  const linhas = useMemo(() => getCompanyListRows(state), [state]);
  const kpis = useMemo(() => getEmpresasKpis(state, periodo), [state, periodo]);

  const setores = useMemo(
    () =>
      [...new Set(linhas.map((linha) => linha.company.sector))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    [linhas]
  );

  // A busca e o setor valem para as três abas; os contadores das abas
  // respondem "quantas há com esse filtro", não "quantas há no total".
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter(
      (linha) =>
        (setor === TODOS_OS_SETORES || linha.company.sector === setor) &&
        (termo.length === 0 ||
          `${linha.company.name} ${linha.company.sector} ${linha.company.location}`
            .toLowerCase()
            .includes(termo))
    );
  }, [linhas, busca, setor]);

  const porAba = useMemo(() => {
    const comVaga = filtradas.filter((linha) => linha.openJobs > 0);
    // O avesso do KPI "Consulta à equipe fechada": a consulta ainda tem
    // ponto em aberto, ou seja, a equipe não respondeu o bastante.
    const aguardandoEquipe = filtradas.filter(
      (linha) => linha.openPoints !== null && linha.openPoints > 0
    );
    return {
      'com-vaga': comVaga,
      'aguardando-equipe': aguardandoEquipe,
      todas: filtradas
    } satisfies Record<AbaEmpresas, CompanyListRow[]>;
  }, [filtradas]);

  const lista = porAba[aba];
  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas - 1);
  const visiveis = lista.slice(
    paginaAtual * porPagina,
    paginaAtual * porPagina + porPagina
  );

  const trocarAba = (valor: string) => {
    const escolhida = ABAS_EMPRESAS.find((item) => item === valor);
    if (!escolhida) return;
    setAba(escolhida);
    setPagina(0);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            {linhas.length.toLocaleString('pt-BR')} empresas atendidas · quem
            tem vaga aberta e quem ainda deve respostas.
          </p>
        </div>
        <SeletorPeriodo
          value={periodo}
          onChange={setPeriodo}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KpiCard
          kpi={kpis.empresasComVagaAtiva}
          icone={Building2}
          tom="empresa"
          className="lg:col-span-2"
        />
        <KpiCard
          kpi={kpis.perfilCompleto}
          icone={ClipboardCheck}
          tom="empresa"
          className="lg:col-span-2"
        />
        <KpiCard
          kpi={kpis.tempoParaCompletarPerfil}
          quedaEBoa
          icone={Timer}
          tom="neutro"
          className="lg:col-span-2"
        />
        <KpiCard
          kpi={{ ...kpis.roteirosUsados, rotulo: 'Roteiros usados' }}
          icone={Phone}
          tom="empresa"
          className="lg:col-span-3"
          valor={`${kpis.roteirosUsados.valor ?? 0} de ${kpis.roteirosGerados.valor ?? 0}`}
          apoio={`Roteiros de ligação usados de ${plural(kpis.roteirosGerados.valor ?? 0, 'gerado', 'gerados')} no período.`}
        />
        <KpiCard
          kpi={kpis.retornoSobreCurriculos}
          icone={Reply}
          tom="empresa"
          className="sm:col-span-2 lg:col-span-3"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            value={aba}
            onValueChange={trocarAba}
          >
            <TabsList
              className={cn(
                ABAS_SEM_ROLAGEM,
                '**:data-[slot=badge]:h-5 **:data-[slot=badge]:min-w-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1'
              )}
            >
              <TabsTrigger value="com-vaga">
                Com vaga aberta{' '}
                <Badge variant="secondary">
                  {porAba['com-vaga'].length.toLocaleString('pt-BR')}
                </Badge>
              </TabsTrigger>
              {/*
               * "Perfil em aberto" confundia com "Com vaga aberta": uma fala
               * de vaga, a outra de consulta. O nome agora diz quem está
               * esperando — a equipe da empresa, que ainda não respondeu o
               * bastante para o perfil fechar.
               */}
              <TabsTrigger value="aguardando-equipe">
                Aguardando a equipe{' '}
                <Badge variant="secondary">
                  {porAba['aguardando-equipe'].length.toLocaleString('pt-BR')}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="todas">
                Todas{' '}
                <Badge variant="secondary">
                  {porAba.todas.length.toLocaleString('pt-BR')}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              />
              <Label
                htmlFor="buscar-empresa"
                className="sr-only"
              >
                Buscar empresa
              </Label>
              <Input
                id="buscar-empresa"
                type="search"
                placeholder="Nome, cidade ou setor…"
                value={busca}
                onChange={(event) => {
                  setBusca(event.target.value);
                  setPagina(0);
                }}
                className="h-8 w-[220px] pl-8 text-[13px]"
              />
            </div>
            <Select
              value={setor}
              onValueChange={(valor) => {
                setSetor(valor);
                setPagina(0);
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-[180px]"
                aria-label="Filtrar por setor"
              >
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_OS_SETORES}>
                  Todos os setores
                </SelectItem>
                {setores.map((item) => (
                  <SelectItem
                    key={item}
                    value={item}
                  >
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableCaption className="sr-only">
              Empresas atendidas: {lista.length.toLocaleString('pt-BR')}{' '}
              {lista.length === 1 ? 'empresa' : 'empresas'} nesta lista, página{' '}
              {paginaAtual + 1} de {totalPaginas}. Abra uma empresa pelo nome.
            </TableCaption>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead scope="col">Empresa</TableHead>
                <TableHead
                  scope="col"
                  className="w-[8rem] text-right"
                >
                  Vagas abertas
                </TableHead>
                <TableHead
                  scope="col"
                  className="w-[14rem]"
                >
                  {/* Mesmo nome do KPI e da aba: é a consulta à equipe que o
                      "N de M" conta. */}
                  Consulta à equipe
                </TableHead>
                <TableHead
                  scope="col"
                  className="w-[10rem]"
                >
                  Prazo
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma empresa com esse filtro.
                  </TableCell>
                </TableRow>
              ) : (
                visiveis.map(({ company, openJobs, sample, openPoints }) => {
                  const percent =
                    sample && sample.total > 0
                      ? (sample.answered / sample.total) * 100
                      : 0;
                  const aberto = openPoints !== null && openPoints > 0;

                  return (
                    <TableRow key={company.id}>
                      <TableCell>
                        <Link
                          href={iel.companies.byId(company.id)}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {company.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {company.sector} · {company.location}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {openJobs}
                      </TableCell>
                      <TableCell>
                        {sample ? (
                          <div className="flex items-center gap-2">
                            <Progress
                              aria-hidden="true"
                              className="h-1.5 w-16 bg-muted"
                              value={percent}
                            />
                            <span className="tabular-nums">
                              {sample.answered} de {sample.total}
                              <span className="sr-only"> responderam</span>
                            </span>
                            {aberto ? (
                              <>
                                <CircleAlert
                                  aria-hidden="true"
                                  className="size-3.5 text-[hsl(var(--brand-accent))]"
                                />
                                <span className="sr-only">
                                  ,{' '}
                                  {plural(
                                    openPoints,
                                    'tema em aberto',
                                    'temas em aberto'
                                  )}
                                </span>
                              </>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            sem consulta
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sample ? (
                          deadlineLabel(sample)
                        ) : (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">Sem prazo</span>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {lista.length.toLocaleString('pt-BR')}{' '}
            {lista.length === 1 ? 'empresa' : 'empresas'} nesta lista
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label
                htmlFor="empresas-por-pagina"
                className="text-sm font-medium"
              >
                Linhas por página
              </Label>
              <Select
                value={`${porPagina}`}
                onValueChange={(valor) => {
                  setPorPagina(Number(valor));
                  setPagina(0);
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="w-20"
                  id="empresas-por-pagina"
                >
                  <SelectValue placeholder={`${porPagina}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 50].map((tamanho) => (
                    <SelectItem
                      key={tamanho}
                      value={`${tamanho}`}
                    >
                      {tamanho}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              aria-live="polite"
              className="flex w-fit items-center justify-center text-sm font-medium"
            >
              Página {paginaAtual + 1} de {totalPaginas}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => setPagina(0)}
                disabled={paginaAtual === 0}
              >
                <span className="sr-only">Primeira página</span>
                <ChevronsLeft aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPagina(Math.max(0, paginaAtual - 1))}
                disabled={paginaAtual === 0}
              >
                <span className="sr-only">Página anterior</span>
                <ChevronLeft aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() =>
                  setPagina(Math.min(totalPaginas - 1, paginaAtual + 1))
                }
                disabled={paginaAtual >= totalPaginas - 1}
              >
                <span className="sr-only">Próxima página</span>
                <ChevronRight aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => setPagina(totalPaginas - 1)}
                disabled={paginaAtual >= totalPaginas - 1}
              >
                <span className="sr-only">Última página</span>
                <ChevronsRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/*
       * Retorno (7/12) e permanência (5/12) na mesma linha, com a mesma
       * altura; a quebra por setor desce para uma linha própria, em largura
       * cheia: dentro do cartão do retorno ela deixava a permanência com um
       * vão enorme embaixo.
       */}
      <div className="grid items-stretch gap-4 lg:grid-cols-12">
        <RetornoDasEmpresasCard
          periodo={periodo}
          className="lg:col-span-7"
        />
        <PermanenciaCard className="lg:col-span-5" />
        <RetornoPorSetorCard
          periodo={periodo}
          className="lg:col-span-12"
        />
      </div>
    </div>
  );
}

/** As abas do detalhe da empresa, na ordem em que aparecem. */
const ABAS_DA_EMPRESA = [
  'cultura',
  'mapa',
  'colaboradores',
  'ligacao',
  'custo',
  'vagas'
] as const;

type AbaDaEmpresa = (typeof ABAS_DA_EMPRESA)[number];

export function CompanyDetailScreen({ companyId }: { companyId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const iel = routes.dashboard.iel;
  const [convidando, setConvidando] = useState(false);
  /*
   * A aba entra por `?aba=`: é assim que a rota legada do mapa de cultura e o
   * botão do cabeçalho da vaga chegam direto na aba certa, sem precisar de
   * uma rota por aba. `?vaga=` só serve à aba do mapa, para abrir o escopo já
   * nos inscritos daquela vaga.
   */
  const searchParams = useSearchParams();
  const abaDoLink = ABAS_DA_EMPRESA.find(
    (aba) => aba === searchParams.get('aba')
  );
  const vagaDoLink = searchParams.get('vaga');
  const [aba, setAba] = useState<AbaDaEmpresa>(abaDoLink ?? 'cultura');

  const company = getCompany(companyId);
  const ehAnalista = persona.kind === 'analista';
  const foraDoEscopo =
    persona.kind === 'gestor' &&
    persona.companyId !== null &&
    persona.companyId !== companyId;

  const invites = getCultureInvites(state, companyId);
  const emAberto = invites.filter((invite) => !invite.answeredAt);
  const progress = getCultureSampleProgress(state, companyId);
  const profile = getCompanyCultureProfile(state, companyId);
  const reading = getCultureReading(state, companyId);
  const jobs = useMemo(() => getJobsByCompany(companyId), [companyId]);

  const cobrar = () => {
    for (const invite of emAberto) {
      dispatch({
        type: 'resend-culture-invite',
        inviteId: invite.id,
        at: nowIso()
      });
    }
    toast.success(
      `${plural(emAberto.length, 'link reenviado', 'links reenviados')}, com mais ${CULTURE_INVITE_DEADLINE_DAYS} dias de prazo.`
    );
  };

  usePageHeader({
    breadcrumb: [
      { label: 'Empresas', href: iel.companies.index },
      { label: company?.name ?? companyId }
    ],
    actions:
      ehAnalista && company ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConvidando(true)}
          >
            Convidar colaboradores
          </Button>
          {emAberto.length > 0 ? (
            <Button
              size="sm"
              onClick={cobrar}
            >
              Cobrar {emAberto.length} que faltam
            </Button>
          ) : null}
        </>
      ) : null
  });

  if (!company) {
    return (
      <p className="text-sm text-muted-foreground">Empresa não encontrada.</p>
    );
  }

  if (foraDoEscopo && persona.companyId) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta empresa está fora do escopo da persona selecionada. O gestor vê
        apenas a própria empresa.{' '}
        <Link
          className="underline underline-offset-4"
          href={iel.companies.byId(persona.companyId)}
        >
          Abrir minha empresa
        </Link>
        .
      </p>
    );
  }

  const suficientes = profile.filter(
    (axis) => axis.ready && axis.mean !== null
  ).length;
  const sugestoes = reading.filter(
    (entry) => entry.pendingSuggestion !== null
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">{company.name}</h1>
        <p className="text-sm text-muted-foreground">
          {company.sector} · {company.location} · contato: {company.contactName}
        </p>
      </div>

      {/*
       * Três números, todos da empresa: quem respondeu, quantos pontos
       * fecham e quantas sugestões esperam confirmação. "Vagas abertas" saiu
       * daqui — com o rodapé "até 5 currículos por vaga", era regra de vaga
       * dentro do herói da empresa — e virou contador na aba Vagas.
       */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SectionCard
          description="Responderam"
          icone={Users}
          tom="empresa"
          value={`${progress.answered} de ${progress.total}`}
          badge={
            <Badge
              variant="outline"
              className={cn(
                SELO,
                progress.overdue
                  ? BADGE_DE_ESTADO.atencao
                  : progress.answered >= progress.total
                    ? BADGE_DE_ESTADO.combina
                    : BADGE_DE_ESTADO.neutro
              )}
            >
              <Clock className="size-3" />
              {deadlineLabel(progress)}
            </Badge>
          }
          footer={
            progress.ready
              ? 'A consulta sustenta o perfil'
              : 'A consulta ainda não sustenta o perfil'
          }
          hint={`mínimo de ${progress.requiredForProfile} respostas da equipe por ponto`}
        />
        <SectionCard
          description="Temas fechados"
          icone={ClipboardCheck}
          tom="empresa"
          value={`${suficientes} de ${profile.length}`}
          badge={
            suficientes < profile.length ? (
              <Badge
                variant="outline"
                className={cn(SELO, BADGE_DE_ESTADO.atencao)}
              >
                <CircleAlert className="size-3" />
                faltam {profile.length - suficientes}
              </Badge>
            ) : undefined
          }
          footer={
            suficientes === profile.length
              ? 'Os 10 temas fecham'
              : `${plural(profile.length - suficientes, 'tema em aberto', 'temas em aberto')}`
          }
          hint="Ponto sem base não entra no cálculo"
        />
        <SectionCard
          description="Sugestões para confirmar"
          icone={Lightbulb}
          tom="neutro"
          value={plural(sugestoes, 'ponto', 'pontos')}
          footer={
            sugestoes === 0
              ? 'Nada pendente de confirmação'
              : 'Aguardando confirmação da empresa'
          }
          hint="vêm da descrição das vagas"
        />
      </div>

      <Tabs
        value={aba}
        onValueChange={(valor) => {
          const escolhida = ABAS_DA_EMPRESA.find((item) => item === valor);
          if (escolhida) setAba(escolhida);
        }}
      >
        <TabsList className={ABAS_SEM_ROLAGEM}>
          <TabsTrigger value="cultura">Como a empresa trabalha</TabsTrigger>
          {/*
           * O mapa de cultura era tela solta no menu e abria na base inteira.
           * Aqui ele responde a pergunta de quem está nesta página: quem na
           * base combina com esta cultura. É leitura da base de pessoas do
           * IEL, então fica fora da visão do gestor (PRODUTO.md §5.1).
           */}
          {ehAnalista ? (
            <TabsTrigger value="mapa">Mapa de cultura</TabsTrigger>
          ) : null}
          {ehAnalista ? (
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
          ) : null}
          {ehAnalista ? (
            <TabsTrigger value="ligacao">Ligação</TabsTrigger>
          ) : null}
          {/*
           * O custo de reabrir fica ao lado da Ligação porque é na ligação
           * que ele é usado: o IEL não cobra pelo serviço, então a adesão da
           * empresa à consulta se convence com este número. É peça do
           * analista, não da empresa (MoSCoW S5).
           */}
          {ehAnalista ? (
            <TabsTrigger value="custo">Custo de reabrir</TabsTrigger>
          ) : null}
          <TabsTrigger value="vagas">
            Vagas{' '}
            <Badge
              variant="secondary"
              className="h-5 min-w-5 rounded-full bg-muted-foreground/30 px-1"
            >
              {jobs.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cultura">
          <CompanyCultureTable companyId={companyId} />
        </TabsContent>

        {ehAnalista ? (
          <TabsContent value="mapa">
            <MapaDaEmpresa
              companyId={companyId}
              vagaInicial={vagaDoLink}
            />
          </TabsContent>
        ) : null}

        {ehAnalista ? (
          <TabsContent
            value="colaboradores"
            className="flex flex-col gap-4"
          >
            <CultureSampleTable companyId={companyId} />
          </TabsContent>
        ) : null}

        {ehAnalista ? (
          <TabsContent value="ligacao">
            <RoteiroDaLigacao companyId={companyId} />
          </TabsContent>
        ) : null}

        {ehAnalista ? (
          <TabsContent value="custo">
            <CustoDaRotatividadeCard
              companyId={companyId}
              companyName={company.name}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="vagas">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableCaption className="sr-only">
                Vagas de {company.name}: etapa, marcados para envio e
                compatíveis
              </TableCaption>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead scope="col">Vaga</TableHead>
                  <TableHead
                    scope="col"
                    className="w-[12rem]"
                  >
                    Etapa
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="w-[11rem] text-right"
                  >
                    Marcados para envio
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="w-[10rem] text-right"
                  >
                    Compatíveis
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const marcados = getReferralListSelection(
                    state,
                    job.id
                  ).length;
                  const compativeis = getJobRanking(state, job.id).filter(
                    (entry) => entry.adherence.compatible === true
                  ).length;

                  return (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Link
                          href={iel.jobs.byId(job.id).index}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {job.title}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          {job.workShift}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {JOB_STAGE_LABEL[job.stage]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {marcados} de {REFERRAL_LIMIT}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {compativeis}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {ehAnalista ? (
        <Sheet
          open={convidando}
          onOpenChange={setConvidando}
        >
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Convidar colaboradores</SheetTitle>
              <SheetDescription>
                Cerca de 20% da área da vaga e das áreas conexas. É a média
                dessas respostas que descreve como a empresa trabalha.
              </SheetDescription>
            </SheetHeader>
            <div className="px-6 pb-6">
              <CultureInviteForm
                companyId={companyId}
                onDone={() => setConvidando(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Indicadores da lista: retorno e permanência
 * ------------------------------------------------------------------ */

/** Tom de cada desfecho na barra empilhada: um azul-noite em três passos. */
/**
 * Contratou é o resultado bom (verde), não contratou é desfecho neutro
 * (cinza-ardósia) e sem resposta é o que pede cobrança (laranja claro).
 */
const TOM_DO_RETORNO: Record<RetornoEmpresa, string> = {
  contratou: PREENCHIMENTO_DE_ESTADO.combina,
  'nao-contratou': PREENCHIMENTO_CLARO.neutro,
  'sem-resposta': PREENCHIMENTO_CLARO.atencao
};

const PREENCHIMENTO_EMPRESA_CLARO = PREENCHIMENTO_CLARO.empresa;

/**
 * "O que aconteceu com os currículos enviados?" — contratou, não contratou
 * ou sem resposta, sobre as remessas do período, com o motivo do "não" e a
 * quebra por setor. Setor com menos de 5 remessas mostra "—".
 */
function RetornoDasEmpresasCard({
  periodo,
  className
}: {
  periodo: Periodo;
  className?: string;
}) {
  const retorno = useMemo(
    () => getRetornoDasEmpresas(periodo, 'setor'),
    [periodo]
  );
  const segundo = retorno.motivos[1];
  const contratou = retorno.itens.find((item) => item.retorno === 'contratou');
  const maiorMotivo = Math.max(1, ...retorno.motivos.map((m) => m.n));

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1 text-base font-semibold">
          Retorno das empresas <MarcadorHistorico />
        </CardTitle>
        <CardDescription>
          {PERIODO_LABEL[periodo]} ·{' '}
          {plural(retorno.n, 'remessa enviada', 'remessas enviadas')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        {retorno.oculto ? (
          <p className="text-sm text-muted-foreground">
            Menos de 5 remessas no período: oculto para proteger quem respondeu.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div
                className="flex h-4 min-w-0 flex-1 gap-0.5 overflow-hidden rounded-full"
                role="img"
                aria-label={`Retorno das remessas: ${retorno.itens
                  .map((item) => `${item.rotulo}, ${item.pct ?? 0}%`)
                  .join('; ')}`}
              >
                {retorno.itens.map((item) =>
                  item.pct ? (
                    <div
                      key={item.retorno}
                      className={cn(
                        'first:rounded-l-full last:rounded-r-full',
                        TOM_DO_RETORNO[item.retorno]
                      )}
                      style={{ width: `${item.pct}%` }}
                      title={`${item.rotulo}: ${item.pct}% (${item.n})`}
                    />
                  ) : null
                )}
              </div>
              {/* O rótulo acima já lê o valor; o número grande é para os olhos. */}
              <div
                aria-hidden="true"
                className="flex shrink-0 flex-col items-end leading-tight"
              >
                <span className="text-3xl font-semibold tabular-nums">
                  {contratou?.pct ?? 0}%
                </span>
                <span className="text-xs text-muted-foreground">
                  contrataram
                </span>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2 text-xs">
              {retorno.itens.map((item) => (
                <li
                  key={item.retorno}
                  className="inline-flex h-5 items-center gap-1.5 rounded-full border px-2"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'size-2.5 rounded-sm',
                      TOM_DO_RETORNO[item.retorno]
                    )}
                  />
                  <span className="text-muted-foreground">{item.rotulo}</span>
                  <span className="font-medium tabular-nums">
                    {item.pct ?? 0}%
                  </span>
                </li>
              ))}
            </ul>
            {retorno.motivos.some((motivo) => motivo.n > 0) ? (
              <div className="flex flex-1 flex-col gap-2">
                <p className="text-sm font-medium">Por que não contratou</p>
                {/* A barra é só desenho; o % escrito ao lado é o equivalente. */}
                <ol
                  aria-label="Motivos de não contratação, do mais citado ao menos citado"
                  className="flex flex-1 flex-col justify-around gap-1.5"
                >
                  {retorno.motivos.map((motivo, indice) => {
                    const destaque = indice === 0 && motivo.n > 0;
                    return (
                      <li
                        key={motivo.motivo}
                        className="grid grid-cols-[minmax(0,14rem)_1fr_3rem] items-center gap-3 text-sm"
                      >
                        <span
                          className={cn('truncate', destaque && 'font-medium')}
                        >
                          {motivo.rotulo}
                          <span className="sr-only">:</span>
                        </span>
                        <div
                          aria-hidden="true"
                          className="h-2 overflow-hidden rounded-full bg-muted/70"
                        >
                          <div
                            className={cn(
                              'h-full rounded-full',
                              destaque
                                ? LADO.empresa.preenchimento
                                : PREENCHIMENTO_EMPRESA_CLARO
                            )}
                            style={{
                              width: `${(100 * motivo.n) / maiorMotivo}%`
                            }}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-right tabular-nums',
                            destaque && 'font-semibold'
                          )}
                        >
                          {motivo.pct === null ? (
                            <ValorOculto />
                          ) : (
                            `${motivo.pct}%`
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
            {retorno.motivoMaisCitado ? (
              <p className="text-sm">
                Motivo mais citado quando não contrata:{' '}
                <span className="font-medium">
                  {retorno.motivoMaisCitado.rotulo.toLowerCase()} (
                  {retorno.motivoMaisCitado.pct}%)
                </span>
                {segundo && segundo.n > 0 && segundo.pct !== null ? (
                  <>
                    , seguido de{' '}
                    {segundo.motivo === 'outro'
                      ? 'outros motivos'
                      : segundo.rotulo.toLowerCase()}{' '}
                    ({segundo.pct}%)
                  </>
                ) : null}
                .
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A quebra do retorno por setor, em linha própria e largura cheia. Setor com
 * menos de 5 remessas não vira linha de "—": juntam-se numa frase só.
 */
function RetornoPorSetorCard({
  periodo,
  className
}: {
  periodo: Periodo;
  className?: string;
}) {
  const retorno = useMemo(
    () => getRetornoDasEmpresas(periodo, 'setor'),
    [periodo]
  );
  const setoresVisiveis = retorno.grupos.filter((grupo) => !grupo.oculto);
  const setoresOcultos = retorno.grupos.length - setoresVisiveis.length;
  if (retorno.oculto || retorno.grupos.length === 0) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1 text-base font-semibold">
          Retorno por setor <MarcadorHistorico />
        </CardTitle>
        <CardDescription>
          {PERIODO_LABEL[periodo]} · em percentual das remessas de cada setor
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {setoresVisiveis.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableCaption className="sr-only">
                Retorno das empresas por setor, em percentual das remessas
              </TableCaption>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead scope="col">Setor</TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Remessas
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Contratou
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Não contratou
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Sem resposta
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {setoresVisiveis.map((grupo) => (
                  <TableRow key={grupo.chave}>
                    <TableCell>{grupo.rotulo}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {grupo.oculto ? <ValorOculto /> : grupo.n}
                    </TableCell>
                    {grupo.itens.map((item) => (
                      <TableCell
                        key={item.retorno}
                        className="text-right tabular-nums"
                      >
                        {grupo.oculto || item.pct === null ? (
                          <ValorOculto />
                        ) : (
                          `${item.pct}%`
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
        {setoresOcultos > 0 ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <ValorOculto />
            {plural(setoresOcultos, 'setor', 'setores')} com menos de 5 remessas
            no período ficam de fora da tabela.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Coorte padrão: a mais recente com os 90 dias já apurados. */
function coortePadrao(coortes: CoortePermanencia[]): string | undefined {
  const apuradas = coortes.filter(
    (c) => !c.oculto && c.contratados > 0 && c.ficaram90Pct !== null
  );
  return (apuradas.at(-1) ?? coortes.at(-1))?.mes;
}

/** O "—" para os olhos, com o motivo escrito para o leitor de tela. */
function Traco({ texto }: { texto: string }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{texto}</span>
    </>
  );
}

/**
 * Um dos três números da coorte, com uma barra verde do quanto ficou (a
 * base, "Contratados", é a barra cheia em cinza). Sem taxa, o trilho fica
 * vazio.
 */
function NumeroDaCoorte({
  rotulo,
  valor,
  apoio,
  pct,
  base = false
}: {
  rotulo: string;
  valor: React.ReactNode;
  apoio: string;
  pct: number | null;
  /** A base da coorte: barra cheia em cinza, só para dar a régua. */
  base?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{rotulo}</span>
        <span className="text-3xl font-semibold tabular-nums">{valor}</span>
      </div>
      <div
        aria-hidden="true"
        className="h-2 overflow-hidden rounded-full bg-muted/70"
      >
        <div
          className={cn(
            'h-full rounded-full',
            base
              ? 'bg-[hsl(var(--estado-neutro-fg)/0.45)]'
              : PREENCHIMENTO_DE_ESTADO.combina
          )}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{apoio}</span>
    </div>
  );
}

/**
 * "Quem foi contratado ficou?" — por coorte de contratação, aos 30 e aos 90
 * dias. Coorte ainda correndo mostra "em apuração"; coorte com menos de 5
 * contratados, "—".
 */
function PermanenciaCard({ className }: { className?: string }) {
  const coortes = useMemo(() => getPermanenciaPorCoorte(), []);
  const [mes, setMes] = useState(() => coortePadrao(coortes));
  const coorte = coortes.find((c) => c.mes === mes);

  const taxa = (
    pctFicou: number | null,
    apurados: number
  ): { valor: React.ReactNode; apoio: string } => {
    if (!coorte) return { valor: <Traco texto="sem dado" />, apoio: '' };
    if (coorte.oculto)
      return { valor: <ValorOculto />, apoio: 'recorte pequeno' };
    if (pctFicou === null) {
      return {
        valor: <Traco texto="ainda sem taxa" />,
        apoio: `em apuração · ${apurados} de ${coorte.contratados} com desfecho`
      };
    }
    return {
      valor: `${pctFicou}%`,
      apoio: `dos ${coorte.contratados} contratados`
    };
  };
  const trinta = taxa(coorte?.ficaram30Pct ?? null, coorte?.apurados30 ?? 0);
  const noventa = taxa(coorte?.ficaram90Pct ?? null, coorte?.apurados90 ?? 0);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-1 text-base font-semibold">
          Permanência aos 30 e 90 dias <MarcadorHistorico />
        </CardTitle>
        <CardDescription>Por mês de contratação</CardDescription>
      </CardHeader>
      {/*
       * Os três números um embaixo do outro, do contratado ao que ficou 90
       * dias, distribuídos na altura do cartão: ao lado do retorno, que é
       * alto, a fileira de três deixava um vão embaixo.
       */}
      {/* O mês fica no conteúdo, e não no canto do cabeçalho: ali ele
          espremia o título em duas linhas e o cabeçalho ficava mais alto que
          o do retorno, ao lado. */}
      <CardContent className="flex flex-1 flex-col gap-4">
        <div>
          <Select
            value={mes}
            onValueChange={setMes}
          >
            <SelectTrigger
              size="sm"
              className="w-auto"
              aria-label="Mês de contratação"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {[...coortes].reverse().map((c) => (
                <SelectItem
                  key={c.mes}
                  value={c.mes}
                >
                  Contratados em {c.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 flex-col justify-around gap-5">
          <NumeroDaCoorte
            base
            pct={coorte && !coorte.oculto ? 100 : null}
            rotulo="Contratados"
            valor={
              coorte ? (
                coorte.oculto ? (
                  <ValorOculto />
                ) : (
                  coorte.contratados
                )
              ) : (
                <Traco texto="sem dado" />
              )
            }
            apoio="que a empresa devolveu"
          />
          <NumeroDaCoorte
            pct={coorte && !coorte.oculto ? coorte.ficaram30Pct : null}
            rotulo="Ficaram 30 dias"
            valor={trinta.valor}
            apoio={trinta.apoio}
          />
          <NumeroDaCoorte
            pct={coorte && !coorte.oculto ? coorte.ficaram90Pct : null}
            rotulo="Ficaram 90 dias"
            valor={noventa.valor}
            apoio={noventa.apoio}
          />
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        A empresa responde em um toque, aos 30 e aos 90 dias. É o dado que
        realimenta o cálculo.
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Roteiro da ligação (detalhe da empresa)
 * ------------------------------------------------------------------ */

/**
 * As cinco perguntas da ligação com a empresa. Elas buscam o que o
 * questionário não captura: o dia a dia como ele é, não como se declara.
 */
const PERGUNTAS_DA_LIGACAO = [
  'Como é um dia comum nessa função, do começo ao fim do turno?',
  'Quem saiu dessa função nos últimos meses saiu por qual motivo?',
  'O que o líder da equipe mais valoriza em quem chega?',
  'Quais combinados não estão escritos, mas todo mundo segue?',
  'O que faria você considerar essa contratação um acerto em 90 dias?'
] as const;

type AnotacoesDaLigacao = { respostas: string[]; salvoEm: string };

const chaveDaLigacao = (companyId: string) => `mind-rh:ligacao:${companyId}`;

/**
 * As anotações ficam no navegador de quem ligou, por empresa. É protótipo:
 * não passam pelo estado da demonstração nem saem daqui. Armazenamento
 * bloqueado (aba anônima, cota) não quebra a tela — só não guarda.
 */
function lerAnotacoes(companyId: string): AnotacoesDaLigacao | null {
  try {
    const bruto = window.localStorage.getItem(chaveDaLigacao(companyId));
    if (!bruto) return null;
    const lido = JSON.parse(bruto) as Partial<AnotacoesDaLigacao>;
    if (!Array.isArray(lido.respostas) || typeof lido.salvoEm !== 'string') {
      return null;
    }
    return {
      respostas: PERGUNTAS_DA_LIGACAO.map((_, i) =>
        typeof lido.respostas?.[i] === 'string' ? lido.respostas[i] : ''
      ),
      salvoEm: lido.salvoEm
    };
  } catch {
    return null;
  }
}

function gravarAnotacoes(
  companyId: string,
  anotacoes: AnotacoesDaLigacao
): boolean {
  try {
    window.localStorage.setItem(
      chaveDaLigacao(companyId),
      JSON.stringify(anotacoes)
    );
    return true;
  } catch {
    return false;
  }
}

const ETAPAS_DO_ROTEIRO: {
  estado: Exclude<EstadoRoteiro, 'nao-gerado'>;
  campo: 'geradoEm' | 'abertoEm' | 'usadoEm';
}[] = [
  { estado: 'gerado', campo: 'geradoEm' },
  { estado: 'aberto', campo: 'abertoEm' },
  { estado: 'usado', campo: 'usadoEm' }
];

function RoteiroDaLigacao({ companyId }: { companyId: string }) {
  const { state } = useIelDemo();
  const roteiro = useMemo(
    () =>
      getRoteirosDeLigacao(state).itens.find(
        (item) => item.companyId === companyId
      ),
    [state, companyId]
  );
  const [aberto, setAberto] = useState(false);
  const [salvas, setSalvas] = useState<AnotacoesDaLigacao | null>(null);
  const [rascunho, setRascunho] = useState<string[]>(() =>
    PERGUNTAS_DA_LIGACAO.map(() => '')
  );

  // localStorage só existe no navegador: lê depois de montar.
  useEffect(() => {
    setSalvas(lerAnotacoes(companyId));
  }, [companyId]);

  const abrir = () => {
    setRascunho(salvas?.respostas ?? PERGUNTAS_DA_LIGACAO.map(() => ''));
    setAberto(true);
  };

  const salvar = () => {
    const anotacoes = { respostas: rascunho, salvoEm: nowIso() };
    if (gravarAnotacoes(companyId, anotacoes)) {
      setSalvas(anotacoes);
      toast.success('Anotações da ligação guardadas neste navegador.');
    } else {
      toast.error('Não deu para guardar neste navegador.');
    }
    setAberto(false);
  };

  const respondidas = salvas
    ? salvas.respostas.filter((r) => r.trim().length > 0).length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Roteiro da ligação
        </CardTitle>
        <CardDescription>
          {salvas
            ? `${respondidas} de ${PERGUNTAS_DA_LIGACAO.length} perguntas anotadas · ${formatarDataHora(salvas.salvoEm)}`
            : 'O que o questionário não captura, perguntado por telefone'}
        </CardDescription>
        <CardAction>
          <Button
            size="sm"
            onClick={abrir}
          >
            Registrar o que ouvi
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {ETAPAS_DO_ROTEIRO.map(({ estado, campo }) => {
            const data = roteiro?.[campo] ?? null;
            return (
              <Badge
                key={estado}
                variant="outline"
                className="gap-1 font-normal text-muted-foreground"
              >
                {data ? (
                  <Check
                    aria-hidden="true"
                    className="size-3 text-foreground"
                  />
                ) : (
                  <Clock
                    aria-hidden="true"
                    className="size-3"
                  />
                )}
                {ESTADO_ROTEIRO_LABEL[estado]}
                {data ? ` · ${formatarDataCurta(data)}` : ''}
                {data ? null : <span className="sr-only">: ainda não</span>}
              </Badge>
            );
          })}
          {roteiro ? null : (
            <span className="text-xs text-muted-foreground">
              Sem vaga ativa: o roteiro nasce com a vaga.
            </span>
          )}
        </div>

        <ol className="flex flex-col gap-3">
          {PERGUNTAS_DA_LIGACAO.map((pergunta, indice) => (
            <li
              key={pergunta}
              className="grid grid-cols-[1.5rem_1fr] gap-2 text-sm"
            >
              <span className="text-muted-foreground tabular-nums">
                {indice + 1}.
              </span>
              <span className="flex flex-col gap-1">
                {pergunta}
                {salvas?.respostas[indice]?.trim() ? (
                  <span className="line-clamp-2 text-muted-foreground">
                    {salvas.respostas[indice]}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        A ligação põe lado a lado o que a equipe declarou no questionário e o
        que se vive no dia a dia.
      </CardFooter>

      <Sheet
        open={aberto}
        onOpenChange={setAberto}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Registrar o que ouvi</SheetTitle>
            <SheetDescription>
              Anote com as palavras de quem falou. Fica guardado neste
              navegador, só para o IEL.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4">
            {PERGUNTAS_DA_LIGACAO.map((pergunta, indice) => (
              <div
                key={pergunta}
                className="flex flex-col gap-2"
              >
                <Label htmlFor={`ligacao-${indice}`}>
                  {indice + 1}. {pergunta}
                </Label>
                <Textarea
                  id={`ligacao-${indice}`}
                  rows={3}
                  value={rascunho[indice] ?? ''}
                  onChange={(event) => {
                    const valor = event.target.value;
                    setRascunho((atual) =>
                      atual.map((r, i) => (i === indice ? valor : r))
                    );
                  }}
                />
              </div>
            ))}
          </div>
          <SheetFooter>
            <Button onClick={salvar}>Guardar anotações</Button>
            <Button
              variant="outline"
              onClick={() => setAberto(false)}
            >
              Cancelar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
