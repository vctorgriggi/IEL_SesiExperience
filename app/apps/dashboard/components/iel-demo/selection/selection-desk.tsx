'use client';

import { useState } from 'react';
import Link from 'next/link';
import { COMPARISON_LIMIT } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CLARIFICATION_STATE_LABEL,
  getApplication,
  getApplicationsByJob,
  getClarificationsByJob,
  getCompany,
  getComparisonSelection,
  getCriterion,
  getJob,
  getRecentHistory,
  getReferralListSelection,
  getTalent,
  getTeam,
  JOB_STAGE_LABEL
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { JobCriterion } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  toast
} from '@workspace/ui';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import { CriterionStateLegend } from '../shared/criterion-state-badge';
import { EvidencePanel } from '../shared/evidence-panel';
import { Chip, formatDate, formatDateTime, IelPageHeader } from '../shared/ui';
import { AssistantPanel } from './assistant-panel';
import { CandidatesMatrix } from './candidates-matrix';

type Tab = 'candidatos' | 'contexto' | 'historico';

export function SelectionDesk({ jobId }: { jobId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const [tab, setTab] = useState<Tab>('candidatos');
  const [activeCriterion, setActiveCriterion] = useState<{
    applicationId: string;
    criterionId: string;
  } | null>(null);
  const [clarificationTarget, setClarificationTarget] = useState<{
    applicationId: string | null;
    criterion: JobCriterion;
  } | null>(null);

  const iel = routes.dashboard.iel;
  const job = getJob(jobId);

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

  const company = getCompany(job.companyId);

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
  const comparison = getComparisonSelection(state, job.id);
  const referralList = getReferralListSelection(state, job.id);
  const team = getTeam(state, job.teamId);
  const clarifications = getClarificationsByJob(state, job.id);
  const answered = clarifications.filter(
    (clarification) => clarification.state === 'respondida'
  );

  const activeApplication = activeCriterion
    ? getApplication(state, activeCriterion.applicationId)
    : null;
  const activeCriterionData =
    activeCriterion && getCriterion(job, activeCriterion.criterionId);

  const jobHistory = getRecentHistory(state, 40).filter(
    (event) =>
      event.entityRef === null ||
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
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={`${company?.name} · ${job.externalRef.system} · ${job.externalRef.id}`}
        title={`Mesa de seleção — ${job.title}`}
        description={job.summary}
        actions={
          <>
            <Link href={iel.jobs.byId(job.id).comparison}>
              <Button
                variant="outline"
                disabled={comparison.length < 2}
              >
                Comparar selecionados ({comparison.length})
              </Button>
            </Link>
            <Link href={iel.jobs.byId(job.id).referral}>
              <Button disabled={referralList.length === 0}>
                Preparar encaminhamento ({referralList.length})
              </Button>
            </Link>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="info">{JOB_STAGE_LABEL[job.stage]}</Chip>
          <Chip>{job.workShift}</Chip>
          <Chip>{job.location}</Chip>
          <Chip>{applications.length} candidaturas</Chip>
          <Chip tone={answered.length > 0 ? 'atencao' : 'neutro'}>
            {answered.length > 0
              ? `${answered.length} resposta(s) para incorporar`
              : 'Nenhuma resposta pendente'}
          </Chip>
          <span className="text-xs text-muted-foreground">
            Atualização da origem: {formatDate(job.updatedAt)}
          </span>
        </div>
      </IelPageHeader>

      {answered.length > 0 ? (
        <Alert variant="info">
          Há resposta de esclarecimento aguardando incorporação nesta vaga.{' '}
          <Link
            className="underline"
            href={iel.clarifications.index}
          >
            Abrir pendências
          </Link>
          .
        </Alert>
      ) : null}

      <div
        role="tablist"
        aria-label="Áreas da mesa de seleção"
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {(
          [
            ['candidatos', 'Candidatos'],
            ['contexto', 'Contexto da vaga'],
            ['historico', 'Histórico']
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
              tab === value
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'candidatos' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0 space-y-4">
            <Card padding="sm">
              <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Selecione de 2 a {COMPARISON_LIMIT} candidatos para comparar.
                  A seleção é temporária e não é a lista de encaminhamento.
                </p>
                {comparison.length > 0 ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      dispatch({ type: 'clear-comparison', jobId: job.id })
                    }
                  >
                    Limpar seleção
                  </Button>
                ) : null}
              </div>
            </Card>

            <Card padding="none">
              <CandidatesMatrix
                job={job}
                applications={applications}
                selectedForComparison={comparison}
                comparisonLimit={COMPARISON_LIMIT}
                referralList={referralList}
                activeCriterion={activeCriterion}
                onOpenCriterion={(applicationId, criterion) =>
                  setActiveCriterion({
                    applicationId,
                    criterionId: criterion.id
                  })
                }
                onToggleComparison={(applicationId) => {
                  const isSelected = comparison.includes(applicationId);
                  if (!isSelected && comparison.length >= COMPARISON_LIMIT) {
                    toast.error(
                      `A comparação aceita até ${COMPARISON_LIMIT} candidatos. Remova um para incluir outro.`
                    );
                    return;
                  }
                  dispatch({
                    type: 'toggle-comparison',
                    jobId: job.id,
                    applicationId
                  });
                }}
                onAddToReferralList={(applicationId) => {
                  dispatch({
                    type: 'add-to-referral-list',
                    jobId: job.id,
                    applicationId,
                    at: nowIso()
                  });
                  const application = getApplication(state, applicationId);
                  const talent = application
                    ? getTalent(application.talentId)
                    : null;
                  toast.success(
                    `${talent?.name ?? 'Candidatura'} entrou na lista de encaminhamento desta vaga.`
                  );
                }}
              />
            </Card>

            <Card padding="sm">
              <CriterionStateLegend />
              <p className="mt-2 text-[11px] text-muted-foreground">
                O asterisco (*) marca requisitos obrigatórios. Um requisito não
                atendido é sinalizado, não elimina automaticamente.
              </p>
            </Card>

            <AssistantPanel
              job={job}
              selectedApplicationIds={comparison}
            />
          </div>

          {activeApplication && activeCriterionData ? (
            <div className="xl:w-[26rem]">
              <EvidencePanel
                job={job}
                application={activeApplication}
                criterion={activeCriterionData}
                onClose={() => setActiveCriterion(null)}
                onRequestClarification={() =>
                  setClarificationTarget({
                    applicationId: activeApplication.id,
                    criterion: activeCriterionData
                  })
                }
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'contexto' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Requisitos e critérios
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cada critério informa a dimensão, a obrigatoriedade e quem
                confirmou o requisito.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <ul className="space-y-3">
                {job.criteria.map((criterion) => (
                  <li
                    key={criterion.id}
                    className="rounded-[var(--control-radius)] border border-border p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {criterion.label}
                      </p>
                      <Chip tone={criterion.required ? 'atencao' : 'neutro'}>
                        {criterion.required ? 'Obrigatório' : 'Complementar'}
                      </Chip>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {criterion.question}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Confirmado por: {criterion.confirmedBy}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-2"
                      onClick={() =>
                        setClarificationTarget({
                          applicationId: null,
                          criterion
                        })
                      }
                    >
                      Solicitar esclarecimento ao gestor
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Contexto da empresa e da equipe
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  A descrição institucional é separada das condições concretas
                  da equipe.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Empresa
                  </p>
                  <p className="text-sm text-foreground">
                    {company?.name} — {company?.sector}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {company?.institutionalDescription}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Equipe
                  </p>
                  <p className="text-sm text-foreground">{team?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {team?.routine}
                  </p>
                </div>
                <ul className="space-y-2">
                  {team?.conditions.map((condition) => (
                    <li
                      key={condition.id}
                      className="rounded-[var(--control-radius)] border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">
                          {condition.label}
                        </p>
                        <Chip
                          tone={
                            condition.status === 'confirmado'
                              ? 'positivo'
                              : condition.status === 'da-descricao'
                                ? 'info'
                                : 'atencao'
                          }
                        >
                          {condition.status === 'confirmado'
                            ? 'Confirmado pelo gestor'
                            : condition.status === 'da-descricao'
                              ? 'Origem: descrição da vaga'
                              : 'A confirmar'}
                        </Chip>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {condition.value}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {condition.origin} · {formatDate(condition.updatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
                <Link href={iel.companies.byId(job.companyId)}>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    Abrir contexto completo da empresa
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Requisitos essenciais informados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {job.essentialRequirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  {job.organizationalContext}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'historico' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico da vaga</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ações locais desta demonstração, com autor e momento. Conclusões
              anteriores são preservadas no registro.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <ul className="space-y-3">
              {jobHistory.map((event) => (
                <li
                  key={event.id}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium text-foreground">
                    {event.action}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.description}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {event.actor} · {formatDateTime(event.at)}
                  </p>
                </li>
              ))}
            </ul>

            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Solicitações desta vaga
              </h3>
              {clarifications.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Nenhuma solicitação registrada.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {clarifications.map((clarification) => (
                    <li
                      key={clarification.id}
                      className="rounded-[var(--control-radius)] border border-border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip>
                          {CLARIFICATION_STATE_LABEL[clarification.state]}
                        </Chip>
                        <span className="text-xs text-muted-foreground">
                          {clarification.recipient.name}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-foreground">
                        {clarification.question}
                      </p>
                      {clarification.answer ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Resposta: “{clarification.answer}”
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {clarificationTarget ? (
        <CreateClarificationDialog
          job={job}
          criterion={clarificationTarget.criterion}
          application={
            clarificationTarget.applicationId
              ? getApplication(state, clarificationTarget.applicationId)
              : null
          }
          visible
          onHide={() => setClarificationTarget(null)}
        />
      ) : null}
    </div>
  );
}
