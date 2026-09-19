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

import { Textarea, toast } from '@workspace/ui';
import { Button } from '@workspace/ui/shadcn/button';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/shadcn/dialog';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';

import { CriterionStateHeadline } from '../shared/criterion-state-badge';

type Row = IncorporationDecision & { apply: boolean };

/**
 * Os estados possíveis, escritos por extenso.
 *
 * Vem de uma lista literal e não de `Object.keys`, que devolveria `string[]`
 * e exigiria uma conversão de tipo para voltar a ser `CriterionState`. Aqui o
 * compilador reclama se o glossário ganhar um estado e esta lista não.
 */
const ESTADOS: CriterionState[] = [
  'alinhamento',
  'a-esclarecer',
  'divergencia',
  'sem-informacao',
  'nao-se-aplica'
];

/**
 * Incorporação da resposta: a sugestão vem da análise assistida, mas o estado
 * final de cada critério é confirmado pelo analista.
 *
 * Nada aqui decide sozinho. A caixa nasce marcada porque a sugestão costuma
 * estar certa, e o analista desmarca o que não aceita — mas a mudança só
 * acontece no botão, e a conclusão anterior fica no histórico junto da
 * informação que a motivou.
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
      open={visible}
      onOpenChange={(open) => {
        if (!open) onHide();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Incorporar a resposta à análise</DialogTitle>
          <DialogDescription>
            {job.title} · resposta de {clarification.recipient.name}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          <div className="space-y-1 rounded-lg border bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Pergunta
            </p>
            <p className="text-sm text-foreground">{clarification.question}</p>
            <p className="pt-2 text-xs font-medium text-muted-foreground">
              Resposta registrada
            </p>
            <p className="text-sm text-foreground">“{clarification.answer}”</p>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-lg border p-3 text-sm text-muted-foreground">
              Esta resposta não traz informação suficiente para alterar
              critérios. A lacuna permanece registrada e nenhuma candidatura é
              penalizada.
            </p>
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
                const aplicarId = `apply-${row.applicationId}-${row.criterionId}`;
                const estadoId = `state-${row.applicationId}-${row.criterionId}`;
                const notaId = `note-${row.applicationId}-${row.criterionId}`;

                return (
                  <li
                    key={`${row.applicationId}-${row.criterionId}`}
                    className="space-y-2 rounded-lg border p-3"
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id={aplicarId}
                        checked={row.apply}
                        onCheckedChange={(checked) =>
                          setRows((current) =>
                            current.map((entry, entryIndex) =>
                              entryIndex === index
                                ? { ...entry, apply: checked === true }
                                : entry
                            )
                          )
                        }
                        className="mt-1"
                        aria-label={`Aplicar mudança para ${talent?.name}`}
                      />
                      <div className="min-w-0 flex-1 space-y-2">
                        <Label
                          htmlFor={aplicarId}
                          className="text-sm"
                        >
                          {talent?.name} — {criterion?.label}
                        </Label>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Estado atual:</span>
                          <CriterionStateHeadline state={previous.state} />
                          <span aria-hidden="true">→</span>
                          <CriterionStateHeadline state={row.state} />
                        </div>

                        <div className="space-y-1.5">
                          <Label
                            htmlFor={estadoId}
                            className="text-xs"
                          >
                            Estado após a resposta
                          </Label>
                          <Select
                            value={row.state}
                            onValueChange={(value) => {
                              const proximo = ESTADOS.find(
                                (estado) => estado === value
                              );
                              if (!proximo) return;
                              setRows((current) =>
                                current.map((entry, entryIndex) =>
                                  entryIndex === index
                                    ? { ...entry, state: proximo }
                                    : entry
                                )
                              );
                            }}
                          >
                            <SelectTrigger id={estadoId}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS.map((estado) => (
                                <SelectItem
                                  key={estado}
                                  value={estado}
                                >
                                  {CRITERION_STATE_META[estado].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label
                            htmlFor={notaId}
                            className="text-xs"
                          >
                            Justificativa registrada
                          </Label>
                          <Textarea
                            id={notaId}
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
            <p className="rounded-lg border p-3 text-sm text-muted-foreground">
              A resposta também confirma uma condição da equipe: ela passa a
              constar como “confirmado pelo gestor” no contexto da empresa.
            </p>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Nenhuma candidatura é rejeitada automaticamente. A conclusão
            anterior fica no histórico junto da informação que motivou a
            mudança.
          </p>
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
