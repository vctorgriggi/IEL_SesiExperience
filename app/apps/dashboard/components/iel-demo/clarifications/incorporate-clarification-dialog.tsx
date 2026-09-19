'use client';

import { useMemo, useState } from 'react';
import {
  CRITERION_STATE_META,
  getCriterionAnalysis
} from '@/features/iel-demo/analysis/criterion-states';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import type { IncorporationDecision } from '@/features/iel-demo/state/reducer';
import {
  getApplication,
  getCriterion,
  getJob,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Clarification, CriterionState } from '@/features/iel-demo/types';

import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  FilterNativeSelect,
  Textarea,
  toast
} from '@workspace/ui';

import { CriterionStateHeadline } from '../shared/criterion-state-badge';

type Row = IncorporationDecision & { apply: boolean };

/**
 * Incorporação da resposta: a sugestão vem da análise assistida, mas o estado
 * final de cada critério é confirmado pelo analista.
 */
export function IncorporateClarificationDialog({
  clarification,
  visible,
  onHide
}: {
  clarification: Clarification;
  visible: boolean;
  onHide: () => void;
}) {
  const { state, dispatch } = useIelDemo();
  const job = getJob(clarification.jobId);

  const initialRows = useMemo<Row[]>(
    () =>
      clarification.effects.map((effect) => ({
        applicationId: effect.applicationId,
        criterionId: effect.criterionId,
        state: effect.suggestedState,
        note: effect.note,
        apply: true
      })),
    [clarification.effects]
  );

  const [rows, setRows] = useState<Row[]>(initialRows);

  if (!job) return null;

  const applied = rows.filter((row) => row.apply);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      size="lg"
      header="Incorporar a resposta à análise"
      description={`${job.title} · resposta de ${clarification.recipient.name}`}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onHide}
          >
            Revisar depois
          </Button>
          <Button
            disabled={applied.length === 0}
            onClick={() => {
              dispatch({
                type: 'incorporate-clarification',
                clarificationId: clarification.id,
                decisions: applied.map(
                  ({ apply: _apply, ...decision }) => decision
                ),
                at: nowIso()
              });
              onHide();
              toast.success(
                `Análise atualizada em ${plural(applied.length, 'critério', 'critérios')}. A origem da mudança ficou registrada.`
              );
            }}
          >
            Incorporar em {plural(applied.length, 'critério', 'critérios')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1 rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pergunta
          </p>
          <p className="text-sm text-foreground">{clarification.question}</p>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resposta registrada
          </p>
          <p className="text-sm text-foreground">“{clarification.answer}”</p>
        </div>

        {rows.length === 0 ? (
          <Alert variant="warning">
            Esta resposta não traz informação suficiente para alterar critérios.
            A lacuna permanece registrada e nenhuma candidatura é penalizada.
          </Alert>
        ) : (
          <ul className="space-y-3">
            {rows.map((row, index) => {
              const application = getApplication(state, row.applicationId);
              const talent = application
                ? getTalent(application.talentId)
                : null;
              const criterion = getCriterion(job, row.criterionId);
              const previous = getCriterionAnalysis(
                state.analysis,
                row.applicationId,
                row.criterionId
              );

              return (
                <li
                  key={`${row.applicationId}-${row.criterionId}`}
                  className="space-y-2 rounded-[var(--control-radius)] border border-border p-3"
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      inputId={`apply-${row.applicationId}-${row.criterionId}`}
                      checked={row.apply}
                      onCheckedChange={(checked) =>
                        setRows((current) =>
                          current.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, apply: checked }
                              : entry
                          )
                        )
                      }
                      className="mt-1"
                      aria-label={`Aplicar mudança para ${talent?.name}`}
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <label
                        htmlFor={`apply-${row.applicationId}-${row.criterionId}`}
                        className="block text-sm font-medium text-foreground"
                      >
                        {talent?.name} — {criterion?.label}
                      </label>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>Estado atual:</span>
                        <CriterionStateHeadline state={previous.state} />
                        <span aria-hidden="true">→</span>
                        <CriterionStateHeadline state={row.state} />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`state-${row.applicationId}-${row.criterionId}`}
                          className="block text-xs font-medium text-foreground"
                        >
                          Estado após a resposta
                        </label>
                        <FilterNativeSelect
                          id={`state-${row.applicationId}-${row.criterionId}`}
                          value={row.state}
                          onValueChange={(value) =>
                            setRows((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, state: value as CriterionState }
                                  : entry
                              )
                            )
                          }
                        >
                          {(
                            Object.keys(
                              CRITERION_STATE_META
                            ) as CriterionState[]
                          ).map((stateKey) => (
                            <option
                              key={stateKey}
                              value={stateKey}
                            >
                              {CRITERION_STATE_META[stateKey].label}
                            </option>
                          ))}
                        </FilterNativeSelect>
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor={`note-${row.applicationId}-${row.criterionId}`}
                          className="block text-xs font-medium text-foreground"
                        >
                          Justificativa registrada
                        </label>
                        <Textarea
                          id={`note-${row.applicationId}-${row.criterionId}`}
                          rows={2}
                          value={row.note}
                          onChange={(event) =>
                            setRows((current) =>
                              current.map((entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, note: event.target.value }
                                  : entry
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {clarification.teamConditionUpdate ? (
          <Alert variant="info">
            A resposta também confirma uma condição da equipe: ela passa a
            constar como “confirmado pelo gestor” no contexto da empresa.
          </Alert>
        ) : null}

        <Alert variant="default">
          Nenhuma candidatura é rejeitada automaticamente. A conclusão anterior
          fica no histórico junto da informação que motivou a mudança.
        </Alert>
      </div>
    </Dialog>
  );
}
