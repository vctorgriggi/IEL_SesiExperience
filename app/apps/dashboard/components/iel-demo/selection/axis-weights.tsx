'use client';

import {
  FIT_AXES,
  type FitAxisId
} from '@/features/iel-demo/analysis/fit-axes';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  AXIS_WEIGHT_LABEL,
  competenciasDaEmpresa,
  getAxisWeight,
  getPendingAxisWeightSuggestion,
  getWeightLearning
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { AxisWeight, Job } from '@/features/iel-demo/types';

import { toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { TEMA_NAO_PEDIDO } from '../companies/competencias-do-questionario';

const WEIGHT_OPTIONS: AxisWeight[] = ['alto', 'medio', 'baixo'];

/** Do texto para o tipo, sem asserção: a lista é a fonte da verdade. */
function lerPeso(valor: string): AxisWeight | null {
  return WEIGHT_OPTIONS.find((peso) => peso === valor) ?? null;
}

/**
 * Prioridades declaradas para uma vaga.
 *
 * O mesmo ponto do dia a dia não pesa igual em toda vaga, e a empresa é quem
 * sabe qual deles decide a rotina dela. A análise assistida propõe a partir do
 * texto da própria vaga, e os processos já encerrados apontam padrões; em
 * ambos os casos a proposta fica pendente até alguém confirmar. Peso que muda
 * sozinho é peso que ninguém consegue explicar depois.
 */
export function AxisWeights({ job }: { job: Job }) {
  const { state, dispatch } = useIelDemo();
  const learning = getWeightLearning(state, job.id);
  const pedidas = competenciasDaEmpresa(state, job.companyId);

  const setWeight = (
    axisId: FitAxisId,
    weight: AxisWeight,
    message: string
  ) => {
    dispatch({
      type: 'set-axis-weight',
      jobId: job.id,
      axisId,
      weight,
      at: nowIso()
    });
    toast.success(message);
  };

  return (
    <div className="flex flex-col gap-4">
      {learning.map((entry) => (
        <div
          key={entry.axisId}
          className="flex flex-col items-start gap-2 rounded-lg border border-dashed p-4 text-sm"
        >
          <div className="flex flex-col gap-1">
            <span className="text-base font-medium">
              Padrão observado nos processos desta vaga
            </span>
            <span className="text-muted-foreground">{entry.rationale}</span>
          </div>
          <Button
            size="sm"
            onClick={() =>
              setWeight(
                entry.axisId,
                entry.suggestedWeight,
                'Peso elevado a partir do padrão observado.'
              )
            }
          >
            Confirmar o ajuste
          </Button>
        </div>
      ))}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableCaption className="sr-only">
            Peso de cada tema nesta vaga e a proposta da análise
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead scope="col">Tema</TableHead>
              <TableHead
                scope="col"
                className="w-[160px]"
              >
                Peso nesta vaga
              </TableHead>
              <TableHead
                scope="col"
                className="w-[220px]"
              >
                Proposta da análise
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {FIT_AXES.map((axis) => {
              // Peso de um tema que a empresa não pediu não existe: a linha
              // fica, em cinza, dizendo por quê — tirá-la da tabela
              // esconderia o critério de quem lê o percentual da vaga.
              if (!pedidas.includes(axis.id)) {
                return (
                  <TableRow
                    key={axis.id}
                    className="text-muted-foreground"
                  >
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{axis.label}</span>
                    </TableCell>
                    <TableCell
                      colSpan={2}
                      className="whitespace-normal text-sm"
                    >
                      {TEMA_NAO_PEDIDO}
                    </TableCell>
                  </TableRow>
                );
              }
              const weight = getAxisWeight(job, axis.id, state);
              const suggestion = getPendingAxisWeightSuggestion(
                state,
                job,
                axis.id
              );

              return (
                <TableRow key={axis.id}>
                  <TableCell className="whitespace-normal">
                    <span className="font-medium">{axis.label}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {axis.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Label
                      className="sr-only"
                      htmlFor={`peso-${axis.id}`}
                    >
                      Definir o peso de {axis.label}
                    </Label>
                    <Select
                      value={weight}
                      onValueChange={(valor) => {
                        const escolhido = lerPeso(valor);
                        if (!escolhido) return;
                        setWeight(
                          axis.id,
                          escolhido,
                          'Peso definido pela empresa.'
                        );
                      }}
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-32"
                        id={`peso-${axis.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEIGHT_OPTIONS.map((option) => (
                          <SelectItem
                            key={option}
                            value={option}
                          >
                            {AXIS_WEIGHT_LABEL[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {suggestion ? (
                      <div className="flex flex-col items-start gap-1.5">
                        <Badge
                          variant="outline"
                          className="px-1.5 text-muted-foreground"
                        >
                          {AXIS_WEIGHT_LABEL[suggestion.weight]} ·{' '}
                          {suggestion.sourceLabel}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setWeight(
                              axis.id,
                              suggestion.weight,
                              'Peso confirmado pela empresa.'
                            )
                          }
                        >
                          Confirmar
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Confirmado
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
