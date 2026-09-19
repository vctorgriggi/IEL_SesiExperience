'use client';

import { useState, type ReactNode } from 'react';
import {
  CANDIDATE_CONSENT_TEXT,
  CANDIDATE_CONSENT_VERSION,
  CANDIDATE_FIT_QUESTIONS,
  type CandidateFitOption
} from '@/features/iel-demo/analysis/candidate-questionnaire';
import type { CultureOptionValue } from '@/features/iel-demo/analysis/culture';
import type { FitAxisId } from '@/features/iel-demo/analysis/fit-axes';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getFitResponse,
  getFitStatus,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { CircleCheckIcon, ClockIcon } from 'lucide-react';

import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import { Label } from '@workspace/ui/shadcn/label';
import { Progress } from '@workspace/ui/shadcn/progress';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/shadcn/radio-group';

import { TalentTransparency } from '../clarifications/talent-transparency';
import { useFocoNoTitulo } from '../shared/use-foco-no-titulo';

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
 * manda informar de forma "clara, adequada e ostensiva": finalidade, o que se
 * coleta, quem vê, por quanto tempo e quais são os direitos do titular. Os
 * três primeiros itens ficam no cartão, em letra de leitura; prazo e direitos
 * vêm logo abaixo, na mesma tela e antes do aceite — nenhum deles é omitido.
 *
 * ## O que a tela não mostra
 *
 * O nome da empresa não aparece em lugar nenhum (R5). O cabeçalho sai de
 * `getCandidateJobView`, que é um tipo fechado de quatro campos — atividade,
 * localidade, segmento e turno —, e o rodapé diz isso em voz alta para a
 * pessoa não ficar procurando. Também não aparecem o percentual de aderência,
 * o ranking nem qualquer outro candidato: o candidato responde, não se avalia.
 *
 * ## Forma
 *
 * Uma pergunta por tela, alvos de 48px, corpo de 15px. O público é operacional
 * e com baixo letramento digital: o que não é a pergunta atual, o botão de
 * seguir ou o de voltar não está na tela.
 */

const TOTAL_QUESTIONS = CANDIDATE_FIT_QUESTIONS.length;

type Step =
  | { kind: 'consent' }
  | { kind: 'question'; index: number }
  | { kind: 'done' };

type Answers = Partial<Record<FitAxisId, CandidateFitOption>>;

/**
 * As cinco respostas completas, ou `null` enquanto faltar alguma.
 *
 * Os eixos são escritos um a um de propósito: é o que deixa o TypeScript
 * provar que o objeto entregue ao `dispatch` tem as cinco chaves, sem
 * conversão de tipo escondendo um questionário respondido pela metade.
 */
function respostasCompletas(
  answers: Answers
): Record<FitAxisId, CultureOptionValue> | null {
  const apoio = answers['apoio-inicial'];
  const autonomia = answers.autonomia;
  const comunicacao = answers['comunicacao-prioridades'];
  const ritmo = answers['ritmo-turno'];
  const aprendizado = answers.aprendizado;

  if (!apoio || !autonomia || !comunicacao || !ritmo || !aprendizado) {
    return null;
  }

  return {
    'apoio-inicial': apoio.value,
    autonomia: autonomia.value,
    'comunicacao-prioridades': comunicacao.value,
    'ritmo-turno': ritmo.value,
    aprendizado: aprendizado.value
  };
}

export function FitQuestionnaireScreen({
  applicationId
}: {
  applicationId: string;
}) {
  const { state, dispatch } = useIelDemo();
  const existing = getFitResponse(state, applicationId);

  // Quem já respondeu abre direto na confirmação. "Responder novamente" é
  // permitido porque a ação é idempotente por candidatura: uma pessoa tem
  // uma resposta, não duas.
  const [step, setStep] = useState<Step>(
    existing ? { kind: 'done' } : { kind: 'consent' }
  );
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [ignoredDeadline, setIgnoredDeadline] = useState(false);

  // Cada passo troca a tela inteira sem trocar a URL: o título do passo novo
  // recebe o foco, para o leitor de tela não voltar ao topo da página.
  const tituloRef = useFocoNoTitulo<HTMLHeadingElement>(
    `${step.kind === 'question' ? `pergunta-${step.index}` : step.kind}:${ignoredDeadline}`
  );

  const application = getApplication(state, applicationId);
  const jobView = getCandidateJobView(state, applicationId);
  const talent = application ? getTalent(application.talentId) : null;

  if (!application || !jobView) {
    return (
      <CandidateFrame badge={null}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Link inválido</h1>
            </CardTitle>
            <CardDescription>
              Este link não corresponde a nenhuma candidatura. Confira a
              mensagem que você recebeu.
            </CardDescription>
          </CardHeader>
        </Card>
      </CandidateFrame>
    );
  }

  const badge = (
    <Badge
      variant="outline"
      className="font-medium text-muted-foreground"
    >
      Vaga de {jobView.activity}
    </Badge>
  );

  const expired =
    getFitStatus(state, application) === 'expirado' &&
    !existing &&
    !ignoredDeadline;

  const restart = () => {
    setAnswers({});
    setAccepted(false);
    setStep({ kind: 'consent' });
  };

  const submit = () => {
    const completas = respostasCompletas(answers);
    if (!completas) return;

    dispatch({
      type: 'answer-fit-questionnaire',
      applicationId,
      answers: completas,
      consentVersion: CANDIDATE_CONSENT_VERSION,
      at: nowIso()
    });
    setStep({ kind: 'done' });
  };

  if (expired) {
    return (
      <CandidateFrame badge={badge}>
        <Card>
          <CardHeader>
            <ClockIcon
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />
            <CardTitle className="text-[18px]">
              <h1>O prazo para responder terminou</h1>
            </CardTitle>
            <CardDescription className="leading-relaxed">
              O questionário desta vaga ficava aberto por dois dias. O IEL
              continua com o seu currículo: se a vaga voltar a precisar de
              respostas, você recebe um novo link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full"
              onClick={() => setIgnoredDeadline(true)}
            >
              Responder mesmo assim
            </Button>
          </CardContent>
        </Card>
      </CandidateFrame>
    );
  }

  if (step.kind === 'done') {
    return (
      <CandidateFrame badge={badge}>
        <Card>
          <CardHeader>
            <CircleCheckIcon
              aria-hidden="true"
              className="size-7 text-foreground"
            />
            <CardTitle className="text-[22px] tracking-tight">
              <h1
                ref={tituloRef}
                tabIndex={-1}
                aria-label="Pronto. Suas respostas foram registradas."
                className="outline-none"
              >
                Pronto
              </h1>
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed">
              Você não precisa fazer mais nada agora.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              O IEL compara o que você respondeu com o jeito de trabalhar da
              empresa desta vaga. Se o seu currículo for enviado, a empresa vê o
              resultado por ponto — nunca as suas respostas uma a uma.
            </p>
            <p>
              Se a empresa quiser conversar, o contato vem por quem já fala com
              você. Quiser mudar alguma resposta, é só responder de novo: fica
              valendo a última.
            </p>
          </CardContent>
        </Card>

        {talent ? <TalentTransparency talentId={talent.id} /> : null}

        <div className="mt-auto pt-2">
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full"
            onClick={restart}
          >
            Responder novamente
          </Button>
        </div>
      </CandidateFrame>
    );
  }

  if (step.kind === 'consent') {
    return (
      <CandidateFrame badge={badge}>
        <div className="flex flex-col gap-1.5">
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            {CANDIDATE_CONSENT_TEXT.title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            São 5 perguntas sobre como você prefere trabalhar. Leva cerca de 5
            minutos e não existe resposta certa.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <ConsentItem label="Para quê">
              {CANDIDATE_CONSENT_TEXT.purpose}
            </ConsentItem>
            <ConsentItem label="O que coletamos">
              {CANDIDATE_CONSENT_TEXT.collected}
            </ConsentItem>
            <ConsentItem label="Quem vê">
              {CANDIDATE_CONSENT_TEXT.whoSees}
            </ConsentItem>
          </CardContent>
        </Card>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {CANDIDATE_CONSENT_TEXT.retention} {CANDIDATE_CONSENT_TEXT.rights}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <Label
            htmlFor="fit-consent"
            className="flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border p-4 text-[15px] font-medium"
          >
            <Checkbox
              id="fit-consent"
              className="size-5"
              aria-describedby="fit-consent-ajuda"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
            />
            Li e aceito
          </Label>
          <Button
            size="lg"
            className="h-12 w-full text-[15px]"
            disabled={!accepted}
            onClick={() => setStep({ kind: 'question', index: 0 })}
          >
            Começar
          </Button>
          <p
            id="fit-consent-ajuda"
            className="text-center text-xs leading-relaxed text-muted-foreground"
          >
            Sem o aceite o questionário não abre. Versão do texto:{' '}
            {CANDIDATE_CONSENT_TEXT.version}.
          </p>
        </div>
      </CandidateFrame>
    );
  }

  const question = CANDIDATE_FIT_QUESTIONS[step.index];
  if (!question) return null;

  const chosen = answers[question.axisId];
  const isLast = step.index === TOTAL_QUESTIONS - 1;
  const rotuloProgresso = `Pergunta ${step.index + 1} de ${TOTAL_QUESTIONS}`;
  const valorProgresso = Math.round(((step.index + 1) / TOTAL_QUESTIONS) * 100);

  return (
    <CandidateFrame badge={badge}>
      <div className="flex flex-col gap-2">
        {/* O número da pergunta é lido no título, que recebe o foco. */}
        <div
          className="flex justify-between text-[13px] text-muted-foreground"
          aria-hidden="true"
        >
          <span>{rotuloProgresso}</span>
          <span>cerca de 1 min</span>
        </div>
        <Progress
          className="h-1.5 bg-muted"
          value={valorProgresso}
          // O `Progress` do kit não repassa `value` ao Radix; sem isto a
          // barra é lida sem número.
          aria-valuenow={valorProgresso}
          aria-label={rotuloProgresso}
          aria-valuetext={rotuloProgresso}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <h1
          id="fit-pergunta"
          ref={tituloRef}
          tabIndex={-1}
          className="text-[22px] font-semibold leading-[1.25] tracking-tight outline-none"
        >
          <span className="sr-only">{rotuloProgresso}: </span>
          {question.prompt}
        </h1>
        <p
          id="fit-pergunta-dica"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          {question.hint}
        </p>
      </div>

      <RadioGroup
        className="gap-2.5"
        aria-labelledby="fit-pergunta"
        aria-describedby="fit-pergunta-dica"
        value={chosen?.id ?? ''}
        onValueChange={(value) => {
          const option = question.options.find((entry) => entry.id === value);
          if (!option) return;
          setAnswers((current) => ({ ...current, [question.axisId]: option }));
        }}
      >
        {question.options.map((option) => {
          const selected = chosen?.id === option.id;
          return (
            <Label
              key={option.id}
              htmlFor={`${question.axisId}-${option.id}`}
              data-selected={selected ? '' : undefined}
              className="flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border p-4 text-[15px] font-medium leading-[1.35] data-[selected]:border-foreground data-[selected]:bg-muted/50 data-[selected]:ring-1 data-[selected]:ring-foreground"
            >
              <RadioGroupItem
                id={`${question.axisId}-${option.id}`}
                className="size-[18px]"
                value={option.id}
              />
              <span>{option.label}</span>
            </Label>
          );
        })}
      </RadioGroup>

      <div className="mt-auto flex flex-col gap-2.5 pt-4">
        <Button
          size="lg"
          className="h-12 w-full text-[15px]"
          disabled={!chosen}
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
        <Button
          variant="ghost"
          size="lg"
          className="h-12 w-full text-muted-foreground"
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
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Suas respostas valem só para esta vaga. O nome da empresa você conhece
          na entrevista.
        </p>
      </div>
    </CandidateFrame>
  );
}

/**
 * A moldura de todas as telas do candidato.
 *
 * O quadrado "IEL" já vem da casca por link (`layout/iel-shell.tsx`), então
 * aqui fica só o nome do serviço e a etiqueta da vaga — que é o único jeito
 * de a pessoa saber a que candidatura o link se refere sem descobrir a
 * empresa (R5).
 */
function CandidateFrame({
  badge,
  children
}: {
  badge: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-6 px-1 pt-2">
      {/*
       * Quem é o remetente já está no cabeçalho da casca (Mind RH · IEL ·
       * Centro de Empregos). Repetir aqui gastava a primeira linha da tela
       * com uma informação que o candidato acabou de ler; o que sobra é a
       * vaga, que é o contexto que ele precisa.
       */}
      <div className="flex items-center justify-end gap-2">{badge}</div>
      {children}
    </div>
  );
}

function ConsentItem({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm leading-relaxed text-foreground">{children}</p>
    </div>
  );
}
