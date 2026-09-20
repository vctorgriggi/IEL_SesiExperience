'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react';
import Link from 'next/link';
import {
  CANDIDATE_CONSENT_TEXT,
  CANDIDATE_CONSENT_VERSION
} from '@/features/iel-demo/analysis/candidate-questionnaire';
import {
  ESCALA_CONCORDANCIA,
  isValorDaEscala,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getFitResponse,
  getFitStatus,
  perguntasDoCandidato,
  perguntasQueFaltam,
  reaproveitamentoDaCandidatura,
  validadeDasRespostas,
  versaoDoAceiteVigente
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  CircleCheckIcon,
  ClockIcon,
  HistoryIcon,
  TriangleAlertIcon
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
 * cinco itens ficam no mesmo cartão, em letra de leitura: prazo e direitos
 * saíram da nota de rodapé em 12px, onde ninguém os lia, e entraram na lista,
 * do mesmo tamanho dos outros — informação que a lei manda dar de forma
 * ostensiva não cabe em letra miúda.
 *
 * As cinco frases são as constantes, palavra por palavra: elas são o texto a
 * que a pessoa consente e vão gravadas por versão
 * (`CANDIDATE_CONSENT_VERSION`). O que esta tela escreve por conta própria
 * — quem está perguntando, por que, quanto tempo leva e que não existe
 * resposta certa — fica **fora** do cartão, antes dele.
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
 * Uma frase por tela, alvos de 48px, corpo de 15px. O público é operacional
 * e com baixo letramento digital: o que não é a frase atual, o botão de
 * seguir ou o de voltar não está na tela. A frase é o `textoSimples` do
 * instrumento, e a escala de concordância aparece em 5 opções grandes, uma
 * por linha, com o rótulo escrito.
 *
 * As 10 frases são as que a empresa da vaga escolheu (`perguntasDoCandidato`):
 * uma por tema, onde a equipe dela é mais marcante.
 *
 * ## Fechar e voltar
 *
 * O que já foi respondido fica no navegador da pessoa (`useRascunho`), com a
 * versão do aceite e a lista de frases daquela vaga. Ela fecha na frase 7,
 * volta depois e continua na 7 — o rascunho some assim que ela envia. Sem
 * isso, cada interrupção no meio do caminho custava a resposta inteira, e é
 * no meio do caminho que o celular toca.
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

/**
 * Tira do texto do aceite o rótulo que a tela já imprime ao lado.
 *
 * `CANDIDATE_CONSENT_TEXT.whoSees` começa com "Quem vê:", porque a constante
 * também é lida em voz corrida na conversa guiada, onde não há rótulo. Aqui
 * há, e a pessoa lia "Quem vê / Quem vê: a equipe do IEL…". O texto do aceite
 * é versionado e não se reescreve por causa de layout — então quem se ajusta
 * é a tela.
 */
/** "05/09", do jeito que a frase a diz. */
function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** "05/09/2027": a data de validade, que fica longe e precisa do ano. */
function diaMesAno(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function semRotuloRepetido(rotulo: string, texto: string): string {
  const prefixo = `${rotulo}: `;
  if (!texto.startsWith(prefixo)) return texto;
  const resto = texto.slice(prefixo.length);
  // O que vinha depois dos dois-pontos começava em minúscula.
  return resto.charAt(0).toUpperCase() + resto.slice(1);
}

export function FitQuestionnaireScreen({
  applicationId
}: {
  applicationId: string;
}) {
  const { state, dispatch } = useIelDemo();
  const existing = getFitResponse(state, applicationId);
  const reuso = reaproveitamentoDaCandidatura(state, applicationId);

  /*
   * Esta candidatura já está resolvida?
   *
   * Não basta existir um registro: desde que a resposta vale 12 meses, um
   * registro de 2025 é um registro vencido, e a vaga volta a precisar das
   * frases. "Respondido" é ter registro **e** não faltar nenhuma frase.
   */
  const respondido = existing !== null && (reuso?.faltantes ?? 0) === 0;

  // Quem já respondeu abre direto na confirmação. "Responder de novo" é
  // permitido porque a ação é idempotente por candidatura: uma pessoa tem
  // uma resposta, não duas.
  const [step, setStep] = useState<Step>(
    respondido ? { kind: 'done' } : { kind: 'consent' }
  );
  const [accepted, setAccepted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [ignoredDeadline, setIgnoredDeadline] = useState(false);
  const [retomado, setRetomado] = useState(false);
  const [faltando, setFaltando] = useState<number | null>(null);
  /*
   * "Quero responder de novo": a pessoa recusa o reaproveitamento e responde
   * todas as frases da vaga. É o desfazer que o aceite promete — sem ele, a
   * promessa de "vale sempre a sua última resposta" seria falsa.
   */
  const [responderTudo, setResponderTudo] = useState(false);
  // Verdadeiro depois de a pessoa tocar em "Começar" ou "Responder de novo".
  const mexeuRef = useRef(false);

  const application = getApplication(state, applicationId);
  const jobView = getCandidateJobView(state, applicationId);
  const validade = application
    ? validadeDasRespostas(state, application.talentId)
    : null;
  /*
   * A pessoa responde só o que esta empresa pergunta **e** ela ainda não
   * respondeu dentro dos 12 meses. Quem pediu para responder de novo vê a
   * lista inteira.
   */
  const perguntas = !application
    ? []
    : responderTudo
      ? perguntasDoCandidato(state, application.jobId)
      : perguntasQueFaltam(state, applicationId);
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

  const aoRetomar = useCallback((rascunho: RascunhoDoFit) => {
    // O aceite já tinha sido dado nesta mesma conversa, com esta mesma
    // versão de texto: retomar não pede consentimento de novo, mas também
    // não vale para um texto que mudou (`lerRascunho` barra).
    setAccepted(true);
    setAnswers(rascunho.respostas);
    setStep({ kind: 'question', index: rascunho.indice });
    setRetomado(true);
  }, []);

  const rascunho = useRascunho<RascunhoDoFit>({
    chave: `iel-rascunho:fit:${applicationId}`,
    ler: lerRascunho,
    aoRestaurar: respondido ? () => undefined : aoRetomar
  });

  // Grava a cada toque, e só depois de o navegador ter sido lido: gravar
  // antes apagaria o rascunho com o estado vazio da montagem.
  const { restaurado, gravar, apagar } = rascunho;
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
   * A base da demonstração só chega do `localStorage` num efeito, depois da
   * primeira renderização — e o passo inicial era decidido antes dela. Quem
   * respondia, fechava e abria o link de novo caía na tela de aceite, como se
   * nunca tivesse respondido, e ficava nela. Aqui a tela se corrige quando a
   * resposta aparece, sem atropelar quem pediu para responder de novo.
   */
  const nadaAPerguntar = Boolean(reuso?.nadaAPerguntar) && !responderTudo;
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
      <CandidateFrame badge={null}>
        <Card>
          <CardHeader>
            <CardTitle className="text-[22px] tracking-tight">
              <h1>Este link não abriu</h1>
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed">
              O endereço não corresponde a nenhuma inscrição. Confira a mensagem
              que você recebeu do IEL e abra o link de novo, inteiro.
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
    !respondido &&
    !ignoredDeadline;

  const restart = () => {
    mexeuRef.current = true;
    apagar();
    setAnswers({});
    setAccepted(false);
    setRetomado(false);
    setFaltando(null);
    // Quem pede para responder de novo responde tudo: metade das frases
    // reaproveitadas e metade novas não seria "de novo".
    setResponderTudo(true);
    setStep({ kind: 'consent' });
  };

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
            <CardTitle className="text-[22px] tracking-tight">
              <h1>O prazo para responder terminou</h1>
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed">
              As perguntas desta vaga ficavam abertas por dois dias. O IEL
              continua com o seu currículo: se a vaga voltar a precisar de
              respostas, você recebe um link novo.
            </CardDescription>
            {/*
             * Quem tinha resposta vencida chega aqui e precisa entender por
             * que as frases voltaram: não é a vaga pedindo duas vezes, é a
             * validade de 12 meses que o aceite prometeu.
             */}
            {reuso && reuso.vencidas > 0 ? (
              <CardDescription className="text-[15px] leading-relaxed">
                O que você respondeu antes passou de 12 meses, então as{' '}
                {reuso.perguntadas} frases voltam se você quiser responder.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full text-[15px]"
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
              <Link
                href={
                  routes.dashboard.iel.applications.byId(applicationId).index
                }
              >
                Ver minha candidatura
              </Link>
            </Button>
          </CardContent>
        </Card>
      </CandidateFrame>
    );
  }

  if (step.kind === 'done') {
    return (
      <CandidateFrame badge={badge}>
        <div className="flex flex-col gap-3">
          <span
            aria-hidden="true"
            className={`flex size-9 items-center justify-center rounded-lg ${ICONE_TINGIDO.combina}`}
          >
            <CircleCheckIcon className="size-5" />
          </span>
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Pronto!
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {/*
             * Reaproveitar sem dizer seria mostrar menos perguntas do que a
             * pessoa esperava e calar sobre o porquê. O que ela lê aqui é o
             * que aconteceu com o dado dela.
             */}
            {reuso && reuso.novas === 0 && reuso.reaproveitadas > 0
              ? `Usamos as ${reuso.reaproveitadas} respostas que você já tinha dado${reuso.desde ? ` em ${diaMes(reuso.desde)}` : ''}. Você não precisou responder nada de novo.`
              : reuso && reuso.reaproveitadas > 0
                ? `Recebemos as suas ${reuso.novas} respostas. As outras ${reuso.reaproveitadas} vieram do que você já tinha respondido${reuso.desde ? ` em ${diaMes(reuso.desde)}` : ''}.`
                : `Recebemos as suas ${totalQuestions} respostas.`}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <h2>O que acontece agora</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-4">
              <PassoDoFim numero={1}>
                O IEL compara o seu jeito de trabalhar com o de quem já trabalha
                na empresa desta vaga.
              </PassoDoFim>
              <PassoDoFim numero={2}>
                Se o seu currículo for enviado, a empresa recebe só um resumo do
                quanto vocês combinam. As suas respostas, uma a uma, ela nunca
                vê.
              </PassoDoFim>
              <PassoDoFim numero={3}>
                Se a empresa quiser conversar, quem avisa você é o IEL, pelo
                mesmo contato que mandou este link.
              </PassoDoFim>
            </ol>
          </CardContent>
          {validade?.validaAte ? (
            <CardFooter>
              {/*
                O que o aceite promete, dito de volta com a data na mão: a
                resposta é da pessoa, vale por 12 meses e poupa a próxima
                candidatura.
              */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                As suas respostas ficam guardadas até{' '}
                {diaMesAno(validade.validaAte)}. Se você se candidatar a outra
                vaga pelo IEL nesse tempo, a gente pergunta só o que faltar.
              </p>
            </CardFooter>
          ) : null}
        </Card>

        {/*
         * O fim do questionário deixou de ser o fim da jornada.
         *
         * "Você não precisa fazer mais nada agora" era verdade e, ainda assim,
         * abandonava a pessoa: ela dava as respostas e não recebia nada de
         * volta. A saída daqui é "Minha candidatura", onde cada estado diz o
         * que acontece agora — inclusive quando a empresa não segue.
         */}
        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          <Button
            size="lg"
            className="h-12 w-full text-[15px]"
            asChild
          >
            <Link
              href={routes.dashboard.iel.applications.byId(applicationId).index}
            >
              Ver minha candidatura
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full text-muted-foreground"
            onClick={restart}
          >
            Responder de novo
          </Button>
          <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
            Guarde este link: é por ele que você acompanha a sua candidatura.
          </p>
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            Demonstração: nada é enviado de verdade e este link abre direto, sem
            senha e sem cadastro.
          </p>
        </div>
      </CandidateFrame>
    );
  }

  /**
   * O que a tela diz sobre o tamanho da lista ter mudado, quando mudou.
   *
   * Três motivos possíveis, e cada um é uma frase diferente: parte das frases
   * veio de resposta anterior, as respostas anteriores passaram dos 12 meses,
   * ou a própria pessoa pediu para responder tudo de novo.
   */
  const avisoDoReuso: { titulo: string; texto: string } | null = responderTudo
    ? {
        titulo: 'Você pediu para responder de novo',
        texto: `São as ${totalQuestions} frases desta vaga. Vale sempre a sua última resposta: o que você responder agora substitui o que tinha respondido antes.`
      }
    : reuso && reuso.reaproveitadas > 0
      ? {
          titulo: `${reuso.reaproveitadas} de ${reuso.perguntadas} frases você já respondeu`,
          texto: reuso.desde
            ? `Elas vieram das suas respostas de ${diaMes(reuso.desde)} e continuam valendo, então a gente pergunta só as ${totalQuestions} que faltam. Se preferir, dá para responder tudo de novo no fim.`
            : `Elas vieram do que você já tinha respondido, então a gente pergunta só as ${totalQuestions} que faltam.`
        }
      : reuso && reuso.vencidas > 0
        ? {
            titulo: 'Suas respostas anteriores venceram',
            texto: `O que você respondeu passou de 12 meses, e depois desse prazo a gente não usa mais. Por isso as ${totalQuestions} frases voltam.`
          }
        : null;

  /*
   * Nada a perguntar: as respostas que a pessoa já deu cobrem esta vaga.
   *
   * Um formulário vazio seria a pior saída — a pessoa abriria o link, não
   * veria pergunta nenhuma e não saberia se fez o que tinha de fazer. Aqui
   * ela lê o que aconteceu com o dado dela, confirma num toque e continua
   * podendo responder tudo de novo, que é o desfazer prometido no aceite.
   *
   * O aceite reaparece porque o texto mudou junto com a regra: quem
   * consentiu sob a versão antiga não consentiu com o reuso.
   */
  if (step.kind === 'reuse' && reuso) {
    return (
      <CandidateFrame badge={badge}>
        <div className="flex flex-col gap-3">
          <span
            aria-hidden="true"
            className={`flex size-9 items-center justify-center rounded-lg ${ICONE_TINGIDO.combina}`}
          >
            <HistoryIcon className="size-5" />
          </span>
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Você já respondeu isto
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Quem pergunta é o IEL, o Centro de Empregos da Indústria. Para esta
            vaga de {jobView.activity} não há nenhuma frase nova:{' '}
            {reuso.desde
              ? `as ${reuso.perguntadas} que a empresa pergunta são as mesmas que você respondeu em ${diaMes(reuso.desde)}.`
              : `as ${reuso.perguntadas} que a empresa pergunta são as mesmas que você já respondeu.`}
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Só falta você dizer que elas podem valer aqui.
          </p>
          <TamanhoDaTarefa
            itens={['nenhuma frase nova', 'um toque', 'sem cadastro']}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <h2>{CANDIDATE_CONSENT_TEXT.title}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ConsentItem label="O que vamos usar">
              {reuso.desde
                ? `As ${reuso.perguntadas} respostas que você deu em ${diaMes(reuso.desde)}. Nenhuma frase nova é perguntada e nada de novo é coletado.`
                : `As ${reuso.perguntadas} respostas que você já tinha dado. Nenhuma frase nova é perguntada e nada de novo é coletado.`}
            </ConsentItem>
            <ConsentItem label="Quem vê">
              {semRotuloRepetido('Quem vê', CANDIDATE_CONSENT_TEXT.whoSees)}
            </ConsentItem>
            <ConsentItem label="Por quanto tempo">
              {CANDIDATE_CONSENT_TEXT.retention}
            </ConsentItem>
            <ConsentItem label="Seus direitos">
              {CANDIDATE_CONSENT_TEXT.rights}
            </ConsentItem>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 pt-1">
          <Label
            htmlFor="fit-reuse-consent"
            className="flex min-h-[60px] cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] leading-snug font-medium"
          >
            <Checkbox
              id="fit-reuse-consent"
              className="mt-0.5 size-5"
              aria-describedby="fit-reuse-ajuda"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
            />
            Li e aceito o uso das minhas respostas nesta vaga.
          </Label>
          <Button
            size="lg"
            className="h-12 w-full text-[15px]"
            disabled={!accepted}
            onClick={confirmarReuso}
          >
            Usar as minhas respostas
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full text-muted-foreground"
            onClick={restart}
          >
            Quero responder de novo
          </Button>
          <p
            id="fit-reuse-ajuda"
            className="text-center text-xs leading-relaxed text-muted-foreground"
          >
            Sem o aceite nada é usado nesta vaga. Versão do texto:{' '}
            {CANDIDATE_CONSENT_TEXT.version}.
          </p>
        </div>
      </CandidateFrame>
    );
  }

  // `reuse` sem reaproveitamento a confirmar cai aqui, no aceite normal, em
  // vez de virar tela em branco.
  if (step.kind === 'consent' || step.kind === 'reuse') {
    return (
      <CandidateFrame badge={badge}>
        <div className="flex flex-col gap-2.5">
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Como você prefere trabalhar?
          </h1>
          {/*
           * A primeira tela decide a adesão: quem abre o link não sabe o que
           * é aquilo. Então, antes do texto do aceite, quatro respostas em
           * duas frases — quem está perguntando, por causa de quê, que não é
           * prova e que não tem resposta certa.
           */}
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Quem pergunta é o IEL, o Centro de Empregos da Indústria. Você se
            inscreveu numa vaga de {jobView.activity} e esta é a última parte da
            inscrição.
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Não existe resposta certa nem errada, e ninguém está testando você.
            A gente só quer saber o seu jeito de trabalhar.
          </p>
          <TamanhoDaTarefa
            itens={[
              totalQuestions === 1 ? '1 frase' : `${totalQuestions} frases`,
              totalQuestions > 6 ? 'uns 5 minutos' : 'menos de 5 minutos',
              'sem cadastro'
            ]}
          />
        </div>

        {/*
         * Por que são 7 frases e não 10, ou por que voltaram a ser 10.
         * Mostrar menos perguntas sem explicar deixaria a pessoa em dúvida
         * sobre se respondeu o que devia — e reuso calado não é reuso
         * informado (LGPD, art. 6º, VI).
         */}
        {avisoDoReuso ? (
          <Card>
            <CardContent className="flex gap-3">
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${ICONE_TINGIDO.combina}`}
              >
                <HistoryIcon className="size-4" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[15px] leading-snug font-medium">
                  {avisoDoReuso.titulo}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {avisoDoReuso.texto}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <h2>{CANDIDATE_CONSENT_TEXT.title}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ConsentItem label="Para quê">
              {CANDIDATE_CONSENT_TEXT.purpose}
            </ConsentItem>
            <ConsentItem label="O que coletamos">
              {CANDIDATE_CONSENT_TEXT.collected}
            </ConsentItem>
            <ConsentItem label="Quem vê">
              {semRotuloRepetido('Quem vê', CANDIDATE_CONSENT_TEXT.whoSees)}
            </ConsentItem>
            <ConsentItem label="Por quanto tempo">
              {CANDIDATE_CONSENT_TEXT.retention}
            </ConsentItem>
            <ConsentItem label="Seus direitos">
              {CANDIDATE_CONSENT_TEXT.rights}
            </ConsentItem>
          </CardContent>
        </Card>

        <CaminhoDaConversa
          href={
            routes.dashboard.iel.applications.byId(applicationId).conversation
          }
        />

        <div className="flex flex-col gap-3 pt-1">
          <Label
            htmlFor="fit-consent"
            className="flex min-h-[60px] cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] leading-snug font-medium"
          >
            <Checkbox
              id="fit-consent"
              className="mt-0.5 size-5"
              aria-describedby="fit-consent-ajuda"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
            />
            Li e aceito o uso das minhas respostas.
          </Label>
          <Button
            size="lg"
            className="h-12 w-full text-[15px]"
            disabled={!accepted}
            onClick={() => {
              mexeuRef.current = true;
              setStep({ kind: 'question', index: 0 });
            }}
          >
            Começar
          </Button>
          {reuso && reuso.reaproveitadas > 0 && !responderTudo ? (
            <Button
              variant="ghost"
              size="lg"
              className="h-12 w-full text-muted-foreground"
              onClick={() => {
                setResponderTudo(true);
                setAnswers({});
                setFaltando(null);
                apagar();
              }}
            >
              Responder as {reuso.perguntadas} de novo
            </Button>
          ) : null}
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

  // Sobrou o passo das frases. O de reuso sai daqui quando não há
  // reaproveitamento a confirmar — a tela cai no aceite normal.
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
    <CandidateFrame badge={badge}>
      <div className="flex flex-col gap-2">
        {/*
         * O número da pergunta é lido no título, que recebe o foco. À direita
         * ficava "cerca de 30 s", que não é informação: o que a pessoa quer
         * saber no meio de uma fila de frases é quantas ainda faltam.
         */}
        <div
          className="flex justify-between text-[13px] text-muted-foreground"
          aria-hidden="true"
        >
          <span>{rotuloProgresso}</span>
          <span>{restantes === 0 ? 'Última' : `Faltam ${restantes}`}</span>
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
        {metade && totalQuestions > 4 ? (
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
          Você voltou de onde parou. As frases que já tinha respondido continuam
          respondidas.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <h1
          id="fit-pergunta"
          ref={tituloRef}
          tabIndex={-1}
          className="text-[22px] font-semibold leading-[1.25] tracking-tight outline-none"
        >
          <span className="sr-only">{rotuloProgresso}: </span>
          {question.item.textoSimples}
        </h1>
        <p
          id="fit-pergunta-dica"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          O quanto você concorda? Não existe resposta certa.
        </p>
      </div>

      <RadioGroup
        className="gap-2.5"
        aria-labelledby="fit-pergunta"
        aria-describedby="fit-pergunta-dica"
        value={chosen === undefined ? '' : String(chosen)}
        onValueChange={(value) => {
          const option = ESCALA_CONCORDANCIA.find(
            (entry) => String(entry.valor) === value
          );
          if (!option) return;
          setFaltando(null);
          setAnswers((current) => ({
            ...current,
            [question.itemId]: option.valor
          }));
        }}
      >
        {ESCALA_CONCORDANCIA.map((option) => {
          const selected = chosen === option.valor;
          return (
            <Label
              key={option.valor}
              htmlFor={`${question.itemId}-${option.valor}`}
              data-selected={selected ? '' : undefined}
              className="flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border p-4 text-[15px] font-medium leading-[1.35] data-[selected]:border-foreground data-[selected]:bg-muted/50 data-[selected]:ring-1 data-[selected]:ring-foreground"
            >
              <RadioGroupItem
                id={`${question.itemId}-${option.valor}`}
                className="size-[18px]"
                value={String(option.valor)}
              />
              <span>{option.rotulo}</span>
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
                <TriangleAlertIcon
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
              submit();
              return;
            }
            // O aviso de retomada cumpriu o papel na tela em que ela voltou;
            // repetido nas nove seguintes vira ruído.
            setRetomado(false);
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
          Pode fechar e voltar: o que já respondeu fica guardado. O nome da
          empresa você conhece na entrevista.
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
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-5 px-1 pt-2">
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
