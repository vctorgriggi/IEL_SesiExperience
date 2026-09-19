'use client';

import { useState } from 'react';
import {
  compareSelection,
  missingInformation,
  summarizeSelection,
  type AssistantAnswer
} from '@/features/iel-demo/analysis/assistant';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getTalent } from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';
import { AiBrain01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@workspace/ui';

type AssistantPanelProps = {
  job: Job;
  selectedApplicationIds: string[];
};

/**
 * Análise assistida no contexto da vaga. As respostas são montadas a partir dos
 * registros selecionados; não é um chat aberto nem uma chamada a LLM.
 */
export function AssistantPanel({
  job,
  selectedApplicationIds
}: AssistantPanelProps) {
  const { state } = useIelDemo();
  const [answer, setAnswer] = useState<AssistantAnswer | null>(null);

  const selectedNames = selectedApplicationIds
    .map((applicationId) => {
      const application = state.applications.find(
        (entry) => entry.id === applicationId
      );
      const talent = application ? getTalent(application.talentId) : null;
      return talent?.name;
    })
    .filter(Boolean)
    .join(', ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HugeiconsIcon
            icon={AiBrain01Icon}
            size={18}
            aria-hidden="true"
          />
          Análise assistida — {job.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {selectedApplicationIds.length === 0
            ? 'Nenhuma candidatura selecionada. As respostas usam exatamente os registros marcados na matriz.'
            : `Registros em uso: ${selectedNames}.`}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setAnswer(summarizeSelection(state, job, selectedApplicationIds))
            }
          >
            Resumir esta seleção
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setAnswer(compareSelection(state, job, selectedApplicationIds))
            }
          >
            Comparar os selecionados
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setAnswer(missingInformation(state, job, selectedApplicationIds))
            }
          >
            Mostrar o que falta esclarecer
          </Button>
        </div>

        {answer ? (
          <div className="space-y-2 rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
            <p className="text-sm font-semibold text-foreground">
              {answer.title}
            </p>
            {answer.paragraphs.map((paragraph, index) => (
              <p
                key={`${answer.title}-${index}`}
                className="text-sm text-foreground"
              >
                {paragraph}
              </p>
            ))}
            {answer.usedRecords.length > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Registros consultados: {answer.usedRecords.join(', ')}.
              </p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              {answer.disclaimer}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
