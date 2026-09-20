'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from 'react';
import Link from 'next/link';
import {
  CHECK_IN_CONSENT_TEXT,
  CHECK_IN_CONSENT_VERSION,
  COMENTARIO_MAX,
  COMO_ESTA_SENDO_LABEL,
  ehComoEstaSendo,
  ehMarco,
  MARCOS_DO_ACOMPANHAMENTO,
  type ComoEstaSendo,
  type MarcoDoAcompanhamento
} from '@/features/iel-demo/analysis/acompanhamento';
import { marcoParaContar } from '@/features/iel-demo/analysis/situacao-da-candidatura';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getSituacaoDeContratacao
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
  IconHistory
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
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

import { ICONE_TINGIDO } from '../metricas/cores';
import { PassoDoFim, TamanhoDaTarefa } from '../shared/fluxo-por-link';
import { useFocoNoTitulo } from '../shared/use-foco-no-titulo';
import { useRascunho } from '../shared/use-rascunho';

/**
 * "Como está sendo?" — a pergunta do IEL a quem foi contratado, aos 30, 60 e
 * 90 dias, por link, no celular.
 *
 * ## Por que perguntar à pessoa
 *
 * O cliente disse que o RH não responde (00:05:33, 00:35:28). Enquanto só a
 * empresa puder dizer se a pessoa ficou, o dado de permanência fica refém
 * dela. Esta tela é a segunda fonte: a própria pessoa. E é também o único
 * momento em que o produto cuida de quem hoje responde 10 frases e some
 * depois de contratado.
 *
 * ## A condição para a verdade
 *
 * **A empresa nunca vê a resposta.** Está no aceite (`whoSees`), na abertura,
 * na tela de fim e na Minha candidatura. Quem sabe que o chefe vai ler não
 * diz que o turno mudou e o transporte não deu; a frase é o que torna a
 * resposta possível, não um aviso legal.
 *
 * ## Base legal
 *
 * Finalidade nova, aceite próprio (LGPD, art. 7º, I): a pessoa consentiu em
 * responder ao questionário da vaga, não em ser acompanhada depois. Por isso
 * o aceite é o passo 0, nasce desmarcado, e a versão dele
 * (`CHECK_IN_CONSENT_VERSION`) vai gravada em cada resposta (art. 8º, § 4º).
 * O texto é o de `CHECK_IN_CONSENT_TEXT`, palavra por palavra, em corpo de
 * leitura.
 *
 * ## O que não se pergunta
 *
 * Nada de chefe, equipe, saúde ou família (PRODUTO.md §5.2 e §10). São duas
 * perguntas fechadas e um recado opcional e curto, sobre o trabalho.
 *
 * ## Forma
 *
 * O mesmo padrão dos fluxos por link: uma pergunta por tela, alvos de 60px,
 * corpo de 15px, `h1` por passo com o foco levado até ele, rascunho no
 * navegador (`useRascunho`) para fechar e voltar. Sem "check-in", "marco" ou
 * "acompanhamento" em nenhuma frase que a pessoa lê: é "contar como está
 * sendo", "aos 30 dias".
 */

type Passo =
  | { kind: 'consent' }
  | { kind: 'continua' }
  | { kind: 'como' }
  | { kind: 'comentario' }
  | { kind: 'done' };

/** O que fica guardado no navegador enquanto a pessoa não envia. */
type RascunhoDoCheckIn = {
  /** Aceite de outra versão não vale para este texto. */
  versao: string;
  /** A pergunta é de um marco; outro marco, outro rascunho. */
  marco: MarcoDoAcompanhamento;
  passo: 'continua' | 'como' | 'comentario';
  continua?: boolean;
  comoEstaSendo?: ComoEstaSendo;
  comentario: string;
};

/** As cinco opções, de "muito ruim" a "muito bom", com o rótulo escrito. */
const OPCOES_DE_COMO: ComoEstaSendo[] = [1, 2, 3, 4, 5];

/** "1 dia", "45 dias". */
function dias(n: number): string {
  return n === 1 ? '1 dia' : `${n} dias`;
}

/**
 * Tira do texto do aceite o rótulo que a tela já imprime ao lado
 * (`whoSees` começa com "Quem vê", e a pessoa leria a palavra duas vezes).
 * O texto é versionado e não se reescreve por causa de layout.
 */
function semRotuloRepetido(rotulo: string, texto: string): string {
  const prefixo = `${rotulo} é `;
  if (!texto.startsWith(prefixo)) return texto;
  const resto = texto.slice(prefixo.length);
  return resto.charAt(0).toUpperCase() + resto.slice(1);
}

export function CheckInScreen({ applicationId }: { applicationId: string }) {
  const { state, dispatch } = useIelDemo();
  const application = getApplication(state, applicationId);
  const jobView = getCandidateJobView(state, applicationId);
  const contratacao = getSituacaoDeContratacao(state, applicationId);

  /*
   * Qual pergunta abrir: a pendente, a última respondida (para corrigir) ou,
   * quando a empresa informou saída e a pessoa ainda não disse nada, a mais
   * recente que ela alcançou. `null` é "não há o que contar agora". A regra
   * é a mesma que decide o botão da Minha candidatura.
   */
  const marco: MarcoDoAcompanhamento | null = contratacao
    ? marcoParaContar(contratacao)
    : null;
  const respostaDoMarco =
    marco !== null
      ? (contratacao?.checkIns.find((resposta) => resposta.marco === marco) ??
        null)
      : null;
  const jaRespondeu = respostaDoMarco !== null;

  const [passo, setPasso] = useState<Passo>({ kind: 'consent' });
  const [aceitou, setAceitou] = useState(false);
  const [continua, setContinua] = useState<boolean | undefined>(undefined);
  const [como, setComo] = useState<ComoEstaSendo | undefined>(undefined);
  const [comentario, setComentario] = useState('');
  const [retomado, setRetomado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // "Mudar minha resposta": a pessoa quer corrigir o que já enviou.
  const [corrigindo, setCorrigindo] = useState(false);
  // Verdadeiro depois de a pessoa tocar em "Começar" ou "Mudar minha resposta".
  const mexeuRef = useRef(false);

  // Cada passo troca a tela inteira sem trocar a URL: o título do passo novo
  // recebe o foco, para o leitor de tela não voltar ao topo da página.
  // Só o passo e o pedido de correção: a resposta que chega do `localStorage`
  // na hidratação troca a tela, mas não é um toque da pessoa, e o foco não
  // se move sozinho na primeira leitura.
  const tituloRef = useFocoNoTitulo<HTMLHeadingElement>(
    `${passo.kind}:${corrigindo}`
  );

  const lerRascunho = useCallback(
    (bruto: unknown): RascunhoDoCheckIn | null => {
      if (!bruto || typeof bruto !== 'object') return null;
      const dado = bruto as Partial<RascunhoDoCheckIn>;
      if (dado.versao !== CHECK_IN_CONSENT_VERSION) return null;
      if (!ehMarco(dado.marco) || dado.marco !== marco) return null;
      if (
        dado.passo !== 'continua' &&
        dado.passo !== 'como' &&
        dado.passo !== 'comentario'
      ) {
        return null;
      }
      const rascunho: RascunhoDoCheckIn = {
        versao: dado.versao,
        marco: dado.marco,
        passo: dado.passo,
        comentario:
          typeof dado.comentario === 'string'
            ? dado.comentario.slice(0, COMENTARIO_MAX)
            : ''
      };
      if (typeof dado.continua === 'boolean') rascunho.continua = dado.continua;
      if (ehComoEstaSendo(dado.comoEstaSendo)) {
        rascunho.comoEstaSendo = dado.comoEstaSendo;
      }
      // Sem nenhuma resposta não há o que retomar.
      if (rascunho.continua === undefined) return null;
      return rascunho;
    },
    [marco]
  );

  const aoRetomar = useCallback((rascunho: RascunhoDoCheckIn) => {
    // O aceite já tinha sido dado nesta mesma conversa, com esta mesma
    // versão de texto (`lerRascunho` barra outra versão).
    setAceitou(true);
    setContinua(rascunho.continua);
    setComo(rascunho.comoEstaSendo);
    setComentario(rascunho.comentario);
    setPasso({ kind: rascunho.passo });
    setRetomado(true);
  }, []);

  const { restaurado, gravar, apagar } = useRascunho<RascunhoDoCheckIn>({
    chave: `iel-rascunho:como-esta-sendo:${applicationId}:${marco ?? 'nenhum'}`,
    ler: lerRascunho,
    aoRestaurar: jaRespondeu ? () => undefined : aoRetomar
  });

  // Grava a cada toque, e só depois de o navegador ter sido lido: gravar
  // antes apagaria o rascunho com o estado vazio da montagem.
  useEffect(() => {
    if (!restaurado || marco === null) return;
    if (
      passo.kind !== 'continua' &&
      passo.kind !== 'como' &&
      passo.kind !== 'comentario'
    ) {
      return;
    }
    if (continua === undefined) return;
    const rascunho: RascunhoDoCheckIn = {
      versao: CHECK_IN_CONSENT_VERSION,
      marco,
      passo: passo.kind,
      continua,
      comentario
    };
    if (como !== undefined) rascunho.comoEstaSendo = como;
    gravar(rascunho);
  }, [restaurado, marco, passo, continua, como, comentario, gravar]);

  const rotas = routes.dashboard.iel.applications.byId(applicationId);

  if (!application || !jobView) {
    return (
      <Moldura badge={null}>
        <Card>
          <CardHeader>
            <CardTitle className="text-[22px] tracking-tight">
              <h1>Este link não abriu</h1>
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed">
              O endereço não corresponde a nenhuma candidatura. Confira a
              mensagem que você recebeu do IEL e abra o link de novo, inteiro.
            </CardDescription>
          </CardHeader>
        </Card>
      </Moldura>
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

  const verCandidatura = (
    <Button
      size="lg"
      className="h-12 w-full text-[15px]"
      asChild
    >
      <Link href={rotas.index}>Ver minha candidatura</Link>
    </Button>
  );

  /*
   * Sem contratação registrada, a pergunta não é para esta pessoa. Pode ser
   * um link antigo, um endereço digitado ou uma candidatura que ainda está
   * em análise: em todos os casos, o caminho é a candidatura.
   */
  if (!contratacao) {
    return (
      <Moldura badge={badge}>
        <Aviso
          icone={IconClock}
          titulo="Esta pergunta ainda não é para você"
          tituloRef={tituloRef}
        >
          O IEL só pergunta como está sendo depois que a empresa registra uma
          contratação, e nesta candidatura isso ainda não aconteceu. Você
          acompanha em que pé está pelo link da sua candidatura.
        </Aviso>
        {verCandidatura}
      </Moldura>
    );
  }

  const comecar = () => {
    mexeuRef.current = true;
    setPasso({ kind: 'continua' });
  };

  const corrigir = () => {
    mexeuRef.current = true;
    apagar();
    setAceitou(false);
    setContinua(undefined);
    setComo(undefined);
    setComentario('');
    setRetomado(false);
    setErro(null);
    setCorrigindo(true);
    setPasso({ kind: 'consent' });
  };

  const enviar = () => {
    if (marco === null) return;
    // Não dá para chegar aqui pela tela — cada botão só abre com a resposta
    // dada —, mas um rascunho truncado deixaria a pessoa tocando num botão
    // que não faz nada. Melhor dizer o que falta e levar até lá.
    if (continua === undefined) {
      setErro('Falta responder se você continua na empresa.');
      setPasso({ kind: 'continua' });
      return;
    }
    if (como === undefined) {
      setErro('Falta responder como está sendo.');
      setPasso({ kind: 'como' });
      return;
    }
    const recado = comentario.trim();
    if (recado.length > COMENTARIO_MAX) {
      setErro(
        `O recado pode ter até ${COMENTARIO_MAX} letras. O seu tem ${recado.length}.`
      );
      return;
    }

    dispatch({
      type: 'answer-check-in',
      applicationId,
      marco,
      continua,
      comoEstaSendo: como,
      ...(recado ? { comentario: recado } : {}),
      at: nowIso(),
      consentVersion: CHECK_IN_CONSENT_VERSION
    });
    apagar();
    setErro(null);
    setPasso({ kind: 'done' });
  };

  /* ---------------------------------------------------------------- *
   * Fim
   * ---------------------------------------------------------------- */

  if (passo.kind === 'done' && continua !== undefined && como !== undefined) {
    const comoRotulo = COMO_ESTA_SENDO_LABEL[como].toLowerCase();
    return (
      <Moldura badge={badge}>
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
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Obrigado!
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {continua
              ? `Recebemos as suas respostas dos ${marco} dias. Você disse que continua na empresa e que está sendo ${comoRotulo}.`
              : `Recebemos as suas respostas. Você contou que saiu da empresa e que estava sendo ${comoRotulo}. Obrigado por avisar: isso não é um erro seu e não vira nota no seu currículo.`}
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
                A equipe do IEL lê o que você respondeu. A empresa não vê.
              </PassoDoFim>
              {continua ? (
                <>
                  <PassoDoFim numero={2}>
                    {contratacao.proximoMarco !== null
                      ? `A próxima pergunta é aos ${contratacao.proximoMarco} dias, por este mesmo link.`
                      : 'Essa era a última pergunta dos 90 dias. O IEL não pergunta mais nada por este link.'}
                  </PassoDoFim>
                  <PassoDoFim numero={3}>
                    Mudou alguma coisa? Responda de novo por este link: vale a
                    última resposta.
                  </PassoDoFim>
                </>
              ) : (
                <>
                  <PassoDoFim numero={2}>
                    A pessoa do IEL fala com você sobre outras vagas, pelo mesmo
                    telefone da sua candidatura.
                  </PassoDoFim>
                  <PassoDoFim numero={3}>
                    Seu currículo continua no banco de talentos do IEL. Você não
                    precisa se cadastrar de novo.
                  </PassoDoFim>
                </>
              )}
            </ol>
          </CardContent>
        </Card>

        <div className="mt-auto flex flex-col gap-2.5 pt-2">
          {verCandidatura}
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full text-muted-foreground"
            onClick={corrigir}
          >
            Responder de novo
          </Button>
          <Rodape />
        </div>
      </Moldura>
    );
  }

  /* ---------------------------------------------------------------- *
   * Já respondeu, ainda não chegou, já passou
   * ---------------------------------------------------------------- */

  if (jaRespondeu && respostaDoMarco && !corrigindo && !mexeuRef.current) {
    const comoRotulo =
      COMO_ESTA_SENDO_LABEL[respostaDoMarco.comoEstaSendo].toLowerCase();
    return (
      <Moldura badge={badge}>
        <Aviso
          icone={IconHistory}
          titulo="Você já respondeu"
          tituloRef={tituloRef}
          tom="combina"
        >
          {respostaDoMarco.continua
            ? `Aos ${marco} dias, você disse que continua na empresa e que está sendo ${comoRotulo}.`
            : `Aos ${marco} dias, você disse que saiu da empresa e que estava sendo ${comoRotulo}.`}
          {respostaDoMarco.comentario
            ? ` E deixou o recado: “${respostaDoMarco.comentario}”`
            : null}
        </Aviso>
        <div className="flex flex-col gap-2.5">
          {verCandidatura}
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full text-[15px]"
            onClick={corrigir}
          >
            Mudar minha resposta
          </Button>
          <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
            Vale sempre a sua última resposta. A empresa não vê nenhuma delas.
          </p>
        </div>
      </Moldura>
    );
  }

  if (marco === null) {
    const proximo = contratacao.proximoMarco;
    return (
      <Moldura badge={badge}>
        {contratacao.porFonte.empresa === 'saiu' ? (
          /*
           * A empresa informou saída antes dos 30 dias e a pessoa não chegou
           * a nenhuma pergunta. Neutro, sem o motivo que a empresa deu, e
           * com o caminho para ela contar a versão dela.
           */
          <Aviso
            icone={IconClock}
            titulo="Não há pergunta aberta agora"
            tituloRef={tituloRef}
          >
            Pelo que a empresa informou ao IEL, você não continua nela, e por
            isso o IEL não pergunta mais por este link. Se isso não estiver
            certo, ou se quiser contar como foi, procure o Centro de Empregos do
            IEL pelo mesmo contato que mandou este link.
          </Aviso>
        ) : proximo !== null ? (
          <Aviso
            icone={IconClock}
            titulo="Ainda não é hora"
            tituloRef={tituloRef}
          >
            O IEL pergunta como está sendo aos {MARCOS_DO_ACOMPANHAMENTO[0]},{' '}
            {MARCOS_DO_ACOMPANHAMENTO[1]} e {MARCOS_DO_ACOMPANHAMENTO[2]} dias.
            Você foi contratado há {dias(contratacao.diasNaEmpresa)}; a próxima
            pergunta é em {dias(proximo - contratacao.diasNaEmpresa)}, por este
            mesmo link.
          </Aviso>
        ) : (
          <Aviso
            icone={IconClock}
            titulo="As perguntas terminaram"
            tituloRef={tituloRef}
          >
            O IEL perguntava como estava sendo aos 30, 60 e 90 dias, e esse
            tempo passou. Se quiser contar alguma coisa, procure o Centro de
            Empregos do IEL pelo mesmo contato que mandou este link.
          </Aviso>
        )}
        {verCandidatura}
      </Moldura>
    );
  }

  /* ---------------------------------------------------------------- *
   * Abertura e aceite
   * ---------------------------------------------------------------- */

  if (passo.kind === 'consent') {
    return (
      <Moldura badge={badge}>
        <div className="flex flex-col gap-2.5">
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Como está sendo na empresa?
          </h1>
          {/*
           * A primeira tela decide a adesão. Antes do texto do aceite: quem
           * pergunta, por quê, quanto tempo leva e — a frase que torna a
           * resposta possível — que a empresa não vê.
           */}
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            Quem pergunta é o IEL, o Centro de Empregos da Indústria. Foi por
            ele que você chegou à vaga de {jobView.activity}, e agora que você
            foi contratado a gente quer saber se está dando certo.
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            São duas perguntas. A empresa não vê o que você responde: quem lê é
            só a equipe do IEL, e nada disso vira avaliação sua.
          </p>
          <TamanhoDaTarefa
            itens={['2 perguntas', '1 minuto', `aos ${marco} dias`]}
          />
        </div>

        {corrigindo ? (
          <Card>
            <CardContent className="flex gap-3">
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${ICONE_TINGIDO.combina}`}
              >
                <IconHistory className="size-4" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-[15px] leading-snug font-medium">
                  Você pediu para responder de novo
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Vale sempre a sua última resposta: o que você responder agora
                  substitui o que tinha respondido aos {marco} dias.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <h2>{CHECK_IN_CONSENT_TEXT.title}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ItemDoAceite label="Para quê">
              {CHECK_IN_CONSENT_TEXT.purpose}
            </ItemDoAceite>
            <ItemDoAceite label="O que guardamos">
              {CHECK_IN_CONSENT_TEXT.collected}
            </ItemDoAceite>
            <ItemDoAceite label="Quem vê">
              {semRotuloRepetido('Quem vê', CHECK_IN_CONSENT_TEXT.whoSees)}
            </ItemDoAceite>
            <ItemDoAceite label="Por quanto tempo">
              {CHECK_IN_CONSENT_TEXT.retention}
            </ItemDoAceite>
            <ItemDoAceite label="Seus direitos">
              {CHECK_IN_CONSENT_TEXT.rights}
            </ItemDoAceite>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 pt-1">
          <Label
            htmlFor="check-in-aceite"
            className="flex min-h-[60px] cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] leading-snug font-medium"
          >
            <Checkbox
              id="check-in-aceite"
              className="mt-0.5 size-5"
              aria-describedby="check-in-aceite-ajuda"
              checked={aceitou}
              onCheckedChange={(valor) => setAceitou(valor === true)}
            />
            Li e aceito responder ao IEL.
          </Label>
          <Button
            size="lg"
            className="h-12 w-full text-[15px]"
            disabled={!aceitou}
            onClick={comecar}
          >
            Começar
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 w-full text-muted-foreground"
            asChild
          >
            <Link href={rotas.index}>Ver minha candidatura</Link>
          </Button>
          <p
            id="check-in-aceite-ajuda"
            className="text-center text-xs leading-relaxed text-muted-foreground"
          >
            Sem o aceite as perguntas não abrem. Versão do texto:{' '}
            {CHECK_IN_CONSENT_VERSION}.
          </p>
        </div>
      </Moldura>
    );
  }

  /* ---------------------------------------------------------------- *
   * As perguntas
   * ---------------------------------------------------------------- */

  const numero = passo.kind === 'continua' ? 1 : passo.kind === 'como' ? 2 : 3;
  const total = 3;
  const rotuloProgresso =
    passo.kind === 'comentario'
      ? 'Recado, opcional'
      : `Pergunta ${numero} de 2`;
  const valorProgresso = Math.round((numero / total) * 100);

  const alerta = erro ? (
    <Card
      role="alert"
      className="gap-2 py-4"
    >
      <CardContent>
        <p className="flex items-start gap-2 text-[15px] leading-snug font-medium">
          <IconAlertTriangle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
          />
          {erro}
        </p>
      </CardContent>
    </Card>
  ) : null;

  const retomada = retomado ? (
    <p
      role="status"
      className="rounded-lg border border-dashed px-3 py-2 text-[13px] leading-relaxed text-muted-foreground"
    >
      Você voltou de onde parou. O que já tinha respondido continua respondido.
    </p>
  ) : null;

  const cabecalho = (
    <div className="flex flex-col gap-2">
      <div
        className="flex justify-between text-[13px] text-muted-foreground"
        aria-hidden="true"
      >
        <span>{rotuloProgresso}</span>
        <span>Aos {marco} dias</span>
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
  );

  const voltar = (para: Passo, rotulo: string) => (
    <Button
      variant="ghost"
      size="lg"
      className="h-12 w-full text-muted-foreground"
      onClick={() => {
        setErro(null);
        setRetomado(false);
        setPasso(para);
      }}
    >
      {rotulo}
    </Button>
  );

  const rodapeDasPerguntas = (
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      Pode fechar e voltar: o que já respondeu fica guardado. A empresa não vê
      nada disto.
    </p>
  );

  if (passo.kind === 'continua') {
    return (
      <Moldura badge={badge}>
        {cabecalho}
        {retomada}
        <div className="flex flex-col gap-1.5">
          <h1
            id="check-in-pergunta"
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-[1.25] tracking-tight outline-none"
          >
            <span className="sr-only">{rotuloProgresso}: </span>
            Você continua na empresa?
          </h1>
          <p
            id="check-in-pergunta-dica"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            A da vaga de {jobView.activity}, em que o IEL indicou você.
          </p>
        </div>

        <RadioGroup
          className="gap-2.5"
          aria-labelledby="check-in-pergunta"
          aria-describedby="check-in-pergunta-dica"
          value={continua === undefined ? '' : continua ? 'sim' : 'nao'}
          onValueChange={(valor) => {
            setErro(null);
            setContinua(valor === 'sim');
          }}
        >
          <Opcao
            id="check-in-continua-sim"
            valor="sim"
            selecionada={continua === true}
          >
            Sim, continuo
          </Opcao>
          <Opcao
            id="check-in-continua-nao"
            valor="nao"
            selecionada={continua === false}
          >
            Não, saí
          </Opcao>
        </RadioGroup>

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          {alerta}
          <Button
            size="lg"
            className="h-12 w-full text-[15px]"
            disabled={continua === undefined}
            onClick={() => {
              setRetomado(false);
              setPasso({ kind: 'como' });
            }}
          >
            Próxima
          </Button>
          {voltar({ kind: 'consent' }, 'Voltar ao começo')}
          {rodapeDasPerguntas}
        </div>
      </Moldura>
    );
  }

  if (passo.kind === 'como') {
    return (
      <Moldura badge={badge}>
        {cabecalho}
        {retomada}
        <div className="flex flex-col gap-1.5">
          <h1
            id="check-in-pergunta"
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-[1.25] tracking-tight outline-none"
          >
            <span className="sr-only">{rotuloProgresso}: </span>
            {/* Quem já saiu responde no passado: "como está sendo" não cabe. */}
            {continua === false ? 'Como estava sendo?' : 'Como está sendo?'}
          </h1>
          <p
            id="check-in-pergunta-dica"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            O trabalho, no geral. Não existe resposta certa: é só o seu jeito de
            ver.
          </p>
        </div>

        <RadioGroup
          className="gap-2.5"
          aria-labelledby="check-in-pergunta"
          aria-describedby="check-in-pergunta-dica"
          value={como === undefined ? '' : String(como)}
          onValueChange={(valor) => {
            const escolhido = Number(valor);
            if (!ehComoEstaSendo(escolhido)) return;
            setErro(null);
            setComo(escolhido);
          }}
        >
          {OPCOES_DE_COMO.map((opcao) => (
            <Opcao
              key={opcao}
              id={`check-in-como-${opcao}`}
              valor={String(opcao)}
              selecionada={como === opcao}
            >
              {COMO_ESTA_SENDO_LABEL[opcao]}
            </Opcao>
          ))}
        </RadioGroup>

        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          {alerta}
          <Button
            size="lg"
            className="h-12 w-full text-[15px]"
            disabled={como === undefined}
            onClick={() => {
              setRetomado(false);
              setPasso({ kind: 'comentario' });
            }}
          >
            Próxima
          </Button>
          {voltar({ kind: 'continua' }, 'Voltar uma pergunta')}
          {rodapeDasPerguntas}
        </div>
      </Moldura>
    );
  }

  // Sobrou o recado, que é opcional: enviar sem escrever nada é o caminho
  // normal, não uma exceção.
  const tamanho = comentario.trim().length;
  const passouDoLimite = tamanho > COMENTARIO_MAX;

  return (
    <Moldura badge={badge}>
      {cabecalho}
      {retomada}
      <div className="flex flex-col gap-1.5">
        <h1
          ref={tituloRef}
          tabIndex={-1}
          className="text-[22px] font-semibold leading-[1.25] tracking-tight outline-none"
        >
          Quer contar algo?
        </h1>
        <p
          id="check-in-recado-dica"
          className="text-sm leading-relaxed text-muted-foreground"
        >
          Opcional. Uma frase sobre o trabalho: horário, tarefas, o que
          combinaram e o que mudou. Não precisa falar de ninguém.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="check-in-recado"
          className="sr-only"
        >
          Recado para o IEL
        </Label>
        <textarea
          id="check-in-recado"
          value={comentario}
          onChange={(evento) => {
            setErro(null);
            setComentario(evento.target.value);
          }}
          rows={4}
          aria-describedby="check-in-recado-dica check-in-recado-contador"
          aria-invalid={passouDoLimite || undefined}
          className="min-h-28 w-full resize-none rounded-xl border bg-background p-4 text-[15px] leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:ring-[3px] aria-invalid:ring-destructive/40"
          placeholder="Pode deixar em branco."
        />
        <p
          id="check-in-recado-contador"
          className="text-right text-xs tabular-nums text-muted-foreground"
        >
          {tamanho} de {COMENTARIO_MAX} letras
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pt-4">
        {alerta}
        <Button
          size="lg"
          className="h-12 w-full text-[15px]"
          disabled={passouDoLimite}
          onClick={enviar}
        >
          {tamanho === 0 ? 'Enviar sem recado' : 'Enviar'}
        </Button>
        {voltar({ kind: 'como' }, 'Voltar uma pergunta')}
        {rodapeDasPerguntas}
      </div>
    </Moldura>
  );
}

/* ------------------------------------------------------------------ *
 * Peças
 * ------------------------------------------------------------------ */

/** Uma alternativa grande, com o rótulo escrito: 60px de alvo. */
function Opcao({
  id,
  valor,
  selecionada,
  children
}: {
  id: string;
  valor: string;
  selecionada: boolean;
  children: ReactNode;
}) {
  return (
    <Label
      htmlFor={id}
      data-selected={selecionada ? '' : undefined}
      className="flex min-h-[60px] cursor-pointer items-center gap-3 rounded-xl border p-4 text-[15px] font-medium leading-[1.35] data-[selected]:border-foreground data-[selected]:bg-muted/50 data-[selected]:ring-1 data-[selected]:ring-foreground"
    >
      <RadioGroupItem
        id={id}
        className="size-[18px]"
        value={valor}
      />
      <span>{children}</span>
    </Label>
  );
}

/**
 * Um estado sem pergunta: ainda não é hora, já respondeu, não é para você.
 * Ícone com a palavra ao lado, `h1` com foco, e o caminho logo abaixo.
 */
function Aviso({
  icone: Icone,
  titulo,
  tituloRef,
  tom = 'neutro',
  children
}: {
  icone: TablerIcon;
  titulo: string;
  tituloRef: RefObject<HTMLHeadingElement | null>;
  tom?: 'neutro' | 'combina';
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <span
        aria-hidden="true"
        className={`flex size-9 items-center justify-center rounded-lg ${ICONE_TINGIDO[tom]}`}
      >
        <Icone className="size-5" />
      </span>
      <h1
        ref={tituloRef}
        tabIndex={-1}
        className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
      >
        {titulo}
      </h1>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function ItemDoAceite({
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

function Rodape() {
  return (
    <>
      <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
        Guarde este link: é por ele que o IEL pergunta de novo aos 60 e aos 90
        dias.
      </p>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Demonstração: nada é enviado de verdade e este link abre direto, sem
        senha e sem cadastro.
      </p>
    </>
  );
}

/**
 * A mesma moldura das outras telas do candidato: o quadrado da marca já vem
 * da casca por link, então aqui fica só a etiqueta da vaga.
 */
function Moldura({
  badge,
  children
}: {
  badge: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col gap-5 px-1 pt-2">
      <div className="flex items-center justify-end gap-2">{badge}</div>
      {children}
    </div>
  );
}
