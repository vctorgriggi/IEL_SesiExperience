'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CULTURE_CONSENT_VERSION } from '@/features/iel-demo/analysis/culture-invites';
import {
  ESCALA_CONCORDANCIA,
  isValorDaEscala,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getInviteByToken } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconLock
} from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import { Label } from '@workspace/ui/shadcn/label';
import { Progress } from '@workspace/ui/shadcn/progress';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/shadcn/radio-group';

import { ICONE_TINGIDO } from '../metricas/cores';
import {
  CaminhoDaConversa,
  PassoDoFim,
  TamanhoDaTarefa
} from '../shared/fluxo-por-link';
import { useFocoNoTitulo } from '../shared/use-foco-no-titulo';
import { useRascunho } from '../shared/use-rascunho';

/**
 * A tela de quem trabalha na empresa e recebeu o link (M2 + M7).
 *
 * Responde uma pergunta — "como é trabalhar aqui?" — pelas frases do bloco
 * daquele convite (16 das 52 do instrumento, amostragem em matriz), uma frase
 * por tela, na escala de concordância, sem login. Quem abre isto é um
 * colaborador operacional no celular, no intervalo do turno: uma pergunta por
 * vez, alternativas de 60px, um botão só e nada para configurar.
 *
 * ## Por que esta tela importa mais do que parece
 *
 * Conseguir estas respostas é o gargalo declarado do cliente: "dos 10, só 5
 * responderam… a gente tem que ficar em cima" (00:44:15). Cada pessoa que
 * abre o link e desiste é um tema do perfil da empresa que não fecha, e um
 * perfil que não fecha é uma vaga sem fit. Daí o cuidado com as três coisas
 * que fazem alguém fechar a aba: não entender quem está pedindo, não saber
 * quanto tempo vai levar e achar que a resposta vai voltar para a chefia.
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
 * resposta — sem ela não há como demonstrar a que a pessoa consentiu. O texto
 * do aceite é o do cartão "Antes de começar", palavra por palavra; o que a
 * tela diz por conta própria fica fora dele.
 *
 * ## Fechar e voltar
 *
 * São 16 frases no intervalo do turno: interrupção é o caso comum. O que já
 * foi respondido fica no navegador da própria pessoa (`useRascunho`), preso à
 * versão do aceite e ao bloco daquele convite, e some no envio. Nada pela
 * metade chega ao estado da demonstração — rascunho não é resposta.
 */

/** Um passo do fluxo: o aceite, as frases do bloco, a confirmação. */
type Step = { kind: 'consent' } | { kind: 'question'; index: number };

type Answers = Partial<Record<string, ValorDaEscala>>;

/** O que fica guardado no navegador enquanto a pessoa não envia. */
type RascunhoDaConsulta = {
  versao: string;
  /** As frases daquele convite; outro bloco, outro questionário. */
  itemIds: string[];
  indice: number;
  respostas: Record<string, ValorDaEscala>;
};

/** "15/09": o prazo como a frase do rodapé o diz. */
function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** Tela sem formulário: o link já foi usado, venceu ou não existe. */
function InviteNotice({
  title,
  tituloRef,
  icone,
  children
}: {
  title: string;
  tituloRef?: React.Ref<HTMLHeadingElement>;
  icone?: ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        {icone}
        <h1
          ref={tituloRef}
          tabIndex={-1}
          className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
        >
          {title}
        </h1>
        <div className="flex flex-col gap-2 text-[15px] leading-relaxed text-muted-foreground">
          {children}
        </div>
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
  const [retomado, setRetomado] = useState(false);
  const [faltando, setFaltando] = useState<number | null>(null);

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
  const itemIds = bloco.map((item) => item.id);
  const chaveDasFrases = itemIds.join(',');
  const respondivel = Boolean(invite) && invite?.status === 'aberto';

  const lerRascunho = useCallback(
    (bruto: unknown): RascunhoDaConsulta | null => {
      if (!bruto || typeof bruto !== 'object') return null;
      const dado = bruto as Partial<RascunhoDaConsulta>;
      if (dado.versao !== CULTURE_CONSENT_VERSION) return null;
      if (!Array.isArray(dado.itemIds)) return null;
      if (dado.itemIds.join(',') !== chaveDasFrases) return null;
      if (typeof dado.indice !== 'number' || totalQuestions === 0) return null;

      const respostas: Record<string, ValorDaEscala> = {};
      for (const [itemId, valor] of Object.entries(dado.respostas ?? {})) {
        if (!itemIds.includes(itemId) || !isValorDaEscala(valor)) continue;
        respostas[itemId] = valor;
      }
      if (Object.keys(respostas).length === 0) return null;

      return {
        versao: dado.versao,
        itemIds: dado.itemIds,
        indice: Math.min(
          Math.max(0, Math.trunc(dado.indice)),
          totalQuestions - 1
        ),
        respostas
      };
    },
    [chaveDasFrases, itemIds, totalQuestions]
  );

  const aoRetomar = useCallback((rascunho: RascunhoDaConsulta) => {
    // O aceite foi dado nesta mesma sessão, com esta mesma versão de texto
    // (`lerRascunho` barra qualquer outra): retomar não pede de novo.
    setAccepted(true);
    setAnswers(rascunho.respostas);
    setStep({ kind: 'question', index: rascunho.indice });
    setRetomado(true);
  }, []);

  const { restaurado, gravar, apagar } = useRascunho<RascunhoDaConsulta>({
    chave: `iel-rascunho:consulta:${token}`,
    ler: lerRascunho,
    aoRestaurar: respondivel ? aoRetomar : () => undefined
  });

  useEffect(() => {
    if (!restaurado || step.kind !== 'question') return;
    if (Object.keys(answers).length === 0) return;
    gravar({
      versao: CULTURE_CONSENT_VERSION,
      itemIds,
      indice: step.index,
      respostas: answers as Record<string, ValorDaEscala>
    });
    // `itemIds` é recriado a cada renderização; a lista em si está em
    // `chaveDasFrases`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurado, step, answers, chaveDasFrases, gravar]);

  const submit = (final: Answers) => {
    const completas: Record<string, ValorDaEscala> = {};
    for (const itemId of itemIds) {
      const valor = final[itemId];
      if (valor === undefined) {
        // Pela tela não se chega aqui; por um rascunho truncado, sim — e a
        // pessoa ficaria tocando num botão que não responde.
        setFaltando(itemIds.indexOf(itemId));
        return;
      }
      completas[itemId] = valor;
    }

    dispatch({
      type: 'answer-culture-invite',
      token,
      answers: completas,
      consentVersion: CULTURE_CONSENT_VERSION,
      at: nowIso()
    });
    apagar();
    setFaltando(null);
    setFinished(true);
  };

  return (
    // A casca por link já imprime o quadrado "IEL"; aqui fica o resto da
    // linha de topo — o que a pessoa está respondendo e para quem.
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-5 px-1 py-4">
      <p className="text-sm font-medium">
        Consulta à equipe
        {invite ? (
          <span className="text-muted-foreground"> · {invite.companyName}</span>
        ) : null}
      </p>

      {!invite ? (
        <InviteNotice title="Este link não abriu">
          <p>
            O endereço não corresponde a nenhuma consulta. Confira a mensagem
            que você recebeu e abra o link de novo, inteiro.
          </p>
        </InviteNotice>
      ) : finished || invite.status === 'respondido' ? (
        <>
          <InviteNotice
            title="Resposta registrada"
            tituloRef={tituloRef}
            icone={
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg',
                  ICONE_TINGIDO.combina
                )}
              >
                <IconCircleCheck className="size-5" />
              </span>
            }
          >
            <p>Obrigado. Você não precisa fazer mais nada.</p>
          </InviteNotice>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <h2>O que acontece agora</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-4">
                <PassoDoFim numero={1}>
                  A sua resposta entra numa média com a de todo mundo que
                  responder. Ninguém vê o que você respondeu sozinho — nem a
                  empresa, nem a sua chefia, nem o IEL.
                </PassoDoFim>
                <PassoDoFim numero={2}>
                  Quando gente suficiente responder, essa média passa a
                  descrever como é trabalhar aí, e o IEL usa isso para procurar
                  candidatos que combinem com o jeito da casa.
                </PassoDoFim>
                <PassoDoFim numero={3}>
                  Este link já foi usado e não abre de novo. Pode fechar a
                  página.
                </PassoDoFim>
              </ol>
            </CardContent>
          </Card>

          <p className="pt-1 text-center text-xs leading-relaxed text-muted-foreground">
            Demonstração: nada é enviado de verdade e este link abre direto, sem
            senha e sem cadastro.
          </p>
        </>
      ) : invite.status === 'expirado' ? (
        <InviteNotice
          title="Este link venceu"
          tituloRef={tituloRef}
        >
          <p>
            O prazo para responder era de 3 dias e terminou em{' '}
            {shortDate(invite.expiresAt)}.
          </p>
          <p>
            Se ainda quiser responder, peça um link novo a quem mandou o convite
            — é a pessoa do IEL que fala com a sua empresa.
          </p>
        </InviteNotice>
      ) : step.kind === 'consent' ? (
        <section className="flex flex-1 flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <h1
              ref={tituloRef}
              tabIndex={-1}
              className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
            >
              Como é trabalhar aqui?
            </h1>
            {/*
             * Quem abre o link não sabe o que é aquilo, e a primeira tela é
             * onde ele decide continuar ou fechar. Três coisas antes de
             * qualquer outra: quem está pedindo, por que a pessoa foi
             * escolhida e que não existe resposta certa.
             */}
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Quem pergunta é o IEL, o Centro de Empregos da Indústria, junto
              com a {invite.companyName}. Quem responde é quem vive o dia a dia
              daí — por isso você recebeu este link.
            </p>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Não existe resposta certa nem errada. Responda pelo que acontece
              de verdade, não pelo que deveria acontecer.
            </p>
            <TamanhoDaTarefa
              itens={[
                `${totalQuestions} frases`,
                'uns 5 minutos',
                'sem cadastro'
              ]}
            />
          </div>

          {/*
           * A promessa de anonimato é o que decide se a resposta é honesta: a
           * pessoa está dizendo como é trabalhar na empresa dela, e a chefia
           * pode estar do lado. Fica antes do texto do aceite, em cartão
           * próprio, e não enterrada no terceiro parágrafo.
           */}
          <Card>
            <CardContent className="flex gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  ICONE_TINGIDO.combina
                )}
              >
                <IconLock className="size-4" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[15px] leading-snug font-medium">
                  Ninguém vai saber o que você respondeu
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sua resposta não fica com o seu nome. Ela entra numa média com
                  a de todo mundo que responder. Nem a empresa, nem a sua
                  chefia, nem o IEL veem a sua resposta sozinha.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <h2>Antes de começar</h2>
              </CardTitle>
            </CardHeader>
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

          <CaminhoDaConversa
            href={routes.dashboard.iel.cultureInvite.conversationByToken(token)}
          />

          <div className="flex flex-col gap-3">
            <Label
              htmlFor="culture-consent"
              className="flex min-h-[60px] cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] leading-snug font-medium"
            >
              <Checkbox
                id="culture-consent"
                aria-describedby="culture-consent-ajuda"
                className="mt-0.5 size-5"
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked === true)}
              />
              Li e aceito o uso das minhas respostas.
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
              id="culture-consent-ajuda"
              className="text-center text-xs leading-relaxed text-muted-foreground"
            >
              Sem o aceite o questionário não abre. Versão do texto:{' '}
              {CULTURE_CONSENT_VERSION}. Link válido até{' '}
              {shortDate(invite.expiresAt)}.
            </p>
          </div>
        </section>
      ) : (
        (() => {
          const question = bloco[step.index];
          if (!question) return null;
          const chosen = answers[question.id];
          const isLast = step.index === totalQuestions - 1;
          const restantes = totalQuestions - (step.index + 1);
          const rotuloProgresso = `Frase ${step.index + 1} de ${totalQuestions}`;
          const valorProgresso = Math.round(
            ((step.index + 1) / totalQuestions) * 100
          );
          const metade = step.index + 1 === Math.ceil(totalQuestions / 2);

          return (
            <section className="flex flex-1 flex-col gap-5">
              <div className="flex flex-col gap-2">
                {/*
                 * O número da pergunta é lido no título, que recebe o foco. À
                 * direita ficava "uns 5 min", repetido em todas as 16 telas;
                 * no meio de uma fila longa o que a pessoa quer saber é
                 * quantas ainda faltam.
                 */}
                <div
                  className="flex justify-between text-[13px] text-muted-foreground"
                  aria-hidden="true"
                >
                  <span>{rotuloProgresso}</span>
                  <span>
                    {restantes === 0 ? 'Última' : `Faltam ${restantes}`}
                  </span>
                </div>
                <Progress
                  className="h-1.5 bg-muted"
                  value={valorProgresso}
                  // O `Progress` do kit não repassa `value` ao Radix.
                  aria-valuenow={valorProgresso}
                  aria-label={rotuloProgresso}
                  aria-valuetext={rotuloProgresso}
                />
                {metade ? (
                  <p className="text-[13px] leading-snug text-muted-foreground">
                    Metade do caminho.
                  </p>
                ) : null}
              </div>

              {retomado ? (
                <p
                  role="status"
                  className="rounded-lg border border-dashed px-3 py-2 text-[13px] leading-relaxed text-muted-foreground"
                >
                  Você voltou de onde parou. As frases que já tinha respondido
                  continuam respondidas.
                </p>
              ) : null}

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
                  setFaltando(null);
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

              <div className="mt-auto flex flex-col gap-2.5 pt-4">
                {faltando !== null && faltando >= 0 ? (
                  <Card
                    role="alert"
                    className="gap-2 py-4"
                  >
                    <CardContent className="flex flex-col gap-2.5">
                      <p className="flex items-start gap-2 text-[15px] leading-snug font-medium">
                        <IconAlertTriangle
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0"
                        />
                        Falta responder a frase {faltando + 1}.
                      </p>
                      <Button
                        variant="outline"
                        className="h-12 w-full text-[15px]"
                        onClick={() => {
                          setFaltando(null);
                          setStep({ kind: 'question', index: faltando });
                        }}
                      >
                        Ir para a frase {faltando + 1}
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}
                <Button
                  size="lg"
                  className="h-12 w-full text-[15px]"
                  disabled={chosen === undefined}
                  onClick={() => {
                    if (isLast) {
                      submit(answers);
                      return;
                    }
                    // O aviso de retomada cumpriu o papel na tela em que ela
                    // voltou; repetido nas quinze seguintes vira ruído.
                    setRetomado(false);
                    setStep({ kind: 'question', index: step.index + 1 });
                  }}
                >
                  {isLast ? 'Enviar respostas' : 'Próxima'}
                </Button>
                {/*
                 * Era um `<button>` sublinhado de 13px no meio do rodapé —
                 * pequeno demais para o polegar e diferente de todos os
                 * outros botões do fluxo. Agora é o mesmo botão do
                 * questionário do candidato, com 48px de altura.
                 */}
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 w-full text-muted-foreground"
                  onClick={() => {
                    setFaltando(null);
                    setRetomado(false);
                    setStep(
                      step.index === 0
                        ? { kind: 'consent' }
                        : { kind: 'question', index: step.index - 1 }
                    );
                  }}
                >
                  {step.index === 0 ? 'Voltar ao começo' : 'Voltar uma frase'}
                </Button>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  Ninguém vê a sua resposta sozinha. Pode fechar e voltar: o que
                  já respondeu fica guardado até {shortDate(invite.expiresAt)}.
                </p>
              </div>
            </section>
          );
        })()
      )}
    </div>
  );
}
