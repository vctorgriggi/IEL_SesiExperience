'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getCompany,
  getJob,
  getReferralListSelection,
  getTalent,
  getTalentJourney,
  JOURNEY_OUTCOME_LABEL,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { routes } from '@workspace/routes';
import { Alert, toast } from '@workspace/ui';
import { Avatar, AvatarFallback } from '@workspace/ui/shadcn/avatar';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { usePageHeader } from '../layout/page-header-context';
import { formatarData } from '../shared/datas';
import { TalentFitView } from './talent-fit-view';

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima =
    partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return `${primeira}${ultima}`.toUpperCase();
}

/**
 * O perfil completo, em página.
 *
 * É o mesmo conteúdo da gaveta — os dois cartões e as quatro abas —, porque
 * seria outra leitura da mesma pessoa se fosse escrito duas vezes. O que muda
 * é o entorno: aqui cabe o cabeçalho da casca, e o rodapé fixo vira uma linha
 * de ações no topo.
 */
export function TalentProfileScreen({ talentId }: { talentId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('vaga');

  const iel = routes.dashboard.iel;
  const talent = getTalent(talentId, state);

  usePageHeader({
    breadcrumb: [
      { label: 'Pessoas', href: iel.talents.index },
      { label: talent?.name ?? 'Pessoa' }
    ]
  });

  if (!talent) {
    return (
      <Alert variant="destructive">
        Pessoa não encontrada nesta base de demonstração.{' '}
        <Link
          className="underline"
          href={iel.talents.index}
        >
          Ver pessoas
        </Link>
        .
      </Alert>
    );
  }

  if (persona.kind === 'gestor') {
    return (
      <Alert variant="warning">
        No perfil de gestor, os dados de uma pessoa só aparecem dentro de uma
        lista enviada pelo IEL.{' '}
        <Link
          className="underline"
          href={iel.referrals.index}
        >
          Ver currículos enviados
        </Link>
        .
      </Alert>
    );
  }

  const job = jobId ? getJob(jobId) : null;
  const company = job ? getCompany(job.companyId) : null;
  const candidaturas = getApplicationsByTalent(state, talent.id);
  const application = job
    ? (candidaturas.find((entry) => entry.jobId === job.id) ?? null)
    : null;

  const contexto =
    job && application
      ? ` · candidatura a ${job.title} na ${company?.name ?? 'empresa'}`
      : '';

  const cabecalho = (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarFallback className="text-[13px] font-semibold">
            {iniciais(talent.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {talent.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {talent.headline} · {talent.city} ·{' '}
            {plural(candidaturas.length, 'candidatura', 'candidaturas')}
            {contexto}
          </p>
        </div>
      </div>
      {job && application ? (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={iel.jobs.byId(job.id).index}>
              Voltar para {job.title}
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={iel.applications.byId(application.id).fit}>
              {COPY.questions.ask}
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const lista = getReferralListSelection(state, job.id);
              if (lista.includes(application.id)) {
                dispatch({
                  type: 'remove-from-referral-list',
                  jobId: job.id,
                  applicationId: application.id,
                  at: nowIso()
                });
                return;
              }
              if (lista.length >= REFERRAL_LIMIT) {
                toast.error(COPY.referral.limit);
                return;
              }
              dispatch({
                type: 'add-to-referral-list',
                jobId: job.id,
                applicationId: application.id,
                at: nowIso()
              });
              toast.success(`${talent.name} entrou na lista desta vaga.`);
            }}
          >
            Marcar para envio
          </Button>
        </div>
      ) : null}
    </div>
  );

  // Sem vaga não há pergunta a responder: combinar é sempre com alguém. O
  // perfil abre pelo que descreve a pessoa, e a tela diz o que falta.
  if (!job || !application) {
    const journey = getTalentJourney(state, talent.id);
    return (
      <div className="flex flex-col gap-6">
        {cabecalho}
        <Alert variant="default">
          Para ver se ela combina com uma empresa, abra este perfil a partir de
          uma vaga: o percentual depende da oportunidade.
        </Alert>
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Candidatura</TableHead>
                <TableHead className="w-[220px]">Resultado</TableHead>
                <TableHead className="w-[140px]">Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journey.map((item) => (
                <TableRow key={item.application.id}>
                  <TableCell className="whitespace-normal">
                    {item.job ? (
                      <Link
                        href={iel.talents
                          .byId(talent.id)
                          .inJob(item.application.jobId)}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {item.job.title}
                      </Link>
                    ) : (
                      <span className="font-medium">Vaga fora da base</span>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.company?.name ?? '—'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="px-1.5 text-muted-foreground"
                    >
                      {JOURNEY_OUTCOME_LABEL[item.outcome]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatarData(item.application.appliedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {cabecalho}
      <TalentFitView
        job={job}
        talent={talent}
        application={application}
      />
    </div>
  );
}
