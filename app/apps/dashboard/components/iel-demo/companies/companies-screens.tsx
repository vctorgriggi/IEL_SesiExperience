'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleAlert,
  Clock,
  Search
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
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
  SheetHeader,
  SheetTitle
} from '@workspace/ui/shadcn/sheet';
import {
  Table,
  TableBody,
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
import { CompanyCultureTable } from './culture-profile';
import { CultureInviteForm, CultureSampleTable } from './culture-sample';

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
  hint
}: {
  description: string;
  value: string;
  badge?: React.ReactNode;
  footer: string;
  hint?: string;
}) {
  return (
    <Card className="from-primary/5 to-card bg-gradient-to-t shadow-xs">
      <CardHeader>
        <CardDescription>{description}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {value}
        </CardTitle>
        {badge ? <CardAction>{badge}</CardAction> : null}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1 text-sm">
        <span className="font-medium">{footer}</span>
        {hint ? <span className="text-muted-foreground">{hint}</span> : null}
      </CardFooter>
    </Card>
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

type AbaEmpresas = 'com-vaga' | 'perfil-aberto' | 'todas';

const ABAS_EMPRESAS: AbaEmpresas[] = ['com-vaga', 'perfil-aberto', 'todas'];

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

  usePageHeader({ breadcrumb: [{ label: 'Empresas' }] });

  const linhas = useMemo(() => getCompanyListRows(state), [state]);

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
    const perfilAberto = filtradas.filter(
      (linha) => linha.openPoints !== null && linha.openPoints > 0
    );
    return {
      'com-vaga': comVaga,
      'perfil-aberto': perfilAberto,
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
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Empresas</h1>
        <p className="text-sm text-muted-foreground">
          {linhas.length.toLocaleString('pt-BR')} empresas atendidas · quem tem
          vaga aberta e quem ainda deve respostas.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            value={aba}
            onValueChange={trocarAba}
            className="max-w-full overflow-x-auto"
          >
            <TabsList className="**:data-[slot=badge]:h-5 **:data-[slot=badge]:min-w-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
              <TabsTrigger value="com-vaga">
                Com vaga aberta{' '}
                <Badge variant="secondary">
                  {porAba['com-vaga'].length.toLocaleString('pt-BR')}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="perfil-aberto">
                Perfil em aberto{' '}
                <Badge variant="secondary">
                  {porAba['perfil-aberto'].length.toLocaleString('pt-BR')}
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
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
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
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="w-[8rem] text-right">
                  Vagas abertas
                </TableHead>
                <TableHead className="w-[14rem]">Perfil da empresa</TableHead>
                <TableHead className="w-[10rem]">Prazo</TableHead>
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
                              className="h-1.5 w-16 bg-muted"
                              value={percent}
                            />
                            <span className="tabular-nums">
                              {sample.answered} de {sample.total}
                            </span>
                            {aberto ? (
                              <CircleAlert
                                aria-label={plural(
                                  openPoints,
                                  'ponto em aberto',
                                  'pontos em aberto'
                                )}
                                className="size-3.5 text-[hsl(var(--brand-accent))]"
                              />
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            sem consulta
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {sample ? deadlineLabel(sample) : '—'}
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
            <div className="flex w-fit items-center justify-center text-sm font-medium">
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
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPagina(Math.max(0, paginaAtual - 1))}
                disabled={paginaAtual === 0}
              >
                <span className="sr-only">Página anterior</span>
                <ChevronLeft />
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
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden size-8 lg:flex"
                onClick={() => setPagina(totalPaginas - 1)}
                disabled={paginaAtual >= totalPaginas - 1}
              >
                <span className="sr-only">Última página</span>
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompanyDetailScreen({ companyId }: { companyId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const iel = routes.dashboard.iel;
  const [convidando, setConvidando] = useState(false);

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
          value={`${progress.answered} de ${progress.total}`}
          badge={
            <Badge
              variant="outline"
              className="gap-1 font-normal"
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
          description="Pontos fechados"
          value={`${suficientes} de ${profile.length}`}
          badge={
            suficientes < profile.length ? (
              <Badge
                variant="outline"
                className="gap-1 font-normal text-muted-foreground"
              >
                <CircleAlert className="size-3 text-[hsl(var(--brand-accent))]" />
                faltam {profile.length - suficientes}
              </Badge>
            ) : undefined
          }
          footer={
            suficientes === profile.length
              ? 'Os cinco pontos fecham'
              : `${plural(profile.length - suficientes, 'ponto em aberto', 'pontos em aberto')}`
          }
          hint="Ponto sem base não entra no cálculo"
        />
        <SectionCard
          description="Sugestões para confirmar"
          value={plural(sugestoes, 'ponto', 'pontos')}
          footer={
            sugestoes === 0
              ? 'Nada pendente de confirmação'
              : 'Aguardando confirmação da empresa'
          }
          hint="vêm da descrição das vagas"
        />
      </div>

      <Tabs defaultValue="cultura">
        <TabsList>
          <TabsTrigger value="cultura">Como a empresa trabalha</TabsTrigger>
          {ehAnalista ? (
            <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
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
          <TabsContent
            value="colaboradores"
            className="flex flex-col gap-4"
          >
            <CultureSampleTable companyId={companyId} />
          </TabsContent>
        ) : null}

        <TabsContent value="vagas">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Vaga</TableHead>
                  <TableHead className="w-[12rem]">Etapa</TableHead>
                  <TableHead className="w-[11rem] text-right">
                    Marcados para envio
                  </TableHead>
                  <TableHead className="w-[10rem] text-right">
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
