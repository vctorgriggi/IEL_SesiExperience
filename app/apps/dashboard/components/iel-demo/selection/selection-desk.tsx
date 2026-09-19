'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ADHERENCE_THRESHOLD } from '@/features/iel-demo/analysis/adherence';
import { COPY } from '@/features/iel-demo/copy';
import { COMPARISON_LIMIT } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CLARIFICATION_STATE_LABEL,
  filterApplicationsByAnalysis,
  getApplication,
  getApplicationsByJob,
  getClarificationsByJob,
  getCompany,
  getComparisonSelection,
  getCriterion,
  getEvidencesForJob,
  getJob,
  getJobRanking,
  getRecentHistory,
  getReferralListSelection,
  getRescueCandidates,
  getSourceBreakdown,
  getTalent,
  getTeam,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import type {
  CandidateFilter,
  JobRankingEntry
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { JobCriterion } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import {
  Alert,
  Button,
  cn,
  FilterNativeSelect,
  Input,
  toast
} from '@workspace/ui';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import { AxisWeights } from '../companies/axis-weights';
import { CriterionStateLegend } from '../shared/criterion-state-badge';
import { EvidencePanel } from '../shared/evidence-panel';
import {
  Chip,
  Explain,
  formatDate,
  formatDateTime,
  Hero,
  HowItWorks,
  Panel,
  PanelHeader,
  SourceBreakdownBar
} from '../shared/ui';
import { AssistantPanel } from './assistant-panel';
import { CandidateRow } from './candidate-row';
import { CandidatesMatrix } from './candidates-matrix';
import { Disclosure } from './disclosure';

/** As áreas de apoio, abaixo da decisão de envio. */
type Tab = 'detalhar' | 'contexto' | 'historico';

const TABS: { value: Tab; label: string }[] = [
  { value: 'detalhar', label: 'Detalhar' },
  { value: 'contexto', label: 'Contexto da vaga' },
  { value: 'historico', label: 'Histórico' }
];

/**
 * Três opções, não oito.
 *
 * A triagem por estado da análise tinha um filtro por tipo de lacuna, e quem
 * abre a vaga não decide por tipo de lacuna: decide por quem dá para enviar,
 * quem não dá e quem ainda não deu resposta.
 */
const FILTROS: { value: CandidateFilter; label: string }[] = [
  { value: 'todas', label: 'Todos' },
  { value: 'compativel', label: 'Combinam' },
  { value: 'fit-pendente', label: COPY.fit.semResposta }
];

/** Quantas linhas a lista de sugeridos mostra. */
const SUGERIDOS = 5;

/** Quantas linhas o detalhamento por critério mostra por vez. */
const PAGE_SIZE = 25;

/**
 * A mesa de seleção responde uma pergunta: quem eu envio para esta vaga?
 *
 * Ela já foi um painel de trabalho — três números no herói mais a caixa de
 * triagem, chips de etapa, a procedência dos registros, o ranking com o corte
 * repetido em cada linha e, abaixo, a matriz por critério inteira. Tudo isso
 * continua existindo; o que mudou é a ordem. Primeiro quem dá para enviar e o
 * botão que envia, depois o resto, recolhido.
 */
export function SelectionDesk({ jobId }: { jobId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const [tab, setTab] = useState<Tab>('detalhar');
  const [candidateFilter, setCandidateFilter] =
    useState<CandidateFilter>('todas');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
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

  const activeApplication = activeCriterion
    ? getApplication(state, activeCriterion.applicationId)
    : null;
  const activeCriterionData =
    activeCriterion && getCriterion(job, activeCriterion.criterionId);

  const jobEvidences = getEvidencesForJob(state, job);
  const jobSourceBreakdown = getSourceBreakdown(jobEvidences);

  const searchTerm = candidateSearch.trim().toLowerCase();
  const filteredApplications = filterApplicationsByAnalysis(
    state,
    job,
    applications,
    candidateFilter
  ).filter((application) => {
    if (!searchTerm) return true;
    const talent = getTalent(application.talentId);
    return (talent?.name ?? '').toLowerCase().includes(searchTerm);
  });
  const visibleApplications = filteredApplications.slice(0, visibleCount);

  /*
    A lista completa e o detalhamento por critério mostram o mesmo conjunto:
    ambos partem dos ids que sobreviveram à busca e ao filtro. Duas listas com
    populações diferentes na mesma tela fariam contar a mesma pessoa duas
    vezes.
  */
  const filteredIds = new Set(
    filteredApplications.map((application) => application.id)
  );
  const jobRanking = getJobRanking(state, job.id);
  const filteredRanking = jobRanking.filter((entry) =>
    filteredIds.has(entry.application.id)
  );
  const sugeridos = jobRanking.slice(0, SUGERIDOS);
  const resgate = getRescueCandidates(state, job.id);

  const compativeis = jobRanking.filter(
    (entry) => entry.adherence.compatible === true
  ).length;
  const semResposta = jobRanking.filter(
    (entry) => entry.adherence.compatible === null
  ).length;

  const listaCheia = referralList.length >= REFERRAL_LIMIT;

  const addToReferralList = (applicationId: string) => {
    dispatch({
      type: 'add-to-referral-list',
      jobId: job.id,
      applicationId,
      at: nowIso()
    });
    const application = getApplication(state, applicationId);
    const talent = application ? getTalent(application.talentId) : null;
    toast.success(
      `${talent?.name ?? 'Candidatura'} entrou na lista desta vaga.`
    );
  };

  /** O checkbox da lista: marca para envio e desmarca de novo. */
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
    addToReferralList(applicationId);
  };

  const toggleComparison = (applicationId: string) => {
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
  };

  const renderCandidateRow = (entry: JobRankingEntry, idPrefix: string) => (
    <CandidateRow
      key={entry.application.id}
      entry={entry}
      idPrefix={idPrefix}
      selected={referralList.includes(entry.application.id)}
      blocked={listaCheia}
      onToggle={() => toggleReferral(entry.application.id)}
      profileHref={iel.talents.byId(entry.application.talentId).inJob(job.id)}
    />
  );

  const envioLabel =
    referralList.length === 0
      ? COPY.referral.action
      : `Enviar ${plural(referralList.length, 'currículo', 'currículos')}`;

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
      {/*
        Herói da vaga: a pergunta, o número que a responde e o verbo que a
        encerra. Os chips de etapa, a procedência e a caixa de triagem que
        dividiam este espaço desceram — a triagem para dentro da lista
        completa, a procedência para a aba de contexto.
      */}
      <Hero
        eyebrow={`${company?.name} · ${job.location} · ${job.workShift}`}
        title={job.title}
        description="Marque até 5 pessoas e envie os currículos para a empresa."
        figures={[
          {
            label: 'Compatíveis',
            value: compativeis,
            hint: `${ADHERENCE_THRESHOLD}% ou mais — ${COPY.fit.combina}`
          },
          {
            label: 'Ainda não responderam',
            value: semResposta,
            tone: semResposta > 0 ? 'atencao' : 'default'
          },
          {
            label: 'Selecionados',
            value: `${referralList.length} de ${REFERRAL_LIMIT}`
          }
        ]}
        actions={
          <>
            <Link href={iel.jobs.byId(job.id).referral}>
              <Button
                size="large"
                disabled={referralList.length === 0}
              >
                {envioLabel}
              </Button>
            </Link>
            <Link href={iel.jobs.byId(job.id).comparison}>
              <Button
                variant="outline"
                disabled={comparison.length < 2}
              >
                Comparar ({comparison.length})
              </Button>
            </Link>
          </>
        }
      />

      <Panel
        padding="none"
        elevation={2}
        className="overflow-hidden"
      >
        <div className="px-4 pb-3 pt-4">
          <PanelHeader
            title="Sugeridos para envio"
            meta={`As cinco pessoas que mais combinam com a empresa. Mínimo de ${ADHERENCE_THRESHOLD}%.`}
            actions={
              referralList.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {referralList.length} de {REFERRAL_LIMIT} marcados
                </p>
              ) : null
            }
          />
        </div>

        {sugeridos.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-muted-foreground">
            Nenhuma candidatura nesta vaga ainda.
          </p>
        ) : (
          <ul className="border-t border-border">
            {sugeridos.map((entry) => renderCandidateRow(entry, 'sugerido'))}
          </ul>
        )}

        {resgate.length > 0 ? (
          <Disclosure
            tone="atencao"
            className="border-t border-border"
            summary={`${plural(resgate.length, 'pessoa ficou', 'pessoas ficaram')} abaixo dos requisitos da vaga, mas ${resgate.length === 1 ? 'combina' : 'combinam'} com a empresa — ver`}
          >
            <ul className="border-t border-border">
              {resgate.map((entry) => renderCandidateRow(entry, 'resgate'))}
            </ul>
          </Disclosure>
        ) : null}

        <Disclosure
          className="border-t border-border"
          summary={`Todos os candidatos (${applications.length}) — ver todos`}
        >
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-end">
            <Input
              label="Buscar por nome"
              placeholder="Nome da pessoa"
              value={candidateSearch}
              onChange={(event) => {
                setCandidateSearch(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="sm:flex-1"
            />
            <div className="space-y-2 sm:w-[14rem]">
              <label
                htmlFor="candidate-filter"
                className="block text-sm font-medium leading-none text-foreground"
              >
                {COPY.filter.label}
              </label>
              <FilterNativeSelect
                id="candidate-filter"
                value={candidateFilter}
                onValueChange={(value) => {
                  const escolhido = FILTROS.find(
                    (filtro) => filtro.value === value
                  );
                  if (!escolhido) return;
                  setCandidateFilter(escolhido.value);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                {FILTROS.map((filtro) => (
                  <option
                    key={filtro.value}
                    value={filtro.value}
                  >
                    {filtro.label}
                  </option>
                ))}
              </FilterNativeSelect>
            </div>
          </div>

          {filteredRanking.length === 0 ? (
            <p className="px-4 pb-5 text-sm text-muted-foreground">
              Ninguém com esse nome ou nesse filtro.
            </p>
          ) : (
            <ul className="border-t border-border">
              {filteredRanking.map((entry) =>
                renderCandidateRow(entry, 'todos')
              )}
            </ul>
          )}
        </Disclosure>

        <div className="px-4 pb-4">
          <HowItWorks title="Como este ranking é montado">
            <p>
              Cada pessoa responde cinco perguntas sobre como prefere trabalhar,
              e a empresa responde as mesmas cinco sobre como se trabalha lá. A
              comparação entre as duas respostas é o percentual que aparece
              grande na linha. O outro percentual, menor, é o de requisitos da
              vaga, que vem pronto do sistema de vagas.
            </p>
            <p>
              Quem fica em {ADHERENCE_THRESHOLD}% ou mais entra em
              &ldquo;compatíveis&rdquo;. Quem ainda não respondeu não vira zero:
              fica sem número, porque silêncio não é resposta baixa.
            </p>
            <p>
              A empresa recebe no máximo {REFERRAL_LIMIT} currículos por vaga.
              Nada é descartado sozinho: a lista ordena, a decisão de enviar é
              da analista.
            </p>
          </HowItWorks>
        </div>
      </Panel>

      <div
        role="tablist"
        aria-label="Áreas de apoio da vaga"
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {TABS.map(({ value, label }) => (
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

      {tab === 'detalhar' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0 space-y-4">
            <Panel
              padding="none"
              elevation={1}
              className="overflow-hidden"
            >
              <div className="border-b border-border px-4 py-3">
                <PanelHeader
                  title="Critério por critério"
                  hint="Cada marcador abre a origem do dado: de qual sistema veio, quando chegou e o que exatamente foi dito."
                  meta={`Marque de 2 a ${COMPARISON_LIMIT} pessoas para comparar lado a lado.`}
                  actions={
                    comparison.length > 0 ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          dispatch({ type: 'clear-comparison', jobId: job.id })
                        }
                      >
                        Limpar seleção ({comparison.length})
                      </Button>
                    ) : null
                  }
                />
              </div>
              <CandidatesMatrix
                job={job}
                applications={visibleApplications}
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
                onToggleComparison={toggleComparison}
                onAddToReferralList={addToReferralList}
              />
              {visibleCount < filteredApplications.length ? (
                <div className="border-t border-border p-3 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVisibleCount((count) => count + PAGE_SIZE)
                    }
                  >
                    Mostrar mais{' '}
                    {Math.min(
                      PAGE_SIZE,
                      filteredApplications.length - visibleCount
                    )}{' '}
                    de {filteredApplications.length - visibleCount} restantes
                  </Button>
                </div>
              ) : null}
            </Panel>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
              <CriterionStateLegend />
              <span
                aria-hidden="true"
                className="hidden h-3 w-px bg-border sm:block"
              />
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold">*</span> requisito obrigatório
                <Explain
                  className="ml-1"
                  label="Um requisito obrigatório não atendido é sinalizado para decisão da analista. A candidatura não é eliminada automaticamente."
                />
              </p>
            </div>

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
          <Panel>
            <PanelHeader
              eyebrow="Critérios da vaga"
              title="Requisitos e critérios"
              hint="Cada critério informa a dimensão, a obrigatoriedade e quem confirmou o requisito."
            />
            <div className="mt-4 space-y-3">
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
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel>
              <PanelHeader
                eyebrow="Empresa e equipe"
                title="Contexto da empresa e da equipe"
                hint="A descrição institucional é separada das condições concretas da equipe."
              />
              <div className="mt-4 space-y-3">
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
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                eyebrow="Requisitos"
                title="Requisitos essenciais informados"
              />
              <div className="mt-4">
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {job.essentialRequirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  {job.organizationalContext}
                </p>
              </div>
            </Panel>

            <AxisWeights jobId={job.id} />

            <Panel elevation={1}>
              <PanelHeader
                title={COPY.sources.label}
                hint={COPY.sources.hint}
                meta={`Atualização da origem: ${formatDate(job.updatedAt)}`}
              />
              <div className="mt-3">
                <SourceBreakdownBar
                  breakdown={jobSourceBreakdown}
                  total={jobEvidences.length}
                />
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'historico' ? (
        <Panel>
          <PanelHeader
            eyebrow="Registro"
            title="Histórico da vaga"
            hint="Ações locais desta demonstração, com autor e momento. Conclusões anteriores são preservadas no registro."
          />
          <div className="mt-4 space-y-4">
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
                Perguntas desta vaga
              </h3>
              {clarifications.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Nenhuma pergunta registrada.
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
          </div>
        </Panel>
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
