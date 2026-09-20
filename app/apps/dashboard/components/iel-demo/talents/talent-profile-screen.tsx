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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@workspace/ui/shadcn/tabs';

import { usePageHeader } from '../layout/page-header-context';
import { ABAS_SEM_ROLAGEM } from '../shared/abas';
import { formatarData } from '../shared/datas';
import { AderenciaDaPessoa } from './aderencia-da-pessoa';
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
 * A pergunta da tela mudou em 19/09: era "esta pessoa combina com a vaga pela
 * qual você chegou?", e sem vaga no link a tela não respondia nada. Agora a
 * leitura padrão é a da pessoa — **em quais empresas ela se encaixa** —,
 * porque é isso que faz o banco de talentos valer, e porque o fit é da
 * cultura da empresa, não da vaga (00:31:38).
 *
 * O contexto de vaga continua funcionando: com `?vaga=`, a aba "Nesta vaga"
 * aparece com a leitura por candidatura e a aderência abre já na empresa
 * daquela vaga.
 */
export function TalentProfileScreen({ talentId }: { talentId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('vaga');

  const iel = routes.dashboard.iel;
  const talent = getTalent(talentId, state);

  usePageHeader({
    breadcrumb: [
      { label: 'Banco de talentos', href: iel.talents.index },
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
  const journey = getTalentJourney(state, talent.id);

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

  const naVaga = Boolean(job && application);

  return (
    <div className="flex flex-col gap-6">
      {cabecalho}

      {/*
       * A aderência abre primeiro mesmo quando o link traz uma vaga: a
       * leitura da pessoa é a da tela, e a da vaga fica a um clique, na aba
       * ao lado, já com a empresa daquela vaga aberta na leitura.
       */}
      <Tabs defaultValue="aderencia">
        <TabsList className={ABAS_SEM_ROLAGEM}>
          <TabsTrigger value="aderencia">Onde ela se encaixa</TabsTrigger>
          {naVaga ? <TabsTrigger value="vaga">Nesta vaga</TabsTrigger> : null}
          <TabsTrigger value="candidaturas">
            Candidaturas{' '}
            <Badge
              variant="secondary"
              className="h-5 min-w-5 rounded-full bg-muted-foreground/30 px-1"
            >
              {journey.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="aderencia">
          <AderenciaDaPessoa
            talentId={talent.id}
            talentName={talent.name}
            empresaInicial={job?.companyId ?? null}
          />
        </TabsContent>

        {job && application ? (
          <TabsContent value="vaga">
            <TalentFitView
              job={job}
              talent={talent}
              application={application}
            />
          </TabsContent>
        ) : null}

        <TabsContent value="candidaturas">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead scope="col">Candidatura</TableHead>
                  <TableHead
                    scope="col"
                    className="w-[220px]"
                  >
                    Resultado
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="w-[140px]"
                  >
                    Desde
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journey.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhuma candidatura registrada para esta pessoa.
                    </TableCell>
                  </TableRow>
                ) : (
                  journey.map((item) => (
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
