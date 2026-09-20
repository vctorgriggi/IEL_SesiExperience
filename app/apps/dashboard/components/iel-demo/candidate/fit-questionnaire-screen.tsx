'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CANDIDATE_CONSENT_RESUMO,
  CANDIDATE_CONSENT_TEXT,
  CANDIDATE_CONSENT_VERSION
} from '@/features/iel-demo/analysis/candidate-questionnaire';
import {
  isValorDaEscala,
  ROTULOS_DA_REGUA,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getFitResponse,
  getFitStatus,
  getTalent,
  perguntasQueFaltam,
  reaproveitamentoDaCandidatura,
  respostasResolvidas,
  versaoDoAceiteVigente
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconArrowRight,
  IconCircleCheck,
  IconClock,
  IconHistory,
  IconLock
} from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Progress } from '@workspace/ui/shadcn/progress';

import { ICONE_TINGIDO } from '../metricas/cores';
import {
  AceiteCurto,
  CaminhoDaConversa,
  MolduraPorLink,
  TamanhoDaTarefa
} from '../shared/fluxo-por-link';
import { falaDaFrase, OuvirAFrase } from '../shared/ouvir-a-frase';
import { ReguaDeConcordancia } from '../shared/regua-de-concordancia';
import { SuasRespostas } from '../shared/suas-respostas';
import { useFocoNoTitulo } from '../shared/use-foco-no-titulo';
import { useRascunho } from '../shared/use-rascunho';

/**
 * Questionário de fit do candidato, com o aceite que o abre (M3 + M7).
 *
 * ## Três telas, poucas palavras
 *
 * Abertura (quem pergunta, uma linha, o tamanho da tarefa, o aceite curto),
 * as frases (uma por tela, a frase da planilha do cliente em título grande,
 * sem edição, e a régua de um toque) e
 * o fim ("Pronto, Nome." e as respostas devolvidas como linha de teste). O
 * público é operacional, no celular, com baixo letramento digital: o que não
 * é a pergunta, a régua ou o botão de seguir não está na tela.
 *
 * ## Base legal
 *
 * Consentimento do titular (LGPD, art. 7º, I). O aceite nasce desmarcado e
 * sem ele o questionário não abre. O texto apresentado é o de
 * `CANDIDATE_CONSENT_TEXT`, resumido em três linhas
 * (`CANDIDATE_CONSENT_RESUMO`) e inteiro a um toque; a versão vai gravada na
 * resposta (`versaoDoAceiteVigente`), nunca na tela — é rastreabilidade, não
 * leitura.
 *
 * ## Uma resposta só
 *
 * A resposta vale 12 meses e é uma só: não há "responder de novo" em lugar
 * nenhum. Quem precisa corrigir fala com a pessoa do IEL que mandou o link
 * (o reducer continua aceitando a substituição, porque é o IEL quem a faria).
 * Quem já respondeu abre direto no fim, com as respostas.
 *
 * ## O que a tela não mostra
 *
 * O nome da empresa não aparece em lugar nenhum (R5): o cabeçalho sai de
 * `getCandidateJobView`, um tipo fechado de quatro campos — atividade,
 * localidade, segmento e turno —, e o rodapé diz isso em voz alta para a
 * pessoa não ficar procurando. Também não aparecem percentual de aderência,
 * ranking, comparação nem leitura sobre quem a pessoa é: o candidato
 * responde, não se avalia (PRODUTO.md §11).
 *
 * ## Forma
 *
 * Uma frase por tela, alvos de 48px, corpo de 15px. No alto, o número do
 * passo num círculo e o quanto falta ("Faltam 4", "Última frase"); no
 * rodapé, "Próxima" e o "Voltar uma frase".
 *
 * A frase na tela é a do instrumento do cliente (`item.texto`), palavra por
 * palavra e sem edição — é o mesmo enunciado que a analista lê no relatório
 * e que volta em "Suas respostas". A pergunta de apoio é "O quanto isso é
 * você? Não existe resposta certa.", e a escala é a **régua de um toque**
 * (`shared/regua-de-concordancia`): cinco degraus com o número escrito na
 * pastilha e a palavra embaixo, de "Nada a ver comigo" a "Sou eu".
 *
 * Entre a frase e a régua fica o **"Ouvir a pergunta"**
 * (`shared/ouvir-a-frase`): o aparelho lê a frase e depois os cinco degraus
 * numerados, para quem não lê ou lê com esforço. O número é a ponte entre o
 * que se ouve e o que se toca, por isso ele está escrito no degrau.
 *
 * O toque **seleciona e para aí**: a tela mudava debaixo do dedo antes de a
 * pessoa ler o que tinha escolhido. Quem decide passar é "Próxima" — um
 * gesto, uma frase — e na última frase o mesmo botão envia.
 *
 * As frases são as que a empresa da vaga escolheu (`perguntasQueFaltam`):
 * uma por tema, onde a equipe dela é mais marcante.
 *
 * ## O fim
 *
 * "Pronto, Nome." e **"Suas respostas"** (`shared/suas-respostas`): cada
 * frase que a pessoa respondeu — as reaproveitadas de outra vaga e as novas
 * — com o grau no vocabulário da escala. É o dado do jeito que foi dado, sem
 * adjetivo, sem percentual e sem o nome da empresa (R5). Dali sai um botão
 * só: ver a candidatura.
 *
 * ## Fechar e voltar
 *
 * O que já foi respondido fica no navegador (`useRascunho`), preso à versão
 * do aceite e à lista de frases da vaga; quem fecha na frase 5 volta na 5,
 * em silêncio, e o rascunho some no envio.
 */

type Step =
  /** Nada a perguntar: só falta a pessoa dizer que as respostas dela valem aqui. */
  | { kind: 'reuse' }
  | { kind: 'consent' }
  | { kind: 'question'; index: number }
  | { kind: 'done' };

type Answers = Partial<Record<string, ValorDaEscala>>;

/** O que fica guardado no navegador enquanto a pessoa não envia. */
type RascunhoDoFit = {
  /** Aceite de outra versão não vale para este texto. */
  versao: string;
  /** As frases daquela vaga; outra lista, outro questionário. */
  itemIds: string[];
  indice: number;
  respostas: Record<string, ValorDaEscala>;
};

/**
 * As respostas completas, ou `null` enquanto faltar alguma frase: nada de
 * gravar um questionário respondido pela metade.
 */
function respostasCompletas(
  answers: Answers,
  itemIds: string[]
): Record<string, ValorDaEscala> | null {
  const completas: Record<string, ValorDaEscala> = {};
  for (const itemId of itemIds) {
    const valor = answers[itemId];
    if (valor === undefined) return null;
    completas[itemId] = valor;
  }
  return completas;
}

/** O índice da primeira frase sem resposta, ou `-1` quando não falta nenhuma. */
function primeiraSemResposta(answers: Answers, itemIds: string[]): number {
  return itemIds.findIndex((itemId) => answers[itemId] === undefined);
}

/** O texto inteiro do aceite, na ordem em que a pessoa o lê. */
const TEXTO_COMPLETO_DO_ACEITE = [
  CANDIDATE_CONSENT_TEXT.purpose,
  CANDIDATE_CONSENT_TEXT.collected,
  CANDIDATE_CONSENT_TEXT.whoSees,
  CANDIDATE_CONSENT_TEXT.retention,
  CANDIDATE_CONSENT_TEXT.rights
];

/**
 * Volta a página ao topo antes de trocar de passo.
 *
 * A tela da frase é mais alta que o celular — frase, "Ouvir a pergunta", os
 * cinco degraus empilhados —, então quem envia a última resposta está com a
 * página rolada. Sem isto, o passo seguinte nasce no meio.
 */
function aoTopo(): void {
  if (typeof document === 'undefined') return;
  // Ora rola o `html`, ora o `body` — o plugin de acessibilidade muda quem é
  // o container. Zerar os dois é o que funciona nos dois casos.
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** O atalho da equipe: o perfil da pessoa (onde a resposta chega) ou, sem talento, a vaga. */
function atalhoDoCandidato(
  application: { talentId: string | null; jobId: string } | null
): { href: string } | undefined {
  if (!application) return undefined;
  return {
    href: application.talentId
      ? routes.dashboard.iel.talents.byId(application.talentId).index
      : routes.dashboard.iel.jobs.byId(application.jobId).index
  };
}

export function FitQuestionnaireScreen({
  applicationId,
  equipeLogada = false
}: {
  applicationId: string;
  /** Sessão da analista confirmada pela página: mostra o atalho de volta. */
  equipeLogada?: boolean;
}) {
  const { state, dispatch } = useIelDemo();
  const existing = getFitResponse(state, applicationId);
  const reuso = reaproveitamentoDaCandidatura(state, applicationId);

  /*
   * Esta candidatura já está resolvida? Não basta existir um registro: um
   * registro vencido é uma vaga que volta a precisar das frases.
   * "Respondido" é ter registro **e** não faltar nenhuma frase.
   */
  const respondido = existing !== null && (reuso?.faltantes ?? 0) === 0;

  const [step, setStep] = useState<Step>(
    respondido ? { kind: 'done' } : { kind: 'consent' }
  );
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [ignoredDeadline, setIgnoredDeadline] = useState(false);
  const [faltando, setFaltando] = useState<number | null>(null);
  // Verdadeiro depois do primeiro toque: a base que chega do navegador
  // depois da primeira renderização não pode trocar a tela por baixo dela.
  const mexeuRef = useRef(false);

  const application = getApplication(state, applicationId);
  const atalho = equipeLogada ? atalhoDoCandidato(application) : undefined;
  const jobView = getCandidateJobView(state, applicationId);
  // Só o que esta empresa pergunta **e** a pessoa ainda não respondeu
  // dentro dos 12 meses.
  const perguntas = application ? perguntasQueFaltam(state, applicationId) : [];
  const totalQuestions = perguntas.length;
  const itemIds = perguntas.map((pergunta) => pergunta.itemId);
  const chaveDasFrases = itemIds.join(',');

  // Cada passo troca a tela inteira sem trocar a URL: o título do passo novo
  // recebe o foco, para o leitor de tela não voltar ao topo da página.
  const tituloRef = useFocoNoTitulo<HTMLHeadingElement>(
    `${step.kind === 'question' ? `pergunta-${step.index}` : step.kind}:${ignoredDeadline}`
  );

  const lerRascunho = useCallback(
    (bruto: unknown): RascunhoDoFit | null => {
      if (!bruto || typeof bruto !== 'object') return null;
      const dado = bruto as Partial<RascunhoDoFit>;
      if (dado.versao !== CANDIDATE_CONSENT_VERSION) return null;
      if (!Array.isArray(dado.itemIds)) return null;
      if (dado.itemIds.join(',') !== chaveDasFrases) return null;
      if (typeof dado.indice !== 'number') return null;

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

  // Retomar não pede o aceite de novo: ele foi dado sob esta mesma versão
  // (`lerRascunho` barra outra). E não avisa: a pessoa cai na frase em que
  // parou, com o que já respondeu marcado.
  const aoRetomar = useCallback((rascunho: RascunhoDoFit) => {
    setAccepted(true);
    setAnswers(rascunho.respostas);
    setStep({ kind: 'question', index: rascunho.indice });
  }, []);

  const { restaurado, gravar, apagar } = useRascunho<RascunhoDoFit>({
    chave: `iel-rascunho:fit:${applicationId}`,
    ler: lerRascunho,
    aoRestaurar: respondido ? () => undefined : aoRetomar
  });

  // Grava a cada toque, e só depois de o navegador ter sido lido: gravar
  // antes apagaria o rascunho com o estado vazio da montagem.
  useEffect(() => {
    if (!restaurado || step.kind !== 'question') return;
    if (Object.keys(answers).length === 0) return;
    gravar({
      versao: CANDIDATE_CONSENT_VERSION,
      itemIds,
      indice: step.index,
      respostas: answers as Record<string, ValorDaEscala>
    });
    // `itemIds` é recriado a cada renderização; o que importa é a lista, e
    // ela está em `chaveDasFrases`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurado, step, answers, chaveDasFrases, gravar]);

  /*
   * A base da demonstração só chega do navegador num efeito, depois da
   * primeira renderização — e o passo inicial era decidido antes dela. A
   * tela se corrige quando a resposta aparece, sem atropelar quem já tocou.
   */
  const nadaAPerguntar = Boolean(reuso?.nadaAPerguntar);
  useEffect(() => {
    if (mexeuRef.current) return;
    if (respondido) {
      setStep((atual) => (atual.kind === 'consent' ? { kind: 'done' } : atual));
      return;
    }
    // Nada a perguntar não é formulário vazio: é uma tela com nome próprio,
    // onde a pessoa confirma que as respostas dela valem para esta vaga.
    if (nadaAPerguntar) {
      setStep((atual) =>
        atual.kind === 'consent' ? { kind: 'reuse' } : atual
      );
    }
  }, [respondido, nadaAPerguntar]);

  if (!application || !jobView) {
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={null}
      >
        <Card>
          <CardHeader>
            <CardTitle className="t-pergunta">
              <h1>Este link não abriu</h1>
            </CardTitle>
            <CardDescription className="t-apoio-candidato">
              Confira a mensagem que você recebeu do IEL e abra o link inteiro.
            </CardDescription>
          </CardHeader>
        </Card>
      </MolduraPorLink>
    );
  }

  const etiqueta = (
    <Badge
      variant="secondary"
      className="gap-1.5 px-3 py-1 font-medium bg-secondary/80 text-foreground border border-border/70 shadow-2xs text-xs sm:text-[13px]"
    >
      <span className="size-1.5 rounded-full bg-primary" />
      Vaga de {jobView.activity}
    </Badge>
  );
  const rotaDaCandidatura =
    routes.dashboard.iel.applications.byId(applicationId).index;

  const expired =
    getFitStatus(state, application) === 'expirado' &&
    !respondido &&
    !ignoredDeadline;

  /** A pessoa confirma que as respostas que já deu valem para esta vaga. */
  const confirmarReuso = () => {
    mexeuRef.current = true;
    dispatch({
      type: 'reuse-fit-answers',
      applicationId,
      consentVersion: versaoDoAceiteVigente(),
      at: nowIso()
    });
    apagar();
    aoTopo();
    setStep({ kind: 'done' });
  };

  const submit = () => {
    const completas = respostasCompletas(answers, itemIds);
    if (!completas) {
      // Não dá para chegar aqui pela tela — o botão só abre com a frase
      // atual respondida —, mas um rascunho truncado deixaria a pessoa
      // tocando num botão que não faz nada. Melhor dizer o que falta.
      setFaltando(primeiraSemResposta(answers, itemIds));
      return;
    }

    dispatch({
      type: 'answer-fit-questionnaire',
      applicationId,
      answers: completas,
      consentVersion: versaoDoAceiteVigente(),
      at: nowIso()
    });
    apagar();
    setFaltando(null);
    // A última frase costuma ser respondida com a página rolada; sem isto, o
    // "Pronto, Nome." nasce escondido atrás do cabeçalho fixo da casca.
    aoTopo();
    setStep({ kind: 'done' });
  };

  if (expired) {
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        <Card>
          <CardHeader>
            <IconClock
              aria-hidden="true"
              className="size-6 text-muted-foreground"
            />
            <CardTitle className="t-pergunta">
              <h1>O prazo para responder terminou</h1>
            </CardTitle>
            <CardDescription className="t-apoio-candidato">
              As frases desta vaga ficavam abertas por dois dias. O IEL continua
              com o seu currículo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <Button
              variant="outline"
              size="lg"
              className="t-opcao h-12 w-full"
              onClick={() => setIgnoredDeadline(true)}
            >
              Responder mesmo assim
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-full text-muted-foreground"
              asChild
            >
              <Link href={rotaDaCandidatura}>Ver minha candidatura</Link>
            </Button>
          </CardContent>
        </Card>
      </MolduraPorLink>
    );
  }

  if (step.kind === 'done') {
    /*
     * O que volta para a pessoa: as respostas resolvidas desta candidatura
     * — as reaproveitadas de outra vaga e as novas —, uma linha por frase,
     * no vocabulário da escala. Nada sobre quem ela é.
     */
    const resolvidas = respostasResolvidas(state, applicationId);
    const primeiroNome = getTalent(application.talentId, state)?.name.split(
      ' '
    )[0];
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        <div className="flex flex-col gap-3">
          <span
            aria-hidden="true"
            className={`flex size-9 items-center justify-center rounded-lg ${ICONE_TINGIDO.combina}`}
          >
            <IconCircleCheck className="size-5" />
          </span>
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="t-pergunta scroll-mt-20 outline-none"
          >
            {primeiroNome ? `Pronto, ${primeiroNome}.` : 'Pronto.'}
          </h1>
          <p className="t-apoio-candidato">
            O IEL compara as suas respostas com o jeito da empresa desta vaga.
            Se o seu currículo for enviado, a empresa vê só o quanto vocês
            combinam.
          </p>
        </div>

        {resolvidas && Object.keys(resolvidas.valores).length > 0 ? (
          <SuasRespostas
            papel="candidato"
            respostas={resolvidas.valores}
          />
        ) : null}

        <div className="mt-auto pt-2">
          <Button
            size="lg"
            className="t-opcao h-12 w-full"
            asChild
          >
            <Link href={rotaDaCandidatura}>Ver minha candidatura</Link>
          </Button>
        </div>
      </MolduraPorLink>
    );
  }

  /*
   * Nada a perguntar: as respostas que a pessoa já deu cobrem esta vaga.
   * Um formulário vazio seria a pior saída; aqui ela lê o que vai ser usado
   * e confirma num toque. O aceite reaparece porque a confirmação é dela.
   */
  if (step.kind === 'reuse' && reuso) {
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        <div className="flex flex-col gap-3">
          <span
            aria-hidden="true"
            className={`flex size-9 items-center justify-center rounded-lg ${ICONE_TINGIDO.combina}`}
          >
            <IconHistory className="size-5" />
          </span>
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="t-pergunta scroll-mt-20 outline-none"
          >
            Você já respondeu isto
          </h1>
          <p className="t-apoio-candidato">
            As {reuso.perguntadas} frases desta vaga são as mesmas que você
            respondeu{reuso.desde ? ` em ${diaMes(reuso.desde)}` : ''}. Só falta
            você dizer que elas valem aqui.
          </p>
          <TamanhoDaTarefa itens={['nenhuma frase nova', 'um toque']} />
        </div>

        <AceiteCurto
          id="fit-reuse"
          linhas={[
            `Usamos as ${reuso.perguntadas} respostas que você já deu. Nada novo é perguntado.`,
            ...CANDIDATE_CONSENT_RESUMO.slice(1)
          ]}
          textoCompleto={TEXTO_COMPLETO_DO_ACEITE}
          aceito={accepted}
          onAceitar={setAccepted}
          rotuloDoBotao="Usar as minhas respostas"
          onConfirmar={confirmarReuso}
        />
      </MolduraPorLink>
    );
  }

  // `reuse` sem reaproveitamento a confirmar cai aqui, no aceite normal, em
  // vez de virar tela em branco.
  if (step.kind === 'consent' || step.kind === 'reuse') {
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        <div className="flex flex-col gap-2.5">
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="t-pergunta scroll-mt-20 outline-none"
          >
            Como você prefere trabalhar?
          </h1>
          {/* Quem pergunta e por quê, numa linha. Sem resposta certa. */}
          <p className="t-apoio-candidato">
            O IEL, Centro de Empregos da Indústria, quer saber o seu jeito de
            trabalhar para a vaga de {jobView.activity}. Não existe resposta
            certa.
          </p>
          <TamanhoDaTarefa
            itens={[
              totalQuestions === 1 ? '1 frase' : `${totalQuestions} frases`,
              totalQuestions > 6 ? 'uns 5 minutos' : 'menos de 5 minutos',
              'sem cadastro'
            ]}
          />
          {/*
           * Por que são 7 frases e não 10: reuso calado não é reuso
           * informado (LGPD, art. 6º, VI). Uma linha basta.
           */}
          {reuso && reuso.reaproveitadas > 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {reuso.reaproveitadas} já valem de uma vaga anterior; faltam{' '}
              {totalQuestions}.
            </p>
          ) : null}
        </div>

        <AceiteCurto
          id="fit-consent"
          linhas={CANDIDATE_CONSENT_RESUMO}
          textoCompleto={TEXTO_COMPLETO_DO_ACEITE}
          aceito={accepted}
          onAceitar={setAccepted}
          rotuloDoBotao="Começar"
          onConfirmar={() => {
            mexeuRef.current = true;
            setStep({ kind: 'question', index: 0 });
          }}
        />

        <CaminhoDaConversa
          href={
            routes.dashboard.iel.applications.byId(applicationId).conversation
          }
        />
      </MolduraPorLink>
    );
  }

  // Sobrou o passo das frases.
  if (step.kind !== 'question') return null;

  const question = perguntas[step.index];
  if (!question) return null;

  const chosen = answers[question.itemId];
  const isLast = step.index === totalQuestions - 1;
  const restantes = totalQuestions - (step.index + 1);
  const rotuloProgresso = `Frase ${step.index + 1} de ${totalQuestions}`;
  const valorProgresso = Math.round(((step.index + 1) / totalQuestions) * 100);
  const metade = step.index + 1 === Math.ceil(totalQuestions / 2);

  return (
    <MolduraPorLink
      atalhoDaEquipe={atalho}
      etiqueta={etiqueta}
    >
      <div className="flex flex-col gap-2.5 pb-2">
        <div
          className="flex items-center justify-between text-xs sm:text-[13px] font-medium text-muted-foreground"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {step.index + 1}
            </span>
            {rotuloProgresso}
          </span>
          <span className="rounded-full bg-muted/90 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {restantes === 0 ? 'Última frase 🎉' : `Faltam ${restantes}`}
          </span>
        </div>
        <Progress
          className="h-2 bg-muted/80 rounded-full"
          value={valorProgresso}
          aria-valuenow={valorProgresso}
          aria-label={rotuloProgresso}
          aria-valuetext={rotuloProgresso}
        />
        {metade && totalQuestions > 4 ? (
          <p className="text-xs font-medium text-muted-foreground">
            Metade do caminho concluída ✨
          </p>
        ) : null}
      </div>

      <div className="my-auto flex flex-col gap-4 py-4 sm:py-6">
        <div className="flex flex-col gap-2.5">
          <h1
            id="fit-pergunta"
            ref={tituloRef}
            tabIndex={-1}
            className={cn(
              // `scroll-mt-20`: a frase recebe o foco a cada passo e a página
              // rola até ela; sem a margem, o cabeçalho fixo da casca (56px)
              // come as duas primeiras linhas.
              'scroll-mt-20 font-bold leading-snug tracking-tight text-foreground outline-none [text-wrap:balance]',
              // A frase é a do instrumento do cliente, sem edição, e algumas
              // passam de 120 caracteres: um degrau menor para caber a 390px.
              question.item.texto.length > 120
                ? 'text-[20px] sm:text-[22px]'
                : 'text-[22px] sm:text-[26px]'
            )}
          >
            {question.item.texto}
          </h1>
          <p
            id="fit-pergunta-dica"
            className="text-[14px] sm:text-[15px] leading-relaxed text-muted-foreground"
          >
            O quanto isso é você? Não existe resposta certa.
          </p>
        </div>

        {/*
          O botão de ouvir vem antes da régua, e não depois.

          Quem depende dele não vai varrer a tela atrás de um controle: ele
          precisa estar no caminho de leitura, entre a frase e a resposta, no
          instante em que a pessoa trava. A largura inteira é de propósito —
          é o mesmo alvo dos degraus, não um ícone de canto.
        */}
        <OuvirAFrase
          id={question.itemId}
          texto={falaDaFrase({
            frase: question.item.texto,
            rotulos: ROTULOS_DA_REGUA.candidato
          })}
          className="t-opcao h-12 w-full justify-center"
        />

        <div className="pt-2">
          <ReguaDeConcordancia
            nome={question.itemId}
            valor={chosen ?? null}
            rotulos={ROTULOS_DA_REGUA.candidato}
            tom="pessoa"
            aria-labelledby="fit-pergunta"
            aria-describedby="fit-pergunta-dica"
            onChange={(valor) => {
              setFaltando(null);
              setAnswers((current) => ({
                ...current,
                [question.itemId]: valor
              }));
            }}
          />
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-4 border-t border-border/40">
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
                className="t-opcao h-12 w-full"
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
          className="h-12 sm:h-13 w-full text-[15px] sm:text-base font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all"
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
          <IconArrowRight className="ml-2 size-4" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-11 w-full text-muted-foreground hover:text-foreground text-sm font-medium"
          onClick={() => {
            setFaltando(null);
            setStep(
              step.index === 0
                ? { kind: 'consent' }
                : { kind: 'question', index: step.index - 1 }
            );
          }}
        >
          <IconArrowLeft className="mr-2 size-4" />
          {step.index === 0 ? 'Voltar ao começo' : 'Voltar uma frase'}
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground pt-1">
          <IconLock className="size-3.5 shrink-0 opacity-70" />
          <span>
            Pode fechar e voltar: o que já respondeu fica guardado. O nome da
            empresa você conhece na entrevista.
          </span>
        </div>
      </div>
    </MolduraPorLink>
  );
}

/** "05/09", do jeito que a frase a diz. */
function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}
