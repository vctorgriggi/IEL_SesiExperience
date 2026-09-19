'use client';

import { useState } from 'react';
import {
  CULTURE_QUESTIONS,
  type CultureOptionId
} from '@/features/iel-demo/analysis/culture';
import { CULTURE_CONSENT_VERSION } from '@/features/iel-demo/analysis/culture-invites';
import type { FitAxisId } from '@/features/iel-demo/analysis/fit-axes';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getInviteByToken } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { Button, Checkbox, cn } from '@workspace/ui';

import { formatDate } from '../shared/ui';

/**
 * A tela de quem trabalha na empresa e recebeu o link (M2 + M7).
 *
 * Responde uma pergunta — "como é trabalhar aqui?" — em cinco telas, uma
 * pergunta por vez, sem login. Quem abre isto é um colaborador operacional no
 * celular, no intervalo do turno: os alvos são grandes, o texto é curto e não
 * há nada para configurar.
 *
 * ## O que a tela não mostra (PRODUTO.md §5)
 *
 * **Ninguém mais.** Não há lista de colegas, contagem de quem já respondeu
 * nem média parcial. Quem responde sobre o próprio ambiente de trabalho não
 * pode ver — nem ser visto por — os outros respondentes; a empresa recebe a
 * média, nunca "fulano respondeu isto".
 *
 * **Nem o próprio e-mail.** `getInviteByToken` devolve só o primeiro nome, a
 * empresa e o prazo. Um link vazado não vira vazamento de dado pessoal.
 *
 * ## Base legal
 *
 * Consentimento (LGPD, art. 7º, I): o aceite é o passo 0, nasce desmarcado e
 * sem ele o questionário não abre. A versão do texto vai gravada junto da
 * resposta — sem ela não há como demonstrar a que a pessoa consentiu.
 */

/** Um passo do fluxo: o aceite, as cinco perguntas, a confirmação. */
type Step = { kind: 'consent' } | { kind: 'question'; index: number };

type Answers = Partial<Record<FitAxisId, CultureOptionId>>;

const TOTAL_QUESTIONS = CULTURE_QUESTIONS.length;

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

/** Tela sem formulário: o link já foi usado, venceu ou não existe. */
function InviteNotice({
  title,
  children
}: {
  title: string;
  children: string;
}) {
  return (
    <section className="rounded-[var(--card-radius)] border border-border bg-card p-5">
      <h2 className="iel-display text-[1.125rem] leading-snug text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        {children}
      </p>
    </section>
  );
}

export function CultureInviteScreen({ token }: { token: string }) {
  const { state, dispatch } = useIelDemo();
  const invite = getInviteByToken(state, token);

  const [step, setStep] = useState<Step>({ kind: 'consent' });
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [finished, setFinished] = useState(false);

  const submit = (final: Answers) => {
    const complete = CULTURE_QUESTIONS.every(
      (question) => final[question.axisId] !== undefined
    );
    if (!complete) return;

    dispatch({
      type: 'answer-culture-invite',
      token,
      answers: final as Record<FitAxisId, CultureOptionId>,
      consentVersion: CULTURE_CONSENT_VERSION,
      at: nowIso()
    });
    setFinished(true);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <header className="space-y-2 border-b border-border pb-4">
        <p className="iel-eyebrow">Consulta aos colaboradores</p>
        <h1 className="iel-display text-[1.375rem] leading-tight text-foreground">
          Como é trabalhar aqui?
        </h1>
        {invite ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {invite.firstName}, são 5 perguntas sobre o dia a dia na{' '}
            {invite.companyName}. Responda até {formatDate(invite.expiresAt)}.
          </p>
        ) : null}
      </header>

      {!invite ? (
        <InviteNotice title="Link não encontrado">
          Este endereço não corresponde a nenhuma consulta. Confira o link que
          você recebeu por e-mail.
        </InviteNotice>
      ) : finished || invite.status === 'respondido' ? (
        <section className="rounded-[var(--card-radius)] border border-success/40 bg-success/[0.06] p-5">
          <h2 className="iel-display text-[1.125rem] leading-snug text-foreground">
            Resposta registrada
          </h2>
          <p className="mt-2 text-base leading-relaxed text-foreground">
            Você não precisa fazer mais nada. Obrigado.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sua resposta entra na média da empresa. Ninguém vê o que você
            respondeu, nem a sua gestão.
          </p>
        </section>
      ) : invite.status === 'expirado' ? (
        <InviteNotice title="Este link venceu">
          O prazo para responder era de 3 dias e já passou. Peça um link novo a
          quem enviou o convite.
        </InviteNotice>
      ) : step.kind === 'consent' ? (
        <section
          aria-labelledby="consent-title"
          className="space-y-5"
        >
          <h2
            id="consent-title"
            className="iel-display text-[1.125rem] leading-snug text-foreground"
          >
            Antes de começar
          </h2>

          <div className="space-y-4 rounded-[var(--card-radius)] border border-border bg-card p-4">
            <ConsentItem label="Para quê">
              Suas respostas entram na média que descreve como se trabalha na
              empresa. Ela é comparada com o que cada candidato procura.
            </ConsentItem>
            <ConsentItem label="O que é coletado">
              Só o seu nome e o seu e-mail corporativo, que já estavam no
              convite. Nada sobre você fora do trabalho.
            </ConsentItem>
            <ConsentItem label="Quem vê">
              A empresa vê a média de todo mundo. Ninguém vê o que você
              respondeu, nem a sua gestão.
            </ConsentItem>
            <ConsentItem label="Por quanto tempo">
              O link vale 3 dias e serve uma vez só. Depois disso ele não abre
              mais.
            </ConsentItem>
          </div>

          <label
            htmlFor="culture-consent"
            className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--control-radius)] border border-border p-3 text-base leading-relaxed text-foreground"
          >
            <Checkbox
              inputId="culture-consent"
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
            Versão do aceite: {CULTURE_CONSENT_VERSION}. Sem o aceite o
            questionário não abre.
          </p>
        </section>
      ) : (
        (() => {
          const question = CULTURE_QUESTIONS[step.index];
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
                  {step.index + 1} de {TOTAL_QUESTIONS}
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
                  Responda pelo que acontece hoje, não pelo que deveria
                  acontecer.
                </p>
              </div>

              <div
                role="radiogroup"
                aria-labelledby="question-title"
                className="space-y-3"
              >
                {question.options.map((option) => {
                  const selected = chosen === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.axisId]: option.id
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
                      submit(answers);
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
