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

import {
  CriterionStateDot,
  CriterionStateHeadline
} from '../shared/criterion-state-badge';
import { Chip, CoverageMeter } from '../shared/ui';

const DIMENSIONS: Dimension[] = ['tecnica', 'profissional', 'organizacional'];

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

/**
 * Uma dimensão para uma candidatura: o estado que resume a leitura, seguido
 * dos critérios que o sustentam. Os critérios são uma lista discreta — a cor
 * aparece só no marcador, então a célula não vira um bloco saturado.
 */
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
    <div className="space-y-1.5">
      <CriterionStateHeadline state={summary.headline} />
      <ul className="-mx-1.5 space-y-px">
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
                aria-label={`${criterion.label}: ${meta.label}. Ver evidências.`}
                title={`${criterion.label} — ${meta.label}. ${analysis.note}`}
                className={cn(
                  'flex w-full items-center gap-1.5 rounded-[var(--control-radius)] px-1.5 py-0.5 text-left text-[11px] transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  isActive && 'bg-accent'
                )}
              >
                <CriterionStateDot state={analysis.state} />
                <span className="truncate text-foreground/80">
                  {criterion.label}
                </span>
                {criterion.required ? (
                  <abbr
                    title="Requisito obrigatório"
                    className="shrink-0 font-semibold text-muted-foreground no-underline"
                  >
                    *
                  </abbr>
                ) : null}
                <span
                  aria-hidden="true"
                  className="ml-auto shrink-0 pl-1 font-medium text-muted-foreground"
                >
                  {meta.marker}
                </span>
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
    // `overflow-x` cria um contexto de rolagem próprio, e dentro dele o
    // cabeçalho grudaria na caixa da tabela em vez de grudar na página. Na
    // largura em que a matriz cabe inteira, a rolagem horizontal é dispensada
    // e o cabeçalho volta a acompanhar a rolagem da página, como o briefing
    // pede para a leitura não se perder ao descer a lista.
    <div className="overflow-x-auto xl:overflow-x-visible">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]">
          <TableRow>
            <TableHead
              scope="col"
              className="min-w-[17rem]"
            >
              Candidato e etapa
            </TableHead>
            {DIMENSIONS.map((dimension) => (
              <TableHead
                key={dimension}
                scope="col"
                className="min-w-[12.5rem]"
                title={DIMENSION_META[dimension].description}
              >
                {DIMENSION_META[dimension].label}
              </TableHead>
            ))}
            <TableHead
              scope="col"
              className="min-w-[13rem]"
            >
              Cobertura e pendências
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
                <TableCell className="align-top">
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      inputId={`compare-${application.id}`}
                      checked={isSelected}
                      disabled={selectionDisabled}
                      onCheckedChange={() => onToggleComparison(application.id)}
                      aria-label={`Selecionar ${talent?.name} para comparação`}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 space-y-1.5">
                      <div>
                        <label
                          htmlFor={`compare-${application.id}`}
                          className="block cursor-pointer text-sm font-semibold text-foreground"
                        >
                          {talent?.name}
                        </label>
                        <p className="text-xs leading-snug text-muted-foreground">
                          {talent?.headline}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <Chip>
                          {EXTERNAL_STAGE_LABEL[application.externalStage]}
                        </Chip>
                        {application.referralStage !== 'nao-encaminhada' ? (
                          <Chip tone="info">
                            {REFERRAL_STAGE_LABEL[application.referralStage]}
                          </Chip>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <Link
                          href={iel.talents
                            .byId(application.talentId)
                            .inJob(job.id)}
                          aria-label="Ver perfil consolidado"
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Ver perfil
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isInReferralList}
                          onClick={() => onAddToReferralList(application.id)}
                          className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent hover:underline disabled:text-muted-foreground disabled:no-underline"
                        >
                          {isInReferralList
                            ? 'Já está na lista'
                            : 'Adicionar à lista'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TableCell>

                {DIMENSIONS.map((dimension) => (
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
                  <div className="space-y-2">
                    <CoverageMeter coverage={coverage} />
                    {clarifications.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        Sem solicitações abertas
                      </p>
                    ) : (
                      <ul className="space-y-0.5">
                        {clarifications.map((clarification) => (
                          <li key={clarification.id}>
                            <Link
                              href={iel.clarifications.index}
                              className="text-[11px] font-medium text-primary underline-offset-2 hover:underline"
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
