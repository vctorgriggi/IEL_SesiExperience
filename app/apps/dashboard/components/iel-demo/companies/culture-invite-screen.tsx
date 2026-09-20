'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  CULTURE_CONSENT_RESUMO,
  CULTURE_CONSENT_TEXT,
  CULTURE_CONSENT_VERSION
} from '@/features/iel-demo/analysis/culture-invites';
import {
  isValorDaEscala,
  ROTULOS_DA_REGUA,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getInviteByToken } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import { Card, CardContent } from '@workspace/ui/shadcn/card';
import { Progress } from '@workspace/ui/shadcn/progress';

import { ICONE_TINGIDO } from '../metricas/cores';
import {
  AceiteCurto,
  AtalhoDaEquipe,
  CaminhoDaConversa,
  TamanhoDaTarefa
} from '../shared/fluxo-por-link';
import { ReguaDeConcordancia } from '../shared/regua-de-concordancia';
import { SuasRespostas } from '../shared/suas-respostas';
import { useFocoNoTitulo } from '../shared/use-foco-no-titulo';
import { useRascunho } from '../shared/use-rascunho';

/**
 * A tela de quem trabalha na empresa e recebeu o link (M2 + M7).
 *
 * Responde uma pergunta — "como é trabalhar aqui?" — pelas frases do bloco
 * daquele convite (16 das 52 do instrumento), uma por tela, na escala de
 * concordância, sem login. Quem abre isto é um colaborador operacional no
 * celular, no intervalo do turno: uma pergunta por vez, uma régua de um toque
 * e nada para configurar.
 *
 * ## Três telas, poucas palavras
 *
 * Abertura (quem pediu, uma linha, o tamanho da tarefa, o aceite curto), as
 * frases (a frase do cliente em título grande, "O quanto isso é assim aí?", a régua do
 * colaborador em azul — é o lado da empresa que a resposta forma) e o fim
 * ("Obrigado." e as respostas devolvidas como linha de teste). Nenhuma
 * leitura sobre o lugar ou sobre a pessoa: só o que ela respondeu.
 *
 * ## Por que esta tela importa mais do que parece
 *
 * Conseguir estas respostas é o gargalo declarado do cliente: "dos 10, só 5
 * responderam… a gente tem que ficar em cima" (00:44:15). Cada pessoa que
 * abre o link e desiste é um tema do perfil da empresa que não fecha. Daí o
 * cuidado com o que faz alguém fechar a aba: não entender quem pede, não
 * saber quanto tempo leva e achar que a resposta volta para a chefia — o
 * anonimato é a segunda linha do aceite, não o terceiro parágrafo.
 *
 * ## O que a tela não mostra (PRODUTO.md §5)
 *
 * Ninguém mais: nem lista de colegas, nem contagem, nem média parcial. Nem o
 * próprio nome ou e-mail: `getInviteByToken` devolve só a empresa, o prazo e
 * a situação. Um link vazado não vira vazamento de dado pessoal.
 *
 * ## Base legal
 *
 * Consentimento (LGPD, art. 7º, I): o aceite nasce desmarcado e sem ele o
 * questionário não abre. O texto é o de `CULTURE_CONSENT_TEXT`, resumido em
 * três linhas e inteiro a um toque; a versão vai gravada na resposta.
 *
 * ## Fechar e voltar
 *
 * O que já foi respondido fica no navegador da própria pessoa
 * (`useRascunho`), preso à versão do aceite e ao bloco daquele convite, e
 * some no envio. A retomada é silenciosa.
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

/** "15/09": o prazo como a frase o diz. */
function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** O texto inteiro do aceite, na ordem em que a pessoa o lê. */
const TEXTO_COMPLETO_DO_ACEITE = [
  CULTURE_CONSENT_TEXT.purpose,
  CULTURE_CONSENT_TEXT.collected,
  CULTURE_CONSENT_TEXT.whoSees,
  CULTURE_CONSENT_TEXT.retention
];

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

export function CultureInviteScreen({
  token,
  equipeLogada = false
}: {
  token: string;
  /** Sessão da analista confirmada pela página: mostra o atalho de volta. */
  equipeLogada?: boolean;
}) {
  const { state, dispatch } = useIelDemo();
  const invite = getInviteByToken(state, token);

  const [step, setStep] = useState<Step>({ kind: 'consent' });
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [finished, setFinished] = useState(false);
  // O que foi enviado nesta sessão, para devolver: a tela não relê a
  // resposta individual do estado, porque ali ela já é média.
  const [enviadas, setEnviadas] = useState<Record<
    string,
    ValorDaEscala
  > | null>(null);
  const [faltando, setFaltando] = useState<number | null>(null);

  // Passo novo, tela nova, mesma URL: o foco vai para o título do passo.
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

  // O aceite foi dado nesta mesma sessão, com esta mesma versão de texto
  // (`lerRascunho` barra qualquer outra): retomar não pede de novo, nem avisa.
  const aoRetomar = useCallback((rascunho: RascunhoDaConsulta) => {
    setAccepted(true);
    setAnswers(rascunho.respostas);
    setStep({ kind: 'question', index: rascunho.indice });
  }, []);

  /*
   * Retoma sem olhar o status: a base da demonstração chega do navegador
   * num efeito, depois da primeira renderização, e um convite reenviado ao
   * vivo ainda parece vencido nesse instante. Se o link não estiver aberto,
   * as telas de vencido e respondido vêm antes do passo.
   */
  const { restaurado, gravar, apagar } = useRascunho<RascunhoDaConsulta>({
    chave: `iel-rascunho:consulta:${token}`,
    ler: lerRascunho,
    aoRestaurar: aoRetomar
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
        // Pela tela não se chega aqui; por um rascunho truncado, sim.
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
    setEnviadas(completas);
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
          <p>Confira a mensagem que você recebeu e abra o link inteiro.</p>
        </InviteNotice>
      ) : finished || invite.status === 'respondido' ? (
        <>
          <InviteNotice
            title="Obrigado."
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
            <p>
              Sua resposta foi registrada e entra numa média com a da equipe.
              Este link não abre outra vez.
            </p>
          </InviteNotice>

          {enviadas ? (
            <SuasRespostas
              papel="colaborador"
              respostas={enviadas}
            />
          ) : null}
        </>
      ) : invite.status === 'expirado' ? (
        <InviteNotice
          title="Este link venceu"
          tituloRef={tituloRef}
        >
          <p>
            O prazo para responder terminou em {shortDate(invite.expiresAt)}.
          </p>
          <p>
            Se ainda quiser responder, peça um link novo a quem mandou o
            convite.
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
             * Quem pediu, com nome, e que não há resposta certa — numa
             * linha. É a primeira tela que decide se a pessoa continua.
             */}
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              A equipe do IEL que atende a {invite.companyName} quer a opinião
              de quem vive o dia a dia daí. Não existe resposta certa.
            </p>
            <TamanhoDaTarefa
              itens={[
                `${totalQuestions} frases`,
                'uns 5 minutos',
                'sem cadastro'
              ]}
            />
          </div>

          <AceiteCurto
            id="culture-consent"
            linhas={CULTURE_CONSENT_RESUMO}
            textoCompleto={TEXTO_COMPLETO_DO_ACEITE}
            aceito={accepted}
            onAceitar={setAccepted}
            rotuloDoBotao="Começar"
            onConfirmar={() => setStep({ kind: 'question', index: 0 })}
          />

          <CaminhoDaConversa
            href={routes.dashboard.iel.cultureInvite.conversationByToken(token)}
          />
        </section>
      ) : (
        (() => {
          const question = bloco[step.index];
          if (!question) return null;
          const chosen = answers[question.id];
          const isLast = step.index === totalQuestions - 1;
          const rotuloProgresso = `${step.index + 1} de ${totalQuestions}`;
          const valorProgresso = Math.round(
            ((step.index + 1) / totalQuestions) * 100
          );

          return (
            <section className="flex flex-1 flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p
                  className="text-[13px] text-muted-foreground"
                  aria-hidden="true"
                >
                  {rotuloProgresso}
                </p>
                <Progress
                  className="h-1.5 bg-muted"
                  value={valorProgresso}
                  // O `Progress` do kit não repassa `value` ao Radix.
                  aria-valuenow={valorProgresso}
                  aria-label={rotuloProgresso}
                  aria-valuetext={rotuloProgresso}
                />
              </div>

              <div className="flex flex-col gap-2">
                <h1
                  id="consulta-pergunta"
                  ref={tituloRef}
                  tabIndex={-1}
                  className={cn(
                    'font-semibold leading-[1.25] tracking-tight outline-none [text-wrap:balance]',
                    // A frase é a da planilha, sem edição; as mais longas
                    // descem um degrau para caber a 390 px.
                    question.texto.length > 120 ? 'text-[20px]' : 'text-[24px]'
                  )}
                >
                  {question.texto}
                </h1>
                <p
                  id="consulta-pergunta-dica"
                  className="text-[15px] leading-relaxed text-muted-foreground"
                >
                  O quanto isso é assim aí?
                </p>
              </div>

              <ReguaDeConcordancia
                nome={question.id}
                valor={chosen ?? null}
                rotulos={ROTULOS_DA_REGUA.colaborador}
                tom="empresa"
                aria-labelledby="consulta-pergunta"
                aria-describedby="consulta-pergunta-dica"
                onChange={(valor) => {
                  setFaltando(null);
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: valor
                  }));
                }}
                onConfirmar={() => {
                  // O toque avança; na última frase, enviar é um gesto à
                  // parte.
                  if (isLast) return;
                  setStep({ kind: 'question', index: step.index + 1 });
                }}
              />

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
                    setStep({ kind: 'question', index: step.index + 1 });
                  }}
                >
                  {isLast ? 'Enviar respostas' : 'Próxima'}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="h-12 w-full text-muted-foreground"
                  onClick={() => {
                    setFaltando(null);
                    setStep(
                      step.index === 0
                        ? { kind: 'consent' }
                        : { kind: 'question', index: step.index - 1 }
                    );
                  }}
                >
                  Voltar
                </Button>
              </div>
            </section>
          );
        })()
      )}
      {equipeLogada && invite ? (
        <AtalhoDaEquipe
          href={routes.dashboard.iel.companies.byId(invite.companyId)}
        />
      ) : null}
    </div>
  );
}
