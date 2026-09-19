'use client';

import Link from 'next/link';
import {
  CRITERION_STATE_META,
  DIMENSION_META,
  getCoverage,
  getDimensionSummary
} from '@/features/iel-demo/analysis/criterion-states';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  EXTERNAL_STAGE_LABEL,
  getClarificationsByApplication,
  getTalent,
  REFERRAL_STAGE_LABEL
} from '@/features/iel-demo/state/selectors';
import type {
  Application,
  CriterionState,
  Dimension,
  Job,
  JobCriterion
} from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import {
  Button,
  Checkbox,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui';

import { CriterionStateBadge } from '../shared/criterion-state-badge';
import { Chip, CoverageMeter } from '../shared/ui';

const stateMarkerClass: Record<CriterionState, string> = {
  alinhamento: 'border-success/40 bg-success/10 text-success',
  'a-esclarecer': 'border-warning/40 bg-warning/10 text-warning',
  divergencia: 'border-destructive/40 bg-destructive/10 text-destructive',
  'sem-informacao': 'border-border bg-muted text-muted-foreground',
  'nao-se-aplica': 'border-dashed border-border text-muted-foreground'
};

type CandidatesMatrixProps = {
  job: Job;
  applications: Application[];
  selectedForComparison: string[];
  comparisonLimit: number;
  referralList: string[];
  activeCriterion: { applicationId: string; criterionId: string } | null;
  onOpenCriterion: (applicationId: string, criterion: JobCriterion) => void;
  onToggleComparison: (applicationId: string) => void;
  onAddToReferralList: (applicationId: string) => void;
};

function DimensionCell({
  job,
  application,
  dimension,
  onOpenCriterion,
  activeCriterion
}: {
  job: Job;
  application: Application;
  dimension: Dimension;
  onOpenCriterion: (applicationId: string, criterion: JobCriterion) => void;
  activeCriterion: { applicationId: string; criterionId: string } | null;
}) {
  const { state } = useIelDemo();
  const summary = getDimensionSummary(
    job,
    state.analysis,
    application.id,
    dimension
  );

  if (summary.criteria.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Nenhum critério nesta dimensão
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <CriterionStateBadge
        state={summary.headline}
        size="sm"
      />
      <ul className="flex flex-wrap gap-1">
        {summary.criteria.map(({ criterion, analysis }) => {
          const isActive =
            activeCriterion?.applicationId === application.id &&
            activeCriterion?.criterionId === criterion.id;
          const meta = CRITERION_STATE_META[analysis.state];
          return (
            <li key={criterion.id}>
              <button
                type="button"
                onClick={() => onOpenCriterion(application.id, criterion)}
                title={`${criterion.label}: ${meta.label}. ${analysis.note} (clique para ver as evidências)`}
                className={cn(
                  'inline-flex max-w-44 items-center gap-1 rounded-[var(--control-radius)] border px-1.5 py-0.5 text-[11px] transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  stateMarkerClass[analysis.state],
                  isActive && 'ring-2 ring-ring/50'
                )}
              >
                <span aria-hidden="true">{meta.marker}</span>
                <span className="truncate">{criterion.label}</span>
                {criterion.required ? (
                  <span
                    className="font-semibold"
                    title="Requisito obrigatório"
                  >
                    *
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Matriz de candidatos da vaga: uma linha por candidatura, estados por dimensão. */
export function CandidatesMatrix({
  job,
  applications,
  selectedForComparison,
  comparisonLimit,
  referralList,
  activeCriterion,
  onOpenCriterion,
  onToggleComparison,
  onAddToReferralList
}: CandidatesMatrixProps) {
  const { state } = useIelDemo();
  const iel = routes.dashboard.iel;

  if (applications.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <h3 className="text-base font-semibold text-foreground">
          Nenhuma candidatura nesta vaga
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Quando a origem enviar candidaturas, elas aparecem aqui com a análise
          por critério.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            <TableHead
              scope="col"
              className="sticky left-0 z-20 min-w-64 bg-card"
            >
              Candidato e etapa
            </TableHead>
            {(['tecnica', 'profissional', 'organizacional'] as Dimension[]).map(
              (dimension) => (
                <TableHead
                  key={dimension}
                  scope="col"
                  className="min-w-64"
                  title={DIMENSION_META[dimension].description}
                >
                  {DIMENSION_META[dimension].label}
                </TableHead>
              )
            )}
            <TableHead
              scope="col"
              className="min-w-48"
            >
              Cobertura
            </TableHead>
            <TableHead
              scope="col"
              className="min-w-44"
            >
              Pendências
            </TableHead>
            <TableHead
              scope="col"
              className="min-w-56"
            >
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => {
            const talent = getTalent(application.talentId);
            const coverage = getCoverage(job, state.analysis, application.id);
            const clarifications = getClarificationsByApplication(
              state,
              application.id
            ).filter((clarification) => clarification.state !== 'cancelada');
            const isSelected = selectedForComparison.includes(application.id);
            const isInReferralList = referralList.includes(application.id);
            const selectionDisabled =
              !isSelected && selectedForComparison.length >= comparisonLimit;

            return (
              <TableRow
                key={application.id}
                data-state={isSelected ? 'selected' : undefined}
              >
                <TableCell className="sticky left-0 z-10 bg-card align-top">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      inputId={`compare-${application.id}`}
                      checked={isSelected}
                      disabled={selectionDisabled}
                      onCheckedChange={() => onToggleComparison(application.id)}
                      aria-label={`Selecionar ${talent?.name} para comparação`}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                      <label
                        htmlFor={`compare-${application.id}`}
                        className="block cursor-pointer text-sm font-medium text-foreground"
                      >
                        {talent?.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {talent?.headline}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Chip>
                          {EXTERNAL_STAGE_LABEL[application.externalStage]}
                        </Chip>
                        {application.referralStage !== 'nao-encaminhada' ? (
                          <Chip tone="info">
                            {REFERRAL_STAGE_LABEL[application.referralStage]}
                          </Chip>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </TableCell>

                {(
                  ['tecnica', 'profissional', 'organizacional'] as Dimension[]
                ).map((dimension) => (
                  <TableCell
                    key={dimension}
                    className="align-top"
                  >
                    <DimensionCell
                      job={job}
                      application={application}
                      dimension={dimension}
                      onOpenCriterion={onOpenCriterion}
                      activeCriterion={activeCriterion}
                    />
                  </TableCell>
                ))}

                <TableCell className="align-top">
                  <CoverageMeter coverage={coverage} />
                </TableCell>

                <TableCell className="align-top">
                  {clarifications.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Nenhuma solicitação
                    </span>
                  ) : (
                    <ul className="space-y-1">
                      {clarifications.map((clarification) => (
                        <li key={clarification.id}>
                          <Link
                            href={iel.clarifications.index}
                            className="text-xs underline decoration-dotted"
                          >
                            {clarification.state === 'respondida'
                              ? 'Resposta aguardando incorporação'
                              : clarification.state === 'incorporada'
                                ? 'Resposta incorporada'
                                : clarification.state === 'rascunho'
                                  ? 'Rascunho de solicitação'
                                  : 'Solicitação sem resposta'}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={iel.talents
                        .byId(application.talentId)
                        .inJob(job.id)}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        Ver perfil consolidado
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant={isInReferralList ? 'ghost' : 'default'}
                      disabled={isInReferralList}
                      onClick={() => onAddToReferralList(application.id)}
                    >
                      {isInReferralList
                        ? 'Já está na lista'
                        : 'Adicionar à lista'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
