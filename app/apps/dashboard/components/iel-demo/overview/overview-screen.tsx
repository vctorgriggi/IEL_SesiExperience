'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DIMENSION_META } from '@/features/iel-demo/analysis/criterion-states';
import { DEMO_COMPANIES } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCoverageByDimension,
  getJob,
  getJobSummary,
  getOverviewMetrics,
  getRecentHistory,
  getStageDistribution,
  getTalent,
  getVisibleJobs,
  JOB_STAGE_LABEL
} from '@/features/iel-demo/state/selectors';
import {
  Briefcase01Icon,
  Message01Icon,
  SentIcon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FilterNativeSelect
} from '@workspace/ui';

import { ManagerOverview } from '../manager/manager-overview';
import {
  BarList,
  Chip,
  formatDateTime,
  IelPageHeader,
  InfoHint,
  StatCard
} from '../shared/ui';

export function OverviewScreen() {
  const { state, dispatch, persona } = useIelDemo();
  const [openStage, setOpenStage] = useState<string | null>(null);
  const iel = routes.dashboard.iel;

  if (persona.kind === 'gestor') {
    return <ManagerOverview />;
  }

  const companyFilter = state.ui.overviewCompanyId;
  const stageFilter = state.ui.jobsStage;
  const metrics = getOverviewMetrics(state, companyFilter);
  const stages = getStageDistribution(state, companyFilter);
  const coverage = getCoverageByDimension(state, companyFilter);
  const history = getRecentHistory(state, 6);

  const jobSummaries = getVisibleJobs(state)
    .filter(
      (job) => companyFilter === 'todas' || job.companyId === companyFilter
    )
    .filter((job) => stageFilter === 'todas' || job.stage === stageFilter)
    .map((job) => getJobSummary(state, job));

  const jobsNeedingAction = jobSummaries.filter(
    (summary) => summary.actionReason !== null
  );

  const stageApplications =
    openStage === null
      ? []
      : (stages.find((entry) => entry.stage === openStage)?.applicationIds ??
        []);

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow="IEL · Centro de Empregabilidade"
        title="Visão geral"
        description={`Base demo: ${DEMO_COMPANIES.length} empresas, ${getVisibleJobs(state).length} vagas, ${new Set(state.applications.map((application) => application.talentId)).size} talentos únicos e ${state.applications.length} candidaturas.`}
        actions={
          <>
            <label
              className="sr-only"
              htmlFor="overview-company"
            >
              Filtrar por empresa
            </label>
            <FilterNativeSelect
              id="overview-company"
              className="w-56"
              value={companyFilter}
              onValueChange={(value) =>
                dispatch({ type: 'set-ui', ui: { overviewCompanyId: value } })
              }
            >
              <option value="todas">Todas as empresas</option>
              {DEMO_COMPANIES.map((company) => (
                <option
                  key={company.id}
                  value={company.id}
                >
                  {company.name}
                </option>
              ))}
            </FilterNativeSelect>
            <label
              className="sr-only"
              htmlFor="overview-stage"
            >
              Filtrar por status da vaga
            </label>
            <FilterNativeSelect
              id="overview-stage"
              className="w-44"
              value={stageFilter}
              onValueChange={(value) =>
                dispatch({
                  type: 'set-ui',
                  ui: { jobsStage: value as typeof stageFilter }
                })
              }
            >
              <option value="todas">Todos os status</option>
              <option value="aberta">Aberta</option>
              <option value="em-selecao">Em seleção</option>
              <option value="encerrada">Encerrada</option>
            </FilterNativeSelect>
          </>
        }
      />

      <section
        aria-label="Indicadores"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Vagas abertas"
          value={metrics.openJobs}
          icon={
            <HugeiconsIcon
              icon={Briefcase01Icon}
              size={15}
            />
          }
        />
        <StatCard
          label="Candidaturas em análise"
          value={metrics.applicationsInAnalysis}
          icon={
            <HugeiconsIcon
              icon={UserGroupIcon}
              size={15}
            />
          }
        />
        <StatCard
          label="Solicitações em aberto"
          value={metrics.openClarifications}
          hint="Perguntas enviadas a gestores ou candidatos que ainda não voltaram."
          icon={
            <HugeiconsIcon
              icon={Message01Icon}
              size={15}
            />
          }
        />
        <StatCard
          label="Aguardando retorno da empresa"
          value={metrics.referralsAwaitingReturn}
          hint="Encaminhamentos já registrados, sem resposta do gestor."
          icon={
            <HugeiconsIcon
              icon={SentIcon}
              size={15}
            />
          }
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              Vagas que precisam de ação
              <InfoHint label="O motivo vem do estado atual da análise de cada vaga, não de uma lista fixa." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {jobsNeedingAction.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma vaga pendente com os filtros atuais. Ajuste o filtro de
                empresa ou status para ver outros processos.
              </p>
            ) : (
              <ul className="space-y-3">
                {jobsNeedingAction.map((summary) => (
                  <li
                    key={summary.job.id}
                    className="flex flex-col gap-2 rounded-[var(--control-radius)] border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {summary.job.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {summary.company?.name} · {summary.job.location} ·{' '}
                        {JOB_STAGE_LABEL[summary.job.stage]}
                      </p>
                      <p className="mt-1 text-xs text-warning">
                        {summary.actionReason}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Chip>
                        {plural(
                          summary.applicationsCount,
                          'candidatura',
                          'candidaturas'
                        )}
                      </Chip>
                      <Link href={iel.jobs.byId(summary.job.id).index}>
                        <Button size="sm">Abrir seleção</Button>
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              Candidaturas por etapa
              <InfoHint label="Etapa oficial recebida do sistema de recrutamento de origem. Clique numa barra para ver os registros." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <BarList
              items={stages.map((entry) => ({
                id: entry.stage,
                label: entry.label,
                count: entry.count,
                onSelect: () =>
                  setOpenStage((current) =>
                    current === entry.stage ? null : entry.stage
                  )
              }))}
            />
            {openStage && stageApplications.length > 0 ? (
              <ul className="space-y-1 border-t border-border pt-3">
                {stageApplications.map((applicationId) => {
                  const application = getApplication(state, applicationId);
                  if (!application) return null;
                  const talent = getTalent(application.talentId);
                  const job = getJob(application.jobId);
                  return (
                    <li key={applicationId}>
                      <Link
                        className="flex items-center justify-between gap-2 rounded-[var(--control-radius)] px-2 py-1 text-xs hover:bg-muted"
                        href={iel.jobs.byId(application.jobId).index}
                      >
                        <span className="truncate text-foreground">
                          {talent?.name}
                        </span>
                        <span className="truncate text-muted-foreground">
                          {job?.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-base">
              Cobertura de informações
              <InfoHint label="Quantos critérios têm dados suficientes nas candidaturas visíveis. Mede informação disponível, não chance de sucesso nem qualidade da pessoa." />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {coverage.map((entry) => (
              <div
                key={entry.dimension}
                className="space-y-1"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm text-foreground">
                    {DIMENSION_META[entry.dimension].label}
                    <InfoHint
                      label={DIMENSION_META[entry.dimension].description}
                    />
                  </p>
                  <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {entry.withInformation}/{entry.total}
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-muted">
                  <div
                    className="h-full rounded-[var(--radius-pill)] bg-info"
                    style={{
                      width: `${entry.total === 0 ? 0 : Math.round((entry.withInformation / entry.total) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade recente</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="space-y-3">
              {history.map((event) => (
                <li
                  key={event.id}
                  className="border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm text-foreground">{event.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.description}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {event.actor} · {formatDateTime(event.at)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
