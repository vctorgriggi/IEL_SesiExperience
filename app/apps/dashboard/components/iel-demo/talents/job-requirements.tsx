'use client';

import { useState } from 'react';
import {
  DIMENSION_META,
  getCoverage,
  getCriterionAnalysis
} from '@/features/iel-demo/analysis/criterion-states';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getEvidencesForCriterion,
  getSourceBreakdown
} from '@/features/iel-demo/state/selectors';
import type {
  Application,
  Dimension,
  Job,
  JobCriterion
} from '@/features/iel-demo/types';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import {
  CriterionStateDot,
  CriterionStateHeadline
} from '../shared/criterion-state-badge';
import { EvidencePanel } from '../shared/evidence-panel';
import { SectionTitle, SourceDot } from '../shared/ui';

const DIMENSIONS: Dimension[] = ['tecnica', 'profissional', 'organizacional'];

/**
 * Os requisitos da vaga, um a um, com a origem de cada conclusão.
 *
 * Responde a segunda pergunta da tela, não a primeira: o percentual de
 * requisitos vem do sistema de vagas e aparece no herói; aqui está o que o
 * sustenta. Por isso o bloco inteiro nasce recolhido — quem só precisa
 * decidir o envio não passa por ele.
 */
export function JobRequirements({
  job,
  application
}: {
  job: Job;
  application: Application;
}) {
  const { state } = useIelDemo();
  const [openCriterionId, setOpenCriterionId] = useState<string | null>(null);
  const [asking, setAsking] = useState<JobCriterion | null>(null);

  const openCriterion =
    job.criteria.find((criterion) => criterion.id === openCriterionId) ?? null;

  return (
    <div className="space-y-5">
      {DIMENSIONS.map((dimension) => {
        const criteria = job.criteria.filter(
          (criterion) => criterion.dimension === dimension
        );
        if (criteria.length === 0) return null;
        const coverage = getCoverage(
          job,
          state.analysis,
          application.id,
          dimension
        );

        return (
          <section key={dimension}>
            <div className="flex items-baseline justify-between gap-3 border-b border-border-strong pb-1.5">
              <SectionTitle hint={DIMENSION_META[dimension].description}>
                {DIMENSION_META[dimension].label}
              </SectionTitle>
              <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {coverage.withInformation}/{coverage.total} com dados
              </p>
            </div>
            <ul className="divide-y divide-border">
              {criteria.map((criterion) => {
                const analysis = getCriterionAnalysis(
                  state.analysis,
                  application.id,
                  criterion.id
                );
                const evidences = getEvidencesForCriterion(
                  state,
                  application,
                  criterion.id
                );

                return (
                  <li key={criterion.id}>
                    <button
                      type="button"
                      onClick={() => setOpenCriterionId(criterion.id)}
                      aria-label={`${criterion.label}: ver de onde vem`}
                      className="iel-interactive w-full px-1 py-2.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
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
                      <span className="iel-prose mt-0.5 block pl-4 text-xs leading-relaxed text-muted-foreground">
                        {analysis.note}
                      </span>
                      {evidences.length > 0 ? (
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 pl-4 text-[11px] text-muted-foreground">
                          {getSourceBreakdown(evidences).map((entry) => (
                            <span
                              key={entry.sourceId}
                              className="inline-flex items-center gap-1"
                            >
                              <SourceDot sourceId={entry.sourceId} />
                              {entry.shortName}
                              {entry.count > 1 ? (
                                <span className="tabular-nums">
                                  ({entry.count})
                                </span>
                              ) : null}
                            </span>
                          ))}
                          <span className="font-medium text-primary">
                            ver de onde vem
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

      {openCriterion ? (
        <EvidencePanel
          job={job}
          application={application}
          criterion={openCriterion}
          onClose={() => setOpenCriterionId(null)}
          onRequestClarification={() => setAsking(openCriterion)}
        />
      ) : null}

      {asking ? (
        <CreateClarificationDialog
          job={job}
          criterion={asking}
          application={application}
          visible
          onHide={() => setAsking(null)}
        />
      ) : null}
    </div>
  );
}
