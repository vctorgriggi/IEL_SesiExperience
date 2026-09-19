'use client';

import { useState } from 'react';
import Link from 'next/link';
import { compareSelection } from '@/features/iel-demo/analysis/assistant';
import {
  CRITERION_STATE_META,
  DIMENSION_META,
  getCoverage,
  getCriterionAnalysis
} from '@/features/iel-demo/analysis/criterion-states';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getComparisonSelection,
  getJob,
  getReferralListSelection,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type {
  Application,
  Dimension,
  JobCriterion
} from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import {
  Alert,
  Button,
  Card,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast
} from '@workspace/ui';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import { CriterionStateBadge } from '../shared/criterion-state-badge';
import { EvidencePanel } from '../shared/evidence-panel';
import { Chip, CoverageMeter, IelPageHeader } from '../shared/ui';

export function ComparisonScreen({ jobId }: { jobId: string }) {
  const { state, dispatch } = useIelDemo();
  const [activeCell, setActiveCell] = useState<{
    applicationId: string;
    criterionId: string;
  } | null>(null);
  const [clarificationTarget, setClarificationTarget] = useState<{
    applicationId: string;
    criterion: JobCriterion;
  } | null>(null);

  const iel = routes.dashboard.iel;
  const job = getJob(jobId);

  if (!job) {
    return <Alert variant="destructive">Vaga não encontrada.</Alert>;
  }

  const selected = getComparisonSelection(state, job.id);
  const referralList = getReferralListSelection(state, job.id);
  const applications = selected
    .map((applicationId) => getApplication(state, applicationId))
    .filter((application): application is Application => Boolean(application));

  const synthesis = compareSelection(state, job, selected);
  const activeApplication = activeCell
    ? getApplication(state, activeCell.applicationId)
    : null;
  const activeCriterion = activeCell
    ? (job.criteria.find(
        (criterion) => criterion.id === activeCell.criterionId
      ) ?? null)
    : null;

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow={`Comparação no contexto de ${job.title}`}
        title="Comparação entre candidatos"
        description="Os mesmos critérios da vaga. Cada célula abre a evidência que sustenta o estado."
        actions={
          <Link href={iel.jobs.byId(job.id).index}>
            <Button variant="outline">Voltar para a mesa de seleção</Button>
          </Link>
        }
      />

      {applications.length < 2 ? (
        <Alert variant="warning">
          Selecione de dois a três candidatos na matriz da vaga para comparar.{' '}
          <Link
            className="underline"
            href={iel.jobs.byId(job.id).index}
          >
            Abrir a matriz
          </Link>
          .
        </Alert>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
            <Card padding="none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        scope="col"
                        className="sticky left-0 z-10 min-w-56 bg-card"
                      >
                        Critério da vaga
                      </TableHead>
                      {applications.map((application) => {
                        const talent = getTalent(application.talentId);
                        return (
                          <TableHead
                            key={application.id}
                            scope="col"
                            className="min-w-64"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">
                                {talent?.name}
                              </p>
                              <p className="text-xs font-normal text-muted-foreground">
                                {talent?.headline}
                              </p>
                              <CoverageMeter
                                coverage={getCoverage(
                                  job,
                                  state.analysis,
                                  application.id
                                )}
                              />
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(
                      [
                        'tecnica',
                        'profissional',
                        'organizacional'
                      ] as Dimension[]
                    ).flatMap((dimension) => {
                      const criteria = job.criteria.filter(
                        (criterion) => criterion.dimension === dimension
                      );
                      if (criteria.length === 0) return [];
                      return [
                        <TableRow
                          key={`dim-${dimension}`}
                          className="bg-muted/60"
                        >
                          <TableCell
                            colSpan={applications.length + 1}
                            className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                          >
                            {DIMENSION_META[dimension].label}
                          </TableCell>
                        </TableRow>,
                        ...criteria.map((criterion) => (
                          <TableRow key={criterion.id}>
                            <TableCell className="sticky left-0 z-10 bg-card align-top">
                              <p className="text-sm font-medium text-foreground">
                                {criterion.label}
                                {criterion.required ? (
                                  <span
                                    title="Requisito obrigatório"
                                    className="ml-1 font-semibold"
                                  >
                                    *
                                  </span>
                                ) : null}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {criterion.question}
                              </p>
                            </TableCell>
                            {applications.map((application) => {
                              const analysis = getCriterionAnalysis(
                                state.analysis,
                                application.id,
                                criterion.id
                              );
                              const isActive =
                                activeCell?.applicationId === application.id &&
                                activeCell?.criterionId === criterion.id;
                              return (
                                <TableCell
                                  key={`${application.id}-${criterion.id}`}
                                  className="align-top"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveCell({
                                        applicationId: application.id,
                                        criterionId: criterion.id
                                      })
                                    }
                                    className={cn(
                                      'w-full space-y-1 rounded-[var(--control-radius)] p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                                      isActive && 'ring-2 ring-ring/50'
                                    )}
                                  >
                                    <CriterionStateBadge
                                      state={analysis.state}
                                      size="sm"
                                    />
                                    <span className="block text-xs text-muted-foreground">
                                      {analysis.note}
                                    </span>
                                    <span className="block text-[11px] text-muted-foreground underline decoration-dotted">
                                      Ver evidência
                                    </span>
                                  </button>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      ];
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {activeApplication && activeCriterion ? (
              <div className="xl:w-[26rem]">
                <EvidencePanel
                  job={job}
                  application={activeApplication}
                  criterion={activeCriterion}
                  onClose={() => setActiveCell(null)}
                  onRequestClarification={() =>
                    setClarificationTarget({
                      applicationId: activeApplication.id,
                      criterion: activeCriterion
                    })
                  }
                />
              </div>
            ) : null}
          </div>

          <Card className="gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {synthesis.title}
            </h2>
            {synthesis.paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm text-foreground"
              >
                {paragraph}
              </p>
            ))}
            <p className="text-[11px] text-muted-foreground">
              {synthesis.disclaimer}
            </p>
          </Card>

          <Card className="gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Ações a partir da comparação
            </h2>
            <div className="flex flex-wrap gap-2">
              {applications.map((application) => {
                const talent = getTalent(application.talentId);
                const inList = referralList.includes(application.id);
                return (
                  <div
                    key={application.id}
                    className="flex flex-wrap items-center gap-2 rounded-[var(--control-radius)] border border-border p-2"
                  >
                    <span className="text-sm text-foreground">
                      {talent?.name}
                    </span>
                    <Chip>{inList ? 'Na lista' : 'Fora da lista'}</Chip>
                    <Button
                      size="sm"
                      variant={inList ? 'ghost' : 'outline'}
                      disabled={inList}
                      onClick={() => {
                        dispatch({
                          type: 'add-to-referral-list',
                          jobId: job.id,
                          applicationId: application.id,
                          at: nowIso()
                        });
                        toast.success(
                          `${talent?.name} entrou na lista de encaminhamento.`
                        );
                      }}
                    >
                      Adicionar à lista
                    </Button>
                    <Link
                      href={iel.talents
                        .byId(application.talentId)
                        .inJob(job.id)}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                      >
                        Abrir perfil
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Nenhuma ação aqui contrata ou descarta alguém: a comparação apoia
              a decisão e registra o caminho.
            </p>
          </Card>

          <Card padding="sm">
            <p className="text-xs text-muted-foreground">
              Estados usados nesta comparação:{' '}
              {Object.values(CRITERION_STATE_META)
                .map((meta) => `${meta.marker} ${meta.label}`)
                .join(' · ')}
              .
            </p>
          </Card>
        </>
      )}

      {clarificationTarget ? (
        <CreateClarificationDialog
          job={job}
          criterion={clarificationTarget.criterion}
          application={getApplication(state, clarificationTarget.applicationId)}
          visible
          onHide={() => setClarificationTarget(null)}
        />
      ) : null}
    </div>
  );
}
