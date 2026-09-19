'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CULTURE_INVITE_DEADLINE_DAYS } from '@/features/iel-demo/analysis/culture-invites';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getCompanyCultureProfile,
  getCultureInvites,
  getCultureReading,
  getCultureSampleProgress,
  getJobRanking,
  getJobsByCompany,
  getReferralListSelection,
  getVisibleCompanies,
  JOB_STAGE_LABEL,
  REFERRAL_LIMIT,
  type CultureSampleProgress
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { CircleAlert, Clock, Search } from 'lucide-react';

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
import { Progress } from '@workspace/ui/shadcn/progress';
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
  const days = progress.daysLeft;
  if (days === null) return 'sem prazo';
  if (progress.overdue) return 'vencido';
  if (days <= 0) return 'vence hoje';
  return `prazo em ${plural(days, 'dia', 'dias')}`;
}

export function CompaniesScreen() {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;
  const [busca, setBusca] = useState('');

  usePageHeader({ breadcrumb: [{ label: 'Empresas' }] });

  const companies = getVisibleCompanies(state);
  const termo = busca.trim().toLowerCase();
  const visiveis = companies.filter((company) =>
    termo.length === 0
      ? true
      : `${company.name} ${company.sector} ${company.location}`
          .toLowerCase()
          .includes(termo)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Empresas</h1>
        <p className="text-sm text-muted-foreground">
          Quem já descreveu como trabalha e quem ainda deve respostas.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar por empresa, setor ou cidade"
          aria-label="Buscar empresa"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead className="w-[14rem]">Setor</TableHead>
              <TableHead className="w-[12rem]">Cidade</TableHead>
              <TableHead className="w-[14rem]">Respostas da equipe</TableHead>
              <TableHead className="w-[8rem] text-right">
                Vagas abertas
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((company) => {
              const progress = getCultureSampleProgress(state, company.id);
              const jobs = getJobsByCompany(company.id);
              const percent =
                progress.total > 0
                  ? (progress.answered / progress.total) * 100
                  : 0;

              return (
                <TableRow key={company.id}>
                  <TableCell>
                    <Link
                      href={iel.companies.byId(company.id)}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {company.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.sector}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.location}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        className="h-1.5 w-24 bg-muted"
                        value={percent}
                      />
                      <span className="tabular-nums text-muted-foreground">
                        {progress.answered} de {progress.total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {jobs.length}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {visiveis.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma empresa com esse termo.
        </p>
      ) : null}
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
          {company.sector} · {company.location} · {company.contactName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          hint={`Mínimo de ${progress.requiredForProfile} respostas da equipe`}
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
              : `${profile.length - suficientes} em aberto`
          }
          hint="Ponto sem base não entra no cálculo"
        />
        <SectionCard
          description="Vagas abertas"
          value={`${jobs.length}`}
          footer={
            jobs.length === 0
              ? 'Nenhuma vaga nesta empresa'
              : 'Em seleção pelo IEL'
          }
          hint={`Até ${REFERRAL_LIMIT} currículos por vaga`}
        />
        <SectionCard
          description="Sugestões"
          value={`${sugestoes}`}
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
          <TabsTrigger value="vagas">Vagas</TabsTrigger>
        </TabsList>

        <TabsContent value="cultura">
          <CompanyCultureTable companyId={companyId} />
        </TabsContent>

        {ehAnalista ? (
          <TabsContent
            value="colaboradores"
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-muted-foreground">
              A amostra convidada e o estado de cada link. Esta aba não mostra —
              e não tem como mostrar — o que cada pessoa respondeu.
            </p>
            <CultureSampleTable companyId={companyId} />
          </TabsContent>
        ) : null}

        <TabsContent value="vagas">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Vaga</TableHead>
                  <TableHead className="w-[12rem]">Etapa</TableHead>
                  <TableHead className="w-[9rem] text-right">
                    Marcados
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
                        {marcados}/{REFERRAL_LIMIT}
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
