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
import { COPY } from '@/features/iel-demo/copy';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getTalent } from '@/features/iel-demo/state/selectors';
import type { DemoState, Job } from '@/features/iel-demo/types';
import { apiPost } from '@/lib/api-client';

import { api } from '@workspace/routes';
import { Button } from '@workspace/ui';

import { Panel, PanelHeader } from '../shared/ui';

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

/** A demo nunca esconde de onde a frase veio, e diz isso em palavra comum. */
const ORIGIN_LABEL: Record<DisplayAnswer['origin'], string> = {
  deterministic: 'Texto montado por regra fixa, sem inteligência artificial.',
  anthropic: 'Texto gerado por um modelo de linguagem.'
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
 * Resumo da vaga, em texto. A UI chama a rota de assistente, que
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
    <Panel
      elevation={1}
      padding="sm"
      className="space-y-3"
    >
      <PanelHeader
        title={COPY.reading.label}
        hint={COPY.reading.hint}
        meta={
          selectedApplicationIds.length === 0
            ? 'Marque pessoas no detalhamento para o resumo falar delas.'
            : `Sobre: ${selectedNames}.`
        }
      />

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => runAssistant('resumir-selecao')}
        >
          Resumir
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => runAssistant('comparar-selecionados')}
        >
          Comparar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={() => runAssistant('mostrar-lacunas')}
        >
          O que falta perguntar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Montando…</p>
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
              className="iel-prose text-sm text-foreground"
            >
              {paragraph}
            </p>
          ))}
          {answer.citations.length > 0 ? (
            <p className="text-[11px] text-muted-foreground">
              De onde vem:{' '}
              {answer.citations.map((citation) => citation.label).join(', ')}.
            </p>
          ) : null}
          <p className="text-[11px] font-medium text-muted-foreground">
            {ORIGIN_LABEL[answer.origin]}
          </p>
        </div>
      ) : null}
    </Panel>
  );
}
