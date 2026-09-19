'use client';

import { useState } from 'react';
import { CULTURE_CONSENT_VERSION } from '@/features/iel-demo/analysis/culture-invites';
import {
  ESCALA_CONCORDANCIA,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getInviteByToken } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import { Card, CardContent } from '@workspace/ui/shadcn/card';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import { Label } from '@workspace/ui/shadcn/label';
import { Progress } from '@workspace/ui/shadcn/progress';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/shadcn/radio-group';

import { useFocoNoTitulo } from '../shared/use-foco-no-titulo';

/**
 * A tela de quem trabalha na empresa e recebeu o link (M2 + M7).
 *
 * Responde uma pergunta — "como é trabalhar aqui?" — pelas frases do bloco
 * daquele convite (cerca de 15 das 52 do instrumento, amostragem em matriz),
 * uma frase por tela, na escala de concordância, sem login. Quem abre isto é um colaborador operacional no
 * celular, no intervalo do turno: uma pergunta por vez, alternativas de 60px,
 * um botão só e nada para configurar. A tela cabe em 390px sem rolagem.
 *
 * ## O que a tela não mostra (PRODUTO.md §5)
 *
 * **Ninguém mais.** Não há lista de colegas, contagem de quem já respondeu
 * nem média parcial. Quem responde sobre o próprio ambiente de trabalho não
 * pode ver — nem ser visto por — os outros respondentes; a empresa recebe a
 * média, nunca "fulano respondeu isto".
 *
 * **Nem o próprio nome ou e-mail.** `getInviteByToken` devolve só a empresa,
 * o prazo e a situação — o convite nem guarda nome. A tela se apresenta como
 * "Consulta à equipe · empresa", não como "Oi, fulano". Um link vazado não
 * vira vazamento de dado pessoal.
 *
 * ## Base legal
 *
 * Consentimento (LGPD, art. 7º, I): o aceite é o passo 0, nasce desmarcado e
 * sem ele o questionário não abre. A versão do texto vai gravada junto da
 * resposta — sem ela não há como demonstrar a que a pessoa consentiu.
 */

/** Um passo do fluxo: o aceite, as frases do bloco, a confirmação. */
type Step = { kind: 'consent' } | { kind: 'question'; index: number };

type Answers = Partial<Record<string, ValorDaEscala>>;

/** "15/09": o prazo como a frase do rodapé o diz. */
function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** Tela sem formulário: o link já foi usado, venceu ou não existe. */
function InviteNotice({
  title,
  tituloRef,
  children
}: {
  title: string;
  tituloRef?: React.Ref<HTMLHeadingElement>;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <h1
          ref={tituloRef}
          tabIndex={-1}
          className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
        >
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
      </CardContent>
    </Card>
  );
}

export function CultureInviteScreen({ token }: { token: string }) {
  const { state, dispatch } = useIelDemo();
  const invite = getInviteByToken(state, token);

  const [step, setStep] = useState<Step>({ kind: 'consent' });
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [finished, setFinished] = useState(false);

  // Passo novo, tela nova, mesma URL: o foco vai para o título do passo, para
  // o leitor de tela anunciar a pergunta (ou "Resposta registrada") em vez de
  // voltar ao topo da página.
  const tituloRef = useFocoNoTitulo<HTMLHeadingElement>(
    finished
      ? 'fim'
      : step.kind === 'question'
        ? `pergunta-${step.index}`
        : step.kind
  );

  const bloco = invite?.bloco ?? [];
  const totalQuestions = bloco.length;

  const submit = (final: Answers) => {
    const completas: Record<string, ValorDaEscala> = {};
    for (const item of bloco) {
      const valor = final[item.id];
      if (valor === undefined) return;
      completas[item.id] = valor;
    }

    dispatch({
      type: 'answer-culture-invite',
      token,
      answers: completas,
      consentVersion: CULTURE_CONSENT_VERSION,
      at: nowIso()
    });
    setFinished(true);
  };

  const rodape = invite
    ? `Suas respostas entram só na média da empresa. Ninguém vê a sua resposta individual. Link válido até ${shortDate(invite.expiresAt)}.`
    : 'Suas respostas entram só na média da empresa. Ninguém vê a sua resposta individual.';

  return (
    // A casca por link já imprime o quadrado "IEL"; aqui fica o resto da
    // linha de topo — o que a pessoa está respondendo e para quem.
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-6 px-1 py-6">
      <p className="text-sm font-medium">
        Consulta à equipe
        {invite ? (
          <span className="text-muted-foreground"> · {invite.companyName}</span>
        ) : null}
      </p>

      {!invite ? (
        <InviteNotice title="Link não encontrado">
          Este endereço não corresponde a nenhuma consulta. Confira o link que
          você recebeu por e-mail.
        </InviteNotice>
      ) : finished || invite.status === 'respondido' ? (
        <InviteNotice
          title="Resposta registrada"
          tituloRef={tituloRef}
        >
          Você não precisa fazer mais nada, obrigado. Sua resposta entra na
          média da empresa: ninguém vê o que você respondeu, nem a sua gestão.
        </InviteNotice>
      ) : invite.status === 'expirado' ? (
        <InviteNotice title="Este link venceu">
          O prazo para responder era de 3 dias e já passou. Peça um link novo a
          quem enviou o convite.
        </InviteNotice>
      ) : step.kind === 'consent' ? (
        <section className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1
              ref={tituloRef}
              tabIndex={-1}
              className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
            >
              Como é trabalhar aqui?
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              São {totalQuestions} frases sobre o dia a dia na{' '}
              {invite.companyName}. Para cada uma, diga o quanto concorda. Leva
              uns 5 minutos.
            </p>
          </div>

          <Card>
            <CardContent className="flex flex-col gap-3 text-sm leading-relaxed">
              <p>
                <span className="font-medium">Para quê.</span> Suas respostas
                entram na média que descreve como se trabalha na empresa, que é
                comparada com o que cada candidato procura.
              </p>
              <p>
                <span className="font-medium">O que é coletado.</span> Coletamos
                só seu e-mail corporativo, área e papel, que já estavam no
                convite, e o quanto você concorda com cada frase. Seu nome não é
                pedido.
              </p>
              <p>
                <span className="font-medium">Quem vê.</span> A empresa vê a
                média de todo mundo. Ninguém vê a sua resposta, nem a sua
                gestão.
              </p>
              <p>
                <span className="font-medium">Por quanto tempo.</span> O link
                vale 3 dias e serve uma vez só.
              </p>
            </CardContent>
          </Card>

          <Label
            htmlFor="culture-consent"
            className="flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border p-4 text-[15px] font-medium"
          >
            <Checkbox
              id="culture-consent"
              aria-describedby="culture-consent-ajuda"
              className="size-[18px]"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            Li e aceito
          </Label>

          <div className="mt-auto flex flex-col gap-3">
            <Button
              size="lg"
              className="h-12 w-full text-[15px]"
              disabled={!accepted}
              onClick={() => setStep({ kind: 'question', index: 0 })}
            >
              Começar
            </Button>
            <p
              id="culture-consent-ajuda"
              className="text-center text-xs leading-relaxed text-muted-foreground"
            >
              Versão do aceite: {CULTURE_CONSENT_VERSION}. Sem o aceite o
              questionário não abre.
            </p>
          </div>
        </section>
      ) : (
        (() => {
          const question = bloco[step.index];
          if (!question) return null;
          const chosen = answers[question.id];
          const isLast = step.index === totalQuestions - 1;
          const rotuloProgresso = `Frase ${step.index + 1} de ${totalQuestions}`;
          const valorProgresso = Math.round(
            ((step.index + 1) / totalQuestions) * 100
          );

          return (
            <section className="flex flex-1 flex-col gap-6">
              <div className="flex flex-col gap-2">
                {/* O número da pergunta é lido no título, que recebe o foco. */}
                <div
                  className="flex justify-between text-[13px] text-muted-foreground"
                  aria-hidden="true"
                >
                  <span>{rotuloProgresso}</span>
                  <span>uns 5 min</span>
                </div>
                <Progress
                  className="h-1.5 bg-muted"
                  value={valorProgresso}
                  // O `Progress` do kit não repassa `value` ao Radix.
                  aria-valuenow={valorProgresso}
                  aria-label={rotuloProgresso}
                  aria-valuetext={rotuloProgresso}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <h1
                  id="consulta-pergunta"
                  ref={tituloRef}
                  tabIndex={-1}
                  className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
                >
                  <span className="sr-only">{rotuloProgresso}: </span>
                  {question.texto}
                </h1>
                <p
                  id="consulta-pergunta-dica"
                  className="text-sm leading-relaxed text-muted-foreground"
                >
                  O quanto você concorda? Responda pelo que vale de verdade no
                  seu dia a dia, não pelo que deveria ser.
                </p>
              </div>

              <RadioGroup
                aria-labelledby="consulta-pergunta"
                aria-describedby="consulta-pergunta-dica"
                className="gap-2.5"
                value={chosen === undefined ? '' : String(chosen)}
                onValueChange={(value) => {
                  const option = ESCALA_CONCORDANCIA.find(
                    (entry) => String(entry.valor) === value
                  );
                  if (!option) return;
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: option.valor
                  }));
                }}
              >
                {ESCALA_CONCORDANCIA.map((option) => {
                  const selected = chosen === option.valor;
                  const id = `${question.id}-${option.valor}`;
                  return (
                    <Label
                      key={option.valor}
                      htmlFor={id}
                      className={cn(
                        'flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border p-4 text-[15px] font-medium leading-snug transition-colors',
                        selected
                          ? 'border-foreground bg-muted/50 ring-1 ring-foreground'
                          : 'hover:bg-muted/40'
                      )}
                    >
                      <RadioGroupItem
                        id={id}
                        value={String(option.valor)}
                        className="size-[18px]"
                      />
                      <span className="whitespace-normal">{option.rotulo}</span>
                    </Label>
                  );
                })}
              </RadioGroup>

              <div className="mt-auto flex flex-col gap-3">
                <Button
                  size="lg"
                  className="h-12 w-full text-[15px]"
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
                <button
                  type="button"
                  className="min-h-12 text-center text-[13px] text-muted-foreground underline underline-offset-4"
                  onClick={() =>
                    setStep(
                      step.index === 0
                        ? { kind: 'consent' }
                        : { kind: 'question', index: step.index - 1 }
                    )
                  }
                >
                  Voltar
                </button>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  {rodape}
                </p>
              </div>
            </section>
          );
        })()
      )}
    </div>
  );
}
