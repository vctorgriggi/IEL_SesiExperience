'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CULTURE_RESPONDENT_LABEL } from '@/features/iel-demo/analysis/culture';
import { getFitAxis } from '@/features/iel-demo/analysis/fit-axes';
import { COPY } from '@/features/iel-demo/copy';
import { COMPARISON_LIMIT } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CLARIFICATION_STATE_LABEL,
  getApplicationsByJob,
  getClarificationsByJob,
  getCompany,
  getCompanyCultureProfile,
  getComparisonSelection,
  getCultureReading,
  getCultureSampleProgress,
  getJob,
  getJobRanking,
  getRecentHistory,
  getReferralListSelection,
  getRescueCandidates,
  getTalent,
  REFERRAL_LIMIT,
  type JobRankingEntry
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { JobCriterion } from '@/features/iel-demo/types';
import { Info } from 'lucide-react';

import { routes } from '@workspace/routes';
import { Alert, toast } from '@workspace/ui';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@workspace/ui/shadcn/tooltip';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import { usePageHeader } from '../layout/page-header-context';
import {
  formatarData,
  formatarDataCurta,
  formatarDataHora
} from '../shared/datas';
import { TalentDrawer } from '../talents/talent-drawer';
import { AxisWeights } from './axis-weights';
import { CandidatesTable } from './candidates-table';
import { JobSectionCards } from './job-section-cards';

/** Um `?` de 14px no lugar de um parágrafo: o método explica quem pedir. */
function Metodo({ label }: { label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="inline-flex text-muted-foreground hover:text-foreground"
          >
            <Info className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A vaga: quem enviar para esta empresa.
 *
 * A tela não explica o método em parágrafo nenhum — a pergunta que ela
 * responde é operacional, e cada explicação escrita no meio dela empurrava a
 * lista para baixo da dobra. O que era texto virou `Tooltip`; o que era herói
 * com três números virou quatro cartões de pendência; o que era ranking com
 * disclosure virou uma tabela com quatro leituras e paginação.
 */
export function JobScreen({ jobId }: { jobId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const [pessoaAberta, setPessoaAberta] = useState<string | null>(null);
  const [pergunta, setPergunta] = useState<{
    applicationId: string | null;
    criterion: JobCriterion;
  } | null>(null);

  const iel = routes.dashboard.iel;
  const job = getJob(jobId);
  const company = job ? getCompany(job.companyId) : null;

  const comparison = job ? getComparisonSelection(state, job.id) : [];
  const referralList = job ? getReferralListSelection(state, job.id) : [];

  usePageHeader({
    breadcrumb: [
      { label: 'Vagas', href: iel.jobs.index },
      {
        label: company?.name ?? 'Empresa',
        href: job ? iel.companies.byId(job.companyId) : undefined
      },
      { label: job?.title ?? 'Vaga' }
    ],
    actions: job ? (
      <>
        <Button
          variant="ghost"
          size="sm"
          asChild={comparison.length >= 2}
          disabled={comparison.length < 2}
        >
          {comparison.length >= 2 ? (
            <Link href={iel.jobs.byId(job.id).comparison}>
              Comparar ({comparison.length})
            </Link>
          ) : (
            <span>Comparar ({comparison.length})</span>
          )}
        </Button>
        <Button
          size="sm"
          asChild={referralList.length > 0}
          disabled={referralList.length === 0}
        >
          {referralList.length > 0 ? (
            <Link href={iel.jobs.byId(job.id).referral}>
              Enviar {plural(referralList.length, 'currículo', 'currículos')}
            </Link>
          ) : (
            <span>{COPY.referral.action}</span>
          )}
        </Button>
      </>
    ) : null
  });

  if (!job) {
    return (
      <Alert variant="destructive">
        Vaga não encontrada nesta base de demonstração.{' '}
        <Link
          className="underline"
          href={iel.jobs.index}
        >
          Voltar para a lista de vagas
        </Link>
        .
      </Alert>
    );
  }

  if (
    persona.kind === 'gestor' &&
    persona.companyId &&
    persona.companyId !== job.companyId
  ) {
    return (
      <Alert variant="warning">
        Esta vaga pertence a outra empresa. Nesta demonstração, o perfil de
        gestor só acessa os processos da própria empresa.{' '}
        <Link
          className="underline"
          href={iel.jobs.index}
        >
          Ver as vagas da minha empresa
        </Link>
        .
      </Alert>
    );
  }

  const applications = getApplicationsByJob(state, job.id);
  const ranking = getJobRanking(state, job.id);
  const rescue = getRescueCandidates(state, job.id);
  const clarifications = getClarificationsByJob(state, job.id);
  const amostra = getCultureSampleProgress(state, job.companyId);
  const perfil = getCompanyCultureProfile(state, job.companyId);
  const leitura = getCultureReading(state, job.companyId);

  const enviados = state.referrals.filter(
    (referral) => referral.jobId === job.id && referral.state === 'registrado'
  );

  const aberta =
    ranking.find((entry) => entry.application.id === pessoaAberta) ?? null;
  const talentoAberto = aberta?.talent ?? null;

  const listaCheia = referralList.length >= REFERRAL_LIMIT;

  const toggleReferral = (applicationId: string) => {
    if (referralList.includes(applicationId)) {
      dispatch({
        type: 'remove-from-referral-list',
        jobId: job.id,
        applicationId,
        at: nowIso()
      });
      return;
    }
    if (listaCheia) {
      toast.error(COPY.referral.limit);
      return;
    }
    dispatch({
      type: 'add-to-referral-list',
      jobId: job.id,
      applicationId,
      at: nowIso()
    });
  };

  const toggleComparison = (applicationId: string) => {
    if (
      !comparison.includes(applicationId) &&
      comparison.length >= COMPARISON_LIMIT
    ) {
      toast.error(
        `A comparação aceita até ${COMPARISON_LIMIT} pessoas. Remova uma para incluir outra.`
      );
      return;
    }
    dispatch({ type: 'toggle-comparison', jobId: job.id, applicationId });
  };

  const primeiroCriterio = job.criteria[0] ?? null;

  const perguntarA = (entry: JobRankingEntry) => {
    if (!primeiroCriterio) return;
    setPergunta({
      applicationId: entry.application.id,
      criterion: primeiroCriterio
    });
  };

  const historico = getRecentHistory(state, 40).filter(
    (event) =>
      event.entityRef === job.id ||
      applications.some((application) => application.id === event.entityRef) ||
      clarifications.some(
        (clarification) => clarification.id === event.entityRef
      ) ||
      state.referrals.some(
        (referral) =>
          referral.id === event.entityRef && referral.jobId === job.id
      )
  );

  return (
    <Tabs
      defaultValue="candidatos"
      className="@container/vaga gap-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{job.title}</h1>
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            {company?.name} · {job.location} · {job.workShift} ·{' '}
            {plural(applications.length, 'candidatura', 'candidaturas')} ·{' '}
            {job.externalRef.system.split('—')[0]?.trim() ?? 'Empregare'},{' '}
            {formatarDataCurta(job.updatedAt)}
            <Metodo label="Os candidatos e o percentual de requisitos chegam da planilha do sistema de vagas. O quanto a pessoa combina com a empresa é calculado aqui, por regra fixa." />
          </p>
        </div>

        <div className="max-w-full overflow-x-auto">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
            <TabsTrigger value="cultura">
              {COPY.culture.label}{' '}
              <Badge variant="secondary">{amostra.answered}</Badge>
            </TabsTrigger>
            <TabsTrigger value="perguntas">
              Perguntas{' '}
              <Badge variant="secondary">{clarifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="enviados">Enviados</TabsTrigger>
            <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>
        </div>
      </div>

      <TabsContent
        value="candidatos"
        className="flex flex-col gap-6"
      >
        <JobSectionCards job={job} />
        <CandidatesTable
          ranking={ranking}
          rescue={rescue}
          referralList={referralList}
          comparison={comparison}
          referralLimit={REFERRAL_LIMIT}
          onToggleReferral={toggleReferral}
          onToggleComparison={toggleComparison}
          onOpenPerson={(entry) => setPessoaAberta(entry.application.id)}
          onAskPerson={perguntarA}
        />
      </TabsContent>

      <TabsContent
        value="cultura"
        className="flex flex-col gap-3"
      >
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Ponto do dia a dia</TableHead>
                <TableHead>O que a empresa respondeu</TableHead>
                <TableHead className="w-[200px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perfil.map((axis) => {
                const entrada = leitura.find(
                  (item) => item.question.axisId === axis.axisId
                );
                return (
                  <TableRow key={axis.axisId}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">
                        {getFitAxis(axis.axisId).label}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {entrada?.question.prompt}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {entrada && entrada.voices.length > 0
                        ? entrada.voices
                            .map(
                              (voice) =>
                                `${CULTURE_RESPONDENT_LABEL[voice.respondent]}: ${voice.optionLabel}`
                            )
                            .join(' · ')
                        : 'Ninguém respondeu este ponto ainda.'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="px-1.5 text-muted-foreground"
                      >
                        {!axis.ready
                          ? COPY.missingAnswers(
                              axis.respondents,
                              amostra.requiredForProfile
                            )
                          : axis.dispersion === 'divergente'
                            ? COPY.culture.divergence
                            : 'Perfil fechado'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          {COPY.culture.sample} {amostra.answered} de {amostra.total}{' '}
          responderam.
        </p>
      </TabsContent>

      <TabsContent
        value="perguntas"
        className="flex flex-col items-start gap-3"
      >
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Pergunta</TableHead>
                <TableHead className="w-[200px]">Para quem</TableHead>
                <TableHead className="w-[160px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clarifications.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma pergunta registrada nesta vaga.
                  </TableCell>
                </TableRow>
              ) : (
                clarifications.map((clarification) => (
                  <TableRow key={clarification.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">
                        {clarification.question}
                      </span>
                      {clarification.answer ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Resposta: “{clarification.answer}”
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {clarification.recipient.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="px-1.5 text-muted-foreground"
                      >
                        {CLARIFICATION_STATE_LABEL[clarification.state]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {primeiroCriterio ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPergunta({
                applicationId: null,
                criterion: primeiroCriterio
              })
            }
          >
            {COPY.questions.askManager}
          </Button>
        ) : null}
      </TabsContent>

      <TabsContent value="enviados">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Remessa</TableHead>
                <TableHead>Pessoas</TableHead>
                <TableHead className="w-[160px]">Enviada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enviados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nenhuma remessa registrada nesta vaga.
                  </TableCell>
                </TableRow>
              ) : (
                enviados.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{referral.id}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {referral.message}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-normal text-muted-foreground">
                      {referral.items
                        .map((item) => {
                          const application = applications.find(
                            (entry) => entry.id === item.applicationId
                          );
                          return application
                            ? (getTalent(application.talentId)?.name ??
                                item.applicationId)
                            : item.applicationId;
                        })
                        .join(' · ')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {referral.createdAt
                        ? formatarData(referral.createdAt)
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent
        value="requisitos"
        className="flex flex-col gap-6"
      >
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Critério da vaga</TableHead>
                <TableHead className="w-[160px]">Obrigatoriedade</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {job.criteria.map((criterion) => (
                <TableRow key={criterion.id}>
                  <TableCell className="whitespace-normal">
                    <span className="font-medium">{criterion.label}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {criterion.question} · {criterion.confirmedBy}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="px-1.5 text-muted-foreground"
                    >
                      {criterion.required ? 'Obrigatório' : 'Complementar'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPergunta({ applicationId: null, criterion })
                      }
                    >
                      {COPY.questions.askManager}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <AxisWeights job={job} />
      </TabsContent>

      <TabsContent value="historico">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>Ação</TableHead>
                <TableHead className="w-[200px]">Quem</TableHead>
                <TableHead className="w-[180px]">Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historico.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nada registrado nesta vaga ainda.
                  </TableCell>
                </TableRow>
              ) : (
                historico.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{event.action}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.actor}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatarDataHora(event.at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {aberta && talentoAberto ? (
        <TalentDrawer
          job={job}
          talent={talentoAberto}
          application={aberta.application}
          open={pessoaAberta !== null}
          onOpenChange={(aberto) => {
            if (!aberto) setPessoaAberta(null);
          }}
        />
      ) : null}

      {pergunta ? (
        <CreateClarificationDialog
          job={job}
          criterion={pergunta.criterion}
          application={
            pergunta.applicationId
              ? (applications.find(
                  (entry) => entry.id === pergunta.applicationId
                ) ?? null)
              : null
          }
          visible
          onHide={() => setPergunta(null)}
        />
      ) : null}
    </Tabs>
  );
}
