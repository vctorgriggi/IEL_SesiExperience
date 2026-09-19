'use client';

import { useState } from 'react';
import {
  CANDIDATE_CONSENT_TEXT,
  CANDIDATE_CONSENT_VERSION,
  CANDIDATE_FIT_QUESTIONS
} from '@/features/iel-demo/analysis/candidate-questionnaire';
import type { CultureOptionValue } from '@/features/iel-demo/analysis/culture';
import type { FitAxisId } from '@/features/iel-demo/analysis/fit-axes';
import { AXIS_LABEL } from '@/features/iel-demo/copy';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getFitResponse,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { Alert, Button, Checkbox, cn } from '@workspace/ui';

import { TalentTransparency } from '../clarifications/talent-transparency';
import { Chip } from '../shared/ui';

/**
 * Questionário de fit do candidato, com o aceite que o abre (M3 + M7).
 *
 * ## Base legal
 *
 * O tratamento das respostas tem como base o **consentimento do titular** —
 * LGPD, art. 7º: "O tratamento de dados pessoais somente poderá ser realizado
 * nas seguintes hipóteses: I - mediante o fornecimento de consentimento pelo
 * titular". Por isso o passo 0 é uma tela inteira, o aceite nasce desmarcado
 * e sem ele o questionário não abre — consentimento marcado de antemão não é
 * inequívoco.
 *
 * O texto apresentado é o de `CANDIDATE_CONSENT_TEXT` e cobre o que o art. 9º
 * manda informar: "O titular tem direito ao acesso facilitado às informações
 * sobre o tratamento de seus dados, que deverão ser disponibilizadas de forma
 * clara, adequada e ostensiva acerca de, entre outras características
 * previstas em regulamentação para o atendimento do princípio do livre
 * acesso: I - finalidade específica do tratamento; II - forma e duração do
 * tratamento (...); V - informações acerca do uso compartilhado de dados pelo
 * controlador e a finalidade; (...) VII - direitos do titular, com menção
 * explícita aos direitos contidos no art. 18 desta Lei". Esta tela apresenta
 * esse texto; não o reescreve, porque a versão aceita é gravada junto da
 * resposta e precisa ser a mesma que a pessoa leu.
 *
 * ## O que a tela não mostra
 *
 * **Nunca o nome da empresa.** R5, dito duas vezes na reunião: antes da
 * entrevista o candidato vê atividade, localidade, segmento e turno. Todo o
 * cabeçalho sai de `getCandidateJobView`, que é um tipo fechado de quatro
 * campos justamente para que nenhum outro caminho deixe o nome escapar. Há um
 * teste e2e que falha se ele aparecer.
 *
 * ## Desenho
 *
 * Coluna única e estreita, uma pergunta por vez, alvos grandes: o público é
 * operacional, responde pelo celular e tem baixo letramento digital. A casca
 * do produto permanece porque a demonstração é conduzida de dentro dela; o
 * conteúdo é que se estreita.
 */

/** Um passo do fluxo: o aceite, as cinco perguntas, a confirmação. */
type Step = { kind: 'consent' } | { kind: 'question'; index: number };

type Answers = Partial<Record<FitAxisId, CultureOptionValue>>;

const TOTAL_QUESTIONS = CANDIDATE_FIT_QUESTIONS.length;

/** Bloco do texto de aceite: um rótulo curto e o parágrafo, sem juridiquês. */
function ConsentItem({ label, children }: { label: string; children: string }) {
  return (
    <div>
      <p className="iel-eyebrow">{label}</p>
      <p className="mt-1 text-base leading-relaxed text-foreground">
        {children}
      </p>
    </div>
  );
}

export function FitQuestionnaireScreen({
  applicationId
}: {
  applicationId: string;
}) {
  const { state, dispatch } = useIelDemo();
  const existing = getFitResponse(state, applicationId);

  const [step, setStep] = useState<Step>({ kind: 'consent' });
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  // Quem já respondeu abre direto na confirmação. "Responder novamente" é
  // permitido porque a ação é idempotente por candidatura: uma pessoa tem
  // uma resposta, não duas.
  const [finished, setFinished] = useState(existing !== null);
  const [showTransparency, setShowTransparency] = useState(false);

  const application = getApplication(state, applicationId);
  const jobView = getCandidateJobView(state, applicationId);
  const talent = application ? getTalent(application.talentId) : null;

  if (!application || !jobView) {
    return (
      <Alert variant="destructive">
        Candidatura não encontrada nesta base de demonstração.
      </Alert>
    );
  }

  const restart = () => {
    setAnswers({});
    setAccepted(false);
    setStep({ kind: 'consent' });
    setFinished(false);
    setShowTransparency(false);
  };

  const submit = () => {
    const complete = CANDIDATE_FIT_QUESTIONS.every(
      (question) => answers[question.axisId] !== undefined
    );
    if (!complete) return;

    dispatch({
      type: 'answer-fit-questionnaire',
      applicationId,
      answers: answers as Record<FitAxisId, CultureOptionValue>,
      consentVersion: CANDIDATE_CONSENT_VERSION,
      at: nowIso()
    });
    setFinished(true);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      {/*
        Cabeçalho da vaga como o candidato pode vê-la: atividade, localidade,
        segmento e turno. Nada além disso sai de `getCandidateJobView`.
      */}
      <header className="space-y-2 border-b border-border pb-4">
        <p className="iel-eyebrow">Questionário da vaga</p>
        <h1 className="iel-display text-[1.375rem] leading-tight text-foreground">
          Como você prefere trabalhar?
        </h1>
        <p className="text-sm font-medium text-foreground">
          Vaga de {jobView.activity}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip>{jobView.location}</Chip>
          <Chip>{jobView.sector}</Chip>
          <Chip>{jobView.shift}</Chip>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          São 5 perguntas, sem resposta certa. O nome da empresa aparece para
          você só a partir da entrevista.
        </p>
      </header>

      {finished ? (
        <div className="space-y-5">
          <div className="rounded-[var(--card-radius)] border border-success/40 bg-success/[0.06] p-5">
            <h2 className="iel-display text-[1.125rem] leading-snug text-foreground">
              Respostas registradas
            </h2>
            <p className="mt-2 text-base leading-relaxed text-foreground">
              Você não precisa fazer mais nada agora.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              O IEL vai usar suas respostas só nesta vaga, para ver o quanto
              você combina com o jeito de trabalhar da empresa. Se o seu
              currículo for enviado, a empresa vê esse resultado por ponto —
              nunca as suas respostas uma a uma.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Se quiser mudar alguma resposta, pode responder de novo: fica
              valendo a última.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              className="min-h-12 w-full text-base"
              variant="outline"
              aria-expanded={showTransparency}
              onClick={() => setShowTransparency((value) => !value)}
            >
              Ver o que está registrado sobre você
            </Button>
            <Button
              className="min-h-12 w-full text-base"
              variant="ghost"
              onClick={restart}
            >
              Responder novamente
            </Button>
          </div>

          {showTransparency && talent ? (
            <TalentTransparency talentId={talent.id} />
          ) : null}
        </div>
      ) : step.kind === 'consent' ? (
        <section
          aria-labelledby="consent-title"
          className="space-y-5"
        >
          <h2
            id="consent-title"
            className="iel-display text-[1.125rem] leading-snug text-foreground"
          >
            {CANDIDATE_CONSENT_TEXT.title}
          </h2>

          <div className="space-y-4 rounded-[var(--card-radius)] border border-border bg-card p-4">
            <ConsentItem label="Para quê">
              {CANDIDATE_CONSENT_TEXT.purpose}
            </ConsentItem>
            <ConsentItem label="O que é coletado">
              {CANDIDATE_CONSENT_TEXT.collected}
            </ConsentItem>
            <ConsentItem label="Quem vê">
              {CANDIDATE_CONSENT_TEXT.whoSees}
            </ConsentItem>
            <ConsentItem label="Por quanto tempo">
              {CANDIDATE_CONSENT_TEXT.retention}
            </ConsentItem>
            <ConsentItem label="Seus direitos">
              {CANDIDATE_CONSENT_TEXT.rights}
            </ConsentItem>
          </div>

          <label
            htmlFor="fit-consent"
            className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--control-radius)] border border-border p-3 text-base leading-relaxed text-foreground"
          >
            <Checkbox
              inputId="fit-consent"
              className="mt-1 size-5"
              checked={accepted}
              onCheckedChange={setAccepted}
            />
            Li e aceito
          </label>

          <Button
            className="min-h-12 w-full text-base"
            disabled={!accepted}
            onClick={() => setStep({ kind: 'question', index: 0 })}
          >
            Começar
          </Button>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Versão do aceite: {CANDIDATE_CONSENT_TEXT.version}. Sem o aceite o
            questionário não abre.
          </p>
        </section>
      ) : (
        (() => {
          const question = CANDIDATE_FIT_QUESTIONS[step.index];
          if (!question) return null;
          const chosen = answers[question.axisId];
          const isLast = step.index === TOTAL_QUESTIONS - 1;

          return (
            <section
              aria-labelledby="question-title"
              className="space-y-5"
            >
              <div className="space-y-2">
                <p
                  className="iel-eyebrow"
                  aria-live="polite"
                >
                  {step.index + 1} de {TOTAL_QUESTIONS} ·{' '}
                  {AXIS_LABEL[question.axisId]}
                </p>
                <span
                  aria-hidden="true"
                  className="block h-1 w-full overflow-hidden rounded-[var(--radius-pill)] bg-muted"
                >
                  <span
                    className="block h-full rounded-[var(--radius-pill)] bg-primary"
                    style={{
                      width: `${((step.index + 1) / TOTAL_QUESTIONS) * 100}%`
                    }}
                  />
                </span>
                <h2
                  id="question-title"
                  className="iel-display text-[1.125rem] leading-snug text-foreground"
                >
                  {question.prompt}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {question.hint}
                </p>
              </div>

              <div
                role="radiogroup"
                aria-labelledby="question-title"
                className="space-y-3"
              >
                {question.options.map((option) => {
                  const selected = chosen === option.value;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.axisId]: option.value
                        }))
                      }
                      className={cn(
                        'flex min-h-12 w-full items-center gap-3 rounded-[var(--card-radius)] border p-4 text-left text-base leading-relaxed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                        selected
                          ? 'border-primary bg-accent/60 text-foreground'
                          : 'border-border bg-card text-foreground hover:bg-muted'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'grid size-5 shrink-0 place-items-center rounded-full border-2',
                          selected ? 'border-primary' : 'border-border-strong'
                        )}
                      >
                        {selected ? (
                          <span className="size-2.5 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button
                  className="min-h-12 flex-1 text-base"
                  variant="outline"
                  onClick={() =>
                    setStep(
                      step.index === 0
                        ? { kind: 'consent' }
                        : { kind: 'question', index: step.index - 1 }
                    )
                  }
                >
                  Voltar
                </Button>
                <Button
                  className="min-h-12 flex-1 text-base"
                  disabled={chosen === undefined}
                  onClick={() => {
                    if (isLast) {
                      submit();
                      return;
                    }
                    setStep({ kind: 'question', index: step.index + 1 });
                  }}
                >
                  {isLast ? 'Enviar respostas' : 'Próxima'}
                </Button>
              </div>
            </section>
          );
        })()
      )}
    </div>
  );
}
