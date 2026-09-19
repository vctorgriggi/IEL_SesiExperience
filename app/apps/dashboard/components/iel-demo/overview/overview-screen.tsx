'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DIMENSION_META } from '@/features/iel-demo/analysis/criterion-states';
import { ALL_COMPANIES } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCoverageByDimension,
  getJob,
  getJobSummary,
  getOverviewMetrics,
  getRecentHistory,
  getSourceBreakdown,
  getStageDistribution,
  getTalent,
  getVisibleJobs,
  JOB_STAGE_LABEL
} from '@/features/iel-demo/state/selectors';

import { routes } from '@workspace/routes';
import { Button, FilterNativeSelect } from '@workspace/ui';

import { ManagerOverview } from '../manager/manager-overview';
import {
  BarList,
  Chip,
  formatDateTime,
  Hero,
  InfoHint,
  Panel,
  PanelHeader,
  SourceBreakdownBar
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
  const overviewSources = getSourceBreakdown(state.evidences);

  const jobSummaries = getVisibleJobs(state)
    .filter(
      (job) => companyFilter === 'todas' || job.companyId === companyFilter
    )
    .filter((job) => stageFilter === 'todas' || job.stage === stageFilter)
    .map((job) => getJobSummary(state, job));

  const jobsNeedingAction = jobSummaries.filter(
    (summary) => summary.actionReason !== null
  );
  // Com dezenas de vagas, listar todas transforma a visão geral num rolo. A
  // tela mostra as primeiras e manda o resto para a lista de vagas, que tem
  // busca e filtros.
  const HIGHLIGHTED_JOBS = 5;
  const highlightedJobs = jobsNeedingAction.slice(0, HIGHLIGHTED_JOBS);

  const stageApplications =
    openStage === null
      ? []
      : (stages.find((entry) => entry.stage === openStage)?.applicationIds ??
        []);

  return (
    <div className="space-y-6">
      {/*
        Herói do panorama.

        A abertura desta tela era um cabeçalho seguido de quatro cartões de
        indicador do mesmo tamanho — a gramática de qualquer painel
        administrativo, e a razão de nada ali dizer por onde começar. Os
        números passam a viver no herói, o primeiro deles é o único que pede
        ação hoje, e a procedência dos registros — a afirmação central do
        produto — ocupa o instrumento ao lado.
      */}
      <Hero
        eyebrow="IEL · Centro de Empregabilidade"
        title="Visão geral"
        description={`Base demo: ${ALL_COMPANIES.length} empresas, ${getVisibleJobs(state).length} vagas, ${new Set(state.applications.map((application) => application.talentId)).size} talentos únicos e ${state.applications.length} candidaturas.`}
        figures={[
          {
            label: 'Precisam de ação',
            value: jobsNeedingAction.length,
            tone: jobsNeedingAction.length > 0 ? 'atencao' : 'default'
          },
          { label: 'Vagas abertas', value: metrics.openJobs },
          {
            label: 'Candidaturas em análise',
            value: metrics.applicationsInAnalysis
          },
          {
            label: 'Solicitações abertas',
            value: metrics.openClarifications
          },
          {
            label: 'Aguardando empresa',
            value: metrics.referralsAwaitingReturn
          }
        ]}
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
              {ALL_COMPANIES.map((company) => (
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
        aside={
          <div className="rounded-[var(--card-radius)] border border-border bg-card/70 p-4">
            <p className="iel-eyebrow">Procedência dos registros</p>
            <div className="mt-2.5">
              <SourceBreakdownBar
                breakdown={overviewSources}
                total={state.evidences.length}
              />
            </div>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Lista densa, rente à página: é uma fila de trabalho, não um cartaz. */}
        <Panel
          elevation={1}
          padding="none"
          className="min-w-0 overflow-hidden"
        >
          <div className="px-5 pb-3 pt-4">
            <PanelHeader
              eyebrow="Onde agir hoje"
              title="Vagas que precisam de ação"
              hint="O motivo vem do estado atual da análise de cada vaga, não de uma lista fixa."
            />
          </div>

          {jobsNeedingAction.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-muted-foreground">
              Nenhuma vaga pendente com os filtros atuais. Ajuste o filtro de
              empresa ou status para ver outros processos.
            </p>
          ) : (
            <ul className="border-t border-border">
              {highlightedJobs.map((summary) => (
                <li
                  key={summary.job.id}
                  className="iel-interactive flex flex-col gap-2 border-b border-border px-5 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {summary.job.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {summary.company?.name} · {summary.job.location} ·{' '}
                      {JOB_STAGE_LABEL[summary.job.stage]}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-warning">
                      <span
                        aria-hidden="true"
                        className="size-1.5 shrink-0 rounded-full bg-warning"
                      />
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

          {jobsNeedingAction.length > highlightedJobs.length ? (
            <Link
              href={iel.jobs.index}
              className="iel-interactive block px-5 py-3 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              Ver as outras {jobsNeedingAction.length - highlightedJobs.length}{' '}
              vagas com pendência →
            </Link>
          ) : null}
        </Panel>

        <Panel padding="lg">
          <PanelHeader
            eyebrow="Distribuição"
            title="Candidaturas por etapa"
            hint="Etapa oficial recebida do sistema de recrutamento de origem. Clique numa barra para ver os registros."
          />
          <div className="mt-4 space-y-3">
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
                        className="iel-interactive flex items-center justify-between gap-2 rounded-[var(--control-radius)] px-2 py-1 text-xs hover:bg-muted"
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
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel padding="lg">
          <PanelHeader
            eyebrow="Informação disponível"
            title="Cobertura por dimensão"
            hint="Quantos critérios têm dados suficientes nas candidaturas visíveis. Mede informação disponível, não chance de sucesso nem qualidade da pessoa."
          />
          <div className="mt-4 space-y-3">
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
          </div>
        </Panel>

        <Panel padding="lg">
          <PanelHeader
            eyebrow="Estado local"
            title="Atividade recente"
          />
          <div className="mt-4">
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
          </div>
        </Panel>
      </div>
    </div>
  );
}
