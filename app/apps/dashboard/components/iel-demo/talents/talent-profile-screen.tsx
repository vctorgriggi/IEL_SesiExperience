'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  DIMENSION_META,
  getCoverage,
  getCriterionAnalysis
} from '@/features/iel-demo/analysis/criterion-states';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getAssessments,
  getCompany,
  getEvidencesByTalent,
  getEvidencesForApplication,
  getEvidencesForCriterion,
  getJob,
  getReferralListSelection,
  getSourceBreakdown,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Dimension, JobCriterion } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import { Alert, Button, Textarea, toast } from '@workspace/ui';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import {
  CriterionStateDot,
  CriterionStateHeadline
} from '../shared/criterion-state-badge';
import { EvidenceCard, EvidencePanel } from '../shared/evidence-panel';
import {
  Chip,
  CoverageMeter,
  formatDate,
  IelPageHeader,
  InfoHint,
  Panel,
  PanelHeader,
  SourceBreakdownBar,
  SourceDot
} from '../shared/ui';
import { FitReading } from './fit-reading';
import { TalentJourney } from './talent-journey';

export function TalentProfileScreen({ talentId }: { talentId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('vaga');
  const [activeCriterionId, setActiveCriterionId] = useState<string | null>(
    null
  );
  const [clarificationCriterion, setClarificationCriterion] =
    useState<JobCriterion | null>(null);
  const [internalNote, setInternalNote] = useState('');

  const iel = routes.dashboard.iel;
  const talent = getTalent(talentId);

  if (!talent) {
    return (
      <Alert variant="destructive">
        Talento não encontrado nesta base de demonstração.{' '}
        <Link
          className="underline"
          href={iel.talents.index}
        >
          Ver talentos
        </Link>
        .
      </Alert>
    );
  }

  if (persona.kind === 'gestor') {
    return (
      <Alert variant="warning">
        No perfil de gestor, os dados de um talento só aparecem dentro de um
        encaminhamento compartilhado pelo IEL.{' '}
        <Link
          className="underline"
          href={iel.referrals.index}
        >
          Ver perfis encaminhados
        </Link>
        .
      </Alert>
    );
  }

  const job = jobId ? getJob(jobId) : null;
  const applications = getApplicationsByTalent(state, talent.id);
  const contextApplication = job
    ? applications.find((application) => application.jobId === job.id)
    : null;
  const company = job ? getCompany(job.companyId) : null;
  const assessments = getAssessments(talent.id);
  const evidences = getEvidencesByTalent(state, talent.id);
  const sharedEvidences = evidences.filter(
    (evidence) => evidence.visibility === 'compartilhavel'
  );
  const internalNotes = evidences.filter(
    (evidence) => evidence.visibility === 'interno'
  );
  const referralList = job ? getReferralListSelection(state, job.id) : [];
  const activeCriterion =
    job && activeCriterionId
      ? (job.criteria.find((criterion) => criterion.id === activeCriterionId) ??
        null)
      : null;

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={
          job && company
            ? `Análise para ${job.title} — ${company.name}`
            : 'Perfil consolidado (sem contexto de vaga)'
        }
        title={talent.name}
        description={talent.summary}
        actions={
          <>
            {job ? (
              <Link
                href={iel.jobs.byId(job.id).index}
                className="self-center text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                ← Voltar para a vaga
              </Link>
            ) : null}
            {job && contextApplication ? (
              <Button
                disabled={referralList.includes(contextApplication.id)}
                onClick={() => {
                  dispatch({
                    type: 'add-to-referral-list',
                    jobId: job.id,
                    applicationId: contextApplication.id,
                    at: nowIso()
                  });
                  toast.success('Perfil adicionado à lista de encaminhamento.');
                }}
              >
                {referralList.includes(contextApplication.id)
                  ? 'Já está na lista'
                  : 'Adicionar à lista de encaminhamento'}
              </Button>
            ) : null}
            {job ? (
              <Link href={iel.jobs.byId(job.id).comparison}>
                <Button variant="outline">Abrir comparação</Button>
              </Link>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip>{talent.city}</Chip>
          <Chip>{talent.email}</Chip>
          <Chip tone="info">
            {plural(applications.length, 'candidatura', 'candidaturas')} na base
            demo
          </Chip>
          <span className="text-xs text-muted-foreground">
            Perfil único: a pessoa não é duplicada quando participa de mais de
            um processo.
          </span>
        </div>
      </IelPageHeader>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-4">
          {/*
            A aderência abre o perfil.

            É o instrumento desta tela: o anel, o radar e os callouts dizem
            em um relance o que a análise por critério confirma linha a
            linha. Enquanto a leitura vinha depois da matriz de critérios,
            ela era o último painel de uma pilha de painéis iguais.
          */}
          {job && contextApplication ? (
            <FitReading
              job={job}
              talentId={talent.id}
              application={contextApplication}
            />
          ) : null}

          {job && contextApplication ? (
            <Panel elevation={1}>
              <PanelHeader
                eyebrow="Compatibilidade"
                title={`Análise por critério — ${job.title}`}
                hint="A leitura depende desta oportunidade: o mesmo perfil tem outra análise em outra vaga."
              />
              <div className="mt-4 space-y-4">
                <SourceBreakdownBar
                  breakdown={getSourceBreakdown(
                    getEvidencesForApplication(state, job, contextApplication)
                  )}
                  total={
                    getEvidencesForApplication(state, job, contextApplication)
                      .length
                  }
                  className="border-b border-border pb-3"
                />
                <CoverageMeter
                  coverage={getCoverage(
                    job,
                    state.analysis,
                    contextApplication.id
                  )}
                />
                {(
                  ['tecnica', 'profissional', 'organizacional'] as Dimension[]
                ).map((dimension) => {
                  const criteria = job.criteria.filter(
                    (criterion) => criterion.dimension === dimension
                  );
                  if (criteria.length === 0) return null;
                  const dimensionCoverage = getCoverage(
                    job,
                    state.analysis,
                    contextApplication.id,
                    dimension
                  );
                  return (
                    <section key={dimension}>
                      <div className="flex items-baseline justify-between gap-3 border-b border-border-strong pb-1.5">
                        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                          {DIMENSION_META[dimension].label}
                          <InfoHint
                            label={DIMENSION_META[dimension].description}
                          />
                        </h3>
                        <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {dimensionCoverage.withInformation}/
                          {dimensionCoverage.total} com dados
                        </p>
                      </div>
                      <ul className="divide-y divide-border">
                        {criteria.map((criterion) => {
                          const analysis = getCriterionAnalysis(
                            state.analysis,
                            contextApplication.id,
                            criterion.id
                          );
                          const evidences = getEvidencesForCriterion(
                            state,
                            contextApplication,
                            criterion.id
                          );
                          return (
                            <li key={criterion.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCriterionId(criterion.id)
                                }
                                aria-label={`${criterion.label}: ver evidências`}
                                className="w-full px-1 py-2.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                              >
                                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <CriterionStateDot state={analysis.state} />
                                  <span className="text-sm font-medium text-foreground">
                                    {criterion.label}
                                  </span>
                                  {criterion.required ? (
                                    <abbr
                                      title="Requisito obrigatório"
                                      className="text-xs font-semibold text-muted-foreground no-underline"
                                    >
                                      *
                                    </abbr>
                                  ) : null}
                                  <CriterionStateHeadline
                                    state={analysis.state}
                                    className="ml-auto"
                                  />
                                </span>
                                <span className="mt-0.5 block pl-4 text-xs leading-relaxed text-muted-foreground">
                                  {analysis.note}
                                </span>
                                {evidences.length > 0 ? (
                                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-4 text-[11px] text-muted-foreground">
                                    {getSourceBreakdown(evidences).map(
                                      (entry) => (
                                        <span
                                          key={entry.sourceId}
                                          className="inline-flex items-center gap-1"
                                        >
                                          <SourceDot
                                            sourceId={entry.sourceId}
                                          />
                                          {entry.shortName}
                                          {entry.count > 1 ? (
                                            <span className="tabular-nums">
                                              ({entry.count})
                                            </span>
                                          ) : null}
                                        </span>
                                      )
                                    )}
                                    <span className="font-medium text-primary">
                                      ver evidência
                                      {evidences.length === 1 ? '' : 's'}
                                    </span>
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </div>
            </Panel>
          ) : (
            <Alert variant="default">
              Este perfil está aberto sem contexto de vaga. A compatibilidade
              depende da oportunidade: abra o perfil a partir de uma vaga para
              ver a análise por critério.
            </Alert>
          )}

          <Panel>
            <PanelHeader
              eyebrow="Percurso profissional"
              title="Experiências declaradas"
            />
            <div className="mt-4 space-y-3">
              <ul className="space-y-3">
                {talent.experiences.map((experience) => (
                  <li
                    key={experience.id}
                    className="rounded-[var(--control-radius)] border border-border p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {experience.role} — {experience.organization}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {experience.period}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {experience.activities}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Competências declaradas
                  </p>
                  <ul className="mt-1 flex flex-wrap gap-1">
                    {talent.declaredSkills.map((skill) => (
                      <li key={skill}>
                        <Chip>{skill}</Chip>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Expectativas registradas
                  </p>
                  {talent.expectations.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Nenhuma expectativa registrada até agora.
                    </p>
                  ) : (
                    <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                      {talent.expectations.map((expectation) => (
                        <li key={expectation}>{expectation}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Fontes externas"
              title="Avaliações existentes"
              hint="Resultados de origem, com escala, método e data preservados. Nenhuma avaliação nova é aplicada nesta demonstração."
            />
            <div className="mt-4 space-y-3">
              {assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Avaliação não disponível — o que não equivale a nota zero.
                </p>
              ) : (
                assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="space-y-2 rounded-[var(--control-radius)] border border-border p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {assessment.method}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Aplicada em {formatDate(assessment.appliedAt)} ·{' '}
                      {assessment.scale}
                    </p>
                    <ul className="space-y-1 text-sm text-foreground">
                      {assessment.results.map((result) => (
                        <li key={result.label}>
                          {result.label}: <strong>{result.value}</strong>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      {assessment.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <TalentJourney talentId={talent.id} />

          <Panel>
            <PanelHeader
              eyebrow="Rastreabilidade"
              title={`Registros e origens (${sharedEvidences.length})`}
              hint="Informações compartilháveis usadas na análise."
            />
            <div className="mt-4 space-y-3">
              {sharedEvidences.map((evidence) => (
                <EvidenceCard
                  key={evidence.id}
                  evidence={evidence}
                />
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              eyebrow="Uso interno"
              title="Notas internas do IEL"
              hint="Separadas dos dados compartilháveis: não entram no encaminhamento."
            />
            <div className="mt-4 space-y-3">
              {internalNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma nota interna registrada.
                </p>
              ) : (
                internalNotes.map((note) => (
                  <EvidenceCard
                    key={note.id}
                    evidence={note}
                  />
                ))
              )}
              <div className="space-y-2">
                <label
                  htmlFor="internal-note"
                  className="block text-sm font-medium text-foreground"
                >
                  Nova nota interna
                </label>
                <Textarea
                  id="internal-note"
                  rows={3}
                  value={internalNote}
                  placeholder="Ex.: combinar retorno sobre a disponibilidade antes do encaminhamento."
                  onChange={(event) => setInternalNote(event.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={internalNote.trim().length === 0}
                  onClick={() => {
                    dispatch({
                      type: 'add-internal-note',
                      talentId: talent.id,
                      jobId: job?.id ?? 'sem-vaga',
                      note: internalNote.trim(),
                      at: nowIso()
                    });
                    setInternalNote('');
                    toast.success(
                      'Nota interna registrada (não compartilhada).'
                    );
                  }}
                >
                  Registrar nota interna
                </Button>
              </div>
            </div>
          </Panel>
        </div>

        {job && contextApplication && activeCriterion ? (
          <div className="xl:w-[26rem]">
            <EvidencePanel
              job={job}
              application={contextApplication}
              criterion={activeCriterion}
              onClose={() => setActiveCriterionId(null)}
              onRequestClarification={() =>
                setClarificationCriterion(activeCriterion)
              }
            />
          </div>
        ) : null}
      </div>

      {job && clarificationCriterion ? (
        <CreateClarificationDialog
          job={job}
          criterion={clarificationCriterion}
          application={contextApplication ?? null}
          visible
          onHide={() => setClarificationCriterion(null)}
        />
      ) : null}
    </div>
  );
}
