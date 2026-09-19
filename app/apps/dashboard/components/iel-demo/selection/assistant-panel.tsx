'use client';

import { useState } from 'react';
import { buildAssistantRequestPayload } from '@/features/iel-demo/ai/build-request';
import type {
  AssistantKind,
  AssistantResponse
} from '@/features/iel-demo/ai/types';
import {
  compareSelection,
  missingInformation,
  summarizeSelection,
  type AssistantAnswer
} from '@/features/iel-demo/analysis/assistant';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getTalent } from '@/features/iel-demo/state/selectors';
import type { DemoState, Job } from '@/features/iel-demo/types';
import { apiPost } from '@/lib/api-client';
import { AiBrain01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { api } from '@workspace/routes';
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

type DisplayAnswer = {
  title: string | null;
  text: string;
  citations: { evidenceId: string; label: string }[];
  origin: 'deterministic' | 'anthropic';
};

/** Rótulo discreto de origem, exigido pelo briefing: a demo nunca esconde de onde a resposta veio. */
const ORIGIN_LABEL: Record<DisplayAnswer['origin'], string> = {
  deterministic: 'Resposta preparada (determinística)',
  anthropic: 'Resposta gerada por modelo'
};

function toDisplayAnswer(
  state: DemoState,
  answer: AssistantAnswer
): DisplayAnswer {
  return {
    title: answer.title,
    text: [...answer.paragraphs, answer.disclaimer].join('\n\n'),
    citations: answer.usedRecords.map((evidenceId) => ({
      evidenceId,
      label:
        state.evidences.find((evidence) => evidence.id === evidenceId)
          ?.originLabel ?? evidenceId
    })),
    origin: 'deterministic'
  };
}

function fromAssistantResponse(response: AssistantResponse): DisplayAnswer {
  return {
    title: null,
    text: response.text,
    citations: response.citations,
    origin: response.provider
  };
}

/** Fallback local quando a rota está indisponível: a demo nunca deve travar. */
function runLocalFallback(
  state: DemoState,
  job: Job,
  kind: AssistantKind,
  applicationIds: string[]
): AssistantAnswer {
  switch (kind) {
    case 'resumir-selecao':
      return summarizeSelection(state, job, applicationIds);
    case 'comparar-selecionados':
      return compareSelection(state, job, applicationIds);
    case 'mostrar-lacunas':
      return missingInformation(state, job, applicationIds);
  }
}

/**
 * Análise assistida no contexto da vaga. A UI chama a rota de assistente, que
 * decide entre o provider determinístico (padrão) e um modelo real, conforme
 * o ambiente do servidor. Em erro de rede, cai para o cálculo local — a
 * demonstração nunca deve travar por causa disso.
 */
export function AssistantPanel({
  job,
  selectedApplicationIds
}: AssistantPanelProps) {
  const { state } = useIelDemo();
  const [answer, setAnswer] = useState<DisplayAnswer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function runAssistant(kind: AssistantKind) {
    setIsLoading(true);
    setError(null);
    try {
      const payload = buildAssistantRequestPayload(
        state,
        job.id,
        selectedApplicationIds,
        kind
      );
      const response = await apiPost<AssistantResponse>(
        api.iel.assistant(),
        payload
      );
      if (!response) throw new Error('Resposta vazia da rota de assistente.');
      setAnswer(fromAssistantResponse(response));
    } catch {
      setError(
        'Não foi possível consultar a rota de assistente. Mostrando a resposta determinística local.'
      );
      const localAnswer = runLocalFallback(
        state,
        job,
        kind,
        selectedApplicationIds
      );
      setAnswer(toDisplayAnswer(state, localAnswer));
    } finally {
      setIsLoading(false);
    }
  }

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
            disabled={isLoading}
            onClick={() => runAssistant('resumir-selecao')}
          >
            Resumir esta seleção
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => runAssistant('comparar-selecionados')}
          >
            Comparar os selecionados
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={() => runAssistant('mostrar-lacunas')}
          >
            Mostrar o que falta esclarecer
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Consultando…</p>
        ) : null}

        {error ? <p className="text-[11px] text-destructive">{error}</p> : null}

        {answer && !isLoading ? (
          <div className="space-y-2 rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
            {answer.title ? (
              <p className="text-sm font-semibold text-foreground">
                {answer.title}
              </p>
            ) : null}
            {answer.text.split('\n\n').map((paragraph, index) => (
              <p
                key={`${answer.origin}-${index}-${paragraph.slice(0, 24)}`}
                className="text-sm text-foreground"
              >
                {paragraph}
              </p>
            ))}
            {answer.citations.length > 0 ? (
              <p className="text-[11px] text-muted-foreground">
                Registros consultados:{' '}
                {answer.citations.map((citation) => citation.label).join(', ')}.
              </p>
            ) : null}
            <p className="text-[11px] font-medium text-muted-foreground">
              {ORIGIN_LABEL[answer.origin]}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
