'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ADHERENCE_THRESHOLD,
  type AdherenceAxisEntry
} from '@/features/iel-demo/analysis/adherence';
import { getCandidateFitOptionLabel } from '@/features/iel-demo/analysis/candidate-questionnaire';
import { getCultureQuestion } from '@/features/iel-demo/analysis/culture';
import type { FitAxisId } from '@/features/iel-demo/analysis/fit-axes';
import { AXIS_LABEL, type EstadoDeLeitura } from '@/features/iel-demo/copy';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getAdherence,
  getCultureReading,
  getFitReading,
  type CultureAxisReading,
  type FitReadingEntry
} from '@/features/iel-demo/state/selectors';
import type { Application, Job, JobCriterion } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import { Button } from '@workspace/ui';

import { CreateClarificationDialog } from '../clarifications/create-clarification-dialog';
import { FitAxisSlider } from '../instruments/fit-axis-slider';
import {
  formatDate,
  Panel,
  PanelHeader,
  SourceDot,
  SummaryRow
} from '../shared/ui';

/**
 * A palavra que a empresa usaria para descrever esta posição do eixo.
 *
 * A média da empresa é contínua (1,7, por exemplo) e as alternativas são três.
 * A frase de resumo escolhe a alternativa mais próxima, porque "A empresa:
 * 1,7" não diz nada a quem lê; o trilho, no detalhe, mostra a posição exata e
 * é lá que a aproximação pode ser conferida.
 */
function optionLabelForValue(axisId: FitAxisId, value: number): string {
  const question = getCultureQuestion(axisId);
  if (!question) return String(value);
  const closest = question.options.reduce((best, option) =>
    Math.abs(option.value - value) < Math.abs(best.value - value)
      ? option
      : best
  );
  return closest.label;
}

/** Polos nomeados do eixo, tirados do próprio questionário da empresa. */
function toPoles(axisId: FitAxisId): [string, string] {
  const question = getCultureQuestion(axisId);
  if (!question) return ['menos', 'mais'];
  const low = question.options.find((option) => option.value === 1);
  const high = question.options.find((option) => option.value === 3);
  return [low?.label ?? 'menos', high?.label ?? 'mais'];
}

/**
 * O estado de um ponto, decidido pela mesma conta que produz o percentual.
 *
 * A leitura textual (`getFitReading`) e o questionário (`getAdherence`) às
 * vezes discordam sobre quem está faltando: a pessoa pode ter uma preferência
 * registrada em texto e ainda não ter respondido as cinco perguntas. Quem
 * manda aqui é o questionário, porque é dele que sai o número do topo da
 * tela — e um ponto não pode aparecer como "combina" se não entrou na conta.
 */
function axisStatus(entry: AdherenceAxisEntry | undefined): EstadoDeLeitura {
  if (!entry || entry.companyMean === null) return 'faltando';
  if (entry.candidateValue === null) return 'sem-resposta';
  return (entry.adherence ?? 0) >= ADHERENCE_THRESHOLD ? 'combina' : 'difere';
}

/** Uma frase: o que cada lado respondeu neste ponto. */
function axisSummary(entry: AdherenceAxisEntry | undefined, axisId: FitAxisId) {
  if (!entry || entry.companyMean === null) {
    return 'A empresa ainda não tem respostas suficientes neste ponto.';
  }

  const empresa = optionLabelForValue(axisId, entry.companyMean);

  if (entry.candidateValue === null) {
    return `A empresa: ${empresa}. A pessoa ainda não respondeu.`;
  }

  const pessoa = getCandidateFitOptionLabel(axisId, entry.candidateValue);
  return `A empresa: ${empresa}. A pessoa: ${pessoa}.`;
}

/** De onde veio o que cada lado informou, em uma linha. */
function OriginLine({
  children,
  sourceId
}: {
  children: ReactNode;
  sourceId?: string;
}) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
      {sourceId ? <SourceDot sourceId={sourceId} /> : null}
      {children}
    </p>
  );
}

const CONDITION_STATUS_LABEL: Record<string, string> = {
  confirmado: 'confirmado pela empresa',
  'da-descricao': 'da descrição da vaga',
  'a-confirmar': 'a confirmar com a empresa'
};

/**
 * Critério da vaga que corresponde a este ponto do dia a dia.
 *
 * O esclarecimento existente é escrito por critério, e os critérios da base
 * demo não carregam o eixo. O casamento é por palavra-chave e pode não
 * existir — quando não existe, a tela oferece o questionário no lugar da
 * pergunta avulsa, que é o caminho que fecha o ponto de verdade.
 */
const AXIS_CRITERION_KEYWORD: Record<FitAxisId, string[]> = {
  'apoio-inicial': ['apoio'],
  autonomia: ['autonomia', 'contexto da equipe'],
  'comunicacao-prioridades': ['prioridade'],
  'ritmo-turno': ['disponibilidade', 'turno', 'horário'],
  aprendizado: ['aprendizado', 'expectativa']
};

function findAxisCriterion(job: Job, axisId: FitAxisId): JobCriterion | null {
  const keywords = AXIS_CRITERION_KEYWORD[axisId];
  return (
    job.criteria.find((criterion) =>
      keywords.some((keyword) =>
        criterion.label.toLocaleLowerCase('pt-BR').includes(keyword)
      )
    ) ?? null
  );
}

function AxisDetail({
  entry,
  adherenceAxis,
  culture,
  status,
  application,
  canAsk,
  onAsk
}: {
  entry: FitReadingEntry;
  adherenceAxis: AdherenceAxisEntry | undefined;
  culture: CultureAxisReading | undefined;
  status: EstadoDeLeitura;
  application: Application;
  /** Há um requisito desta vaga a que a pergunta avulsa possa se ligar. */
  canAsk: boolean;
  onAsk: () => void;
}) {
  const axis = entry.axis;

  return (
    <div className="space-y-3">
      <FitAxisSlider
        label={AXIS_LABEL[axis.id]}
        poles={toPoles(axis.id)}
        companyValue={adherenceAxis?.companyMean ?? null}
        candidateValue={adherenceAxis?.candidateValue ?? null}
        min={1}
        max={3}
        state={entry.state}
      />

      <div className="grid gap-x-6 gap-y-3 border-l-2 border-border pl-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="iel-eyebrow">A empresa</p>
          {entry.condition ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {entry.condition.value}
              </p>
              <OriginLine>
                {CONDITION_STATUS_LABEL[entry.condition.status] ??
                  'registro da empresa'}
                {entry.condition.updatedAt ? (
                  <span>· {formatDate(entry.condition.updatedAt)}</span>
                ) : null}
              </OriginLine>
              {/*
                A descrição da vaga diz uma coisa e o questionário da equipe
                ainda não tem gente suficiente para confirmar. Sem a segunda,
                o ponto não entra na conta — e a tela precisa dizer isso onde
                a contradição aparece, senão o texto ao lado parece resposta.
              */}
              {adherenceAxis?.companyMean === null ? (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Menos de três pessoas da equipe responderam este ponto, então
                  ele não entra no cálculo.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Menos de três respostas da equipe neste ponto.
            </p>
          )}
        </div>

        <div className="min-w-0">
          <p className="iel-eyebrow">A pessoa</p>
          {entry.preference ? (
            <>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {entry.preference.value}
              </p>
              <OriginLine sourceId={entry.preference.sourceId}>
                {entry.preference.origin}
                {entry.preference.updatedAt ? (
                  <span>· {formatDate(entry.preference.updatedAt)}</span>
                ) : null}
              </OriginLine>
            </>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Ainda não respondeu este ponto.
            </p>
          )}
        </div>
      </div>

      {culture?.state === 'divergente' ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          Gestão e equipe respondem diferente neste ponto. Vale a resposta da
          equipe: é o que a pessoa encontra no turno.
        </p>
      ) : null}

      {status === 'sem-resposta' ? (
        <div className="rounded-[var(--control-radius)] border border-border bg-muted/50 p-3">
          <p className="text-xs leading-relaxed text-foreground">
            Pergunta para fechar este ponto: “{axis.talentQuestion}”
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {canAsk ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onAsk}
              >
                Perguntar à pessoa
              </Button>
            ) : null}
            <Link
              href={routes.dashboard.iel.applications.byId(application.id).fit}
            >
              <Button
                size="sm"
                variant="ghost"
              >
                Abrir questionário (demo)
              </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Os cinco pontos do dia a dia, resumo → detalhe.
 *
 * A versão anterior era uma pilha de cinco trilhos com três blocos de texto
 * cada — a equipe informa, a pessoa declara, e um aviso vermelho de
 * divergência. Quinze parágrafos para responder "combina ou não combina".
 * Agora cada ponto é uma linha com o estado escrito ao lado e uma frase com
 * as duas respostas; o trilho, a origem e a pergunta ficam a um clique.
 */
export function FitAxesList({
  job,
  talentId,
  application
}: {
  job: Job;
  talentId: string;
  application: Application;
}) {
  const { state } = useIelDemo();
  const [askingAxis, setAskingAxis] = useState<FitAxisId | null>(null);

  const reading = getFitReading(state, job, talentId);
  const adherence = getAdherence(state, application.id);
  const culture = getCultureReading(state, job.companyId);

  const criterion = askingAxis ? findAxisCriterion(job, askingAxis) : null;

  return (
    <>
      <Panel
        elevation={1}
        padding="none"
      >
        <div className="px-5 pb-2 pt-4">
          <PanelHeader
            title="Os 5 pontos do dia a dia"
            hint="Cinco condições de trabalho que os dois lados descrevem nas mesmas palavras. Abra um ponto para ver as respostas e de onde vieram."
          />
        </div>
        <div className="px-4 pb-1">
          {reading.map((entry) => {
            const adherenceAxis = adherence?.byAxis.find(
              (axis) => axis.axisId === entry.axis.id
            );
            const status = axisStatus(adherenceAxis);

            return (
              <SummaryRow
                key={entry.axis.id}
                title={AXIS_LABEL[entry.axis.id]}
                status={status}
                summary={axisSummary(adherenceAxis, entry.axis.id)}
              >
                <AxisDetail
                  entry={entry}
                  adherenceAxis={adherenceAxis}
                  culture={culture.find(
                    (item) => item.question.axisId === entry.axis.id
                  )}
                  status={status}
                  application={application}
                  canAsk={findAxisCriterion(job, entry.axis.id) !== null}
                  onAsk={() => setAskingAxis(entry.axis.id)}
                />
              </SummaryRow>
            );
          })}
        </div>
      </Panel>

      {askingAxis && criterion ? (
        <CreateClarificationDialog
          job={job}
          criterion={criterion}
          application={application}
          visible
          onHide={() => setAskingAxis(null)}
        />
      ) : null}
    </>
  );
}
