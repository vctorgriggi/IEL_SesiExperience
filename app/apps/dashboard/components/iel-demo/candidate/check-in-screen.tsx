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
import { Label } from '@workspace/ui/shadcn/label';
import { Progress } from '@workspace/ui/shadcn/progress';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/shadcn/radio-group';

import { ICONE_TINGIDO } from '../metricas/cores';
import {
  AceiteCurto,
  MolduraPorLink,
  TamanhoDaTarefa
} from '../shared/fluxo-por-link';
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
 * dela. Esta tela é a segunda fonte: a própria pessoa.
 *
 * ## A condição para a verdade
 *
 * **A empresa nunca vê a resposta.** Está no aceite, na abertura e no fim.
 * Quem sabe que o chefe vai ler não diz que o turno mudou e o transporte não
 * deu; a frase é o que torna a resposta possível, não um aviso legal.
 *
 * ## Base legal
 *
 * Finalidade nova, aceite próprio (LGPD, art. 7º, I): a pessoa consentiu em
 * responder ao questionário da vaga, não em ser acompanhada depois. O aceite
 * nasce desmarcado e a versão (`CHECK_IN_CONSENT_VERSION`) vai gravada em
 * cada resposta, nunca na tela. O texto é o de `CHECK_IN_CONSENT_TEXT`: três
 * linhas na frente, o inteiro a um toque.
 *
 * ## Uma resposta por marco
 *
 * Aos 30, aos 60 e aos 90 dias, uma resposta cada — sem "mudar minha
 * resposta". Quem precisa corrigir fala com a pessoa do IEL que mandou o
 * link.
 *
 * ## Forma
 *
 * O mesmo padrão dos fluxos por link: uma pergunta por tela, alvos de 60px,
 * corpo de 15px, `h1` por passo com o foco levado até ele, rascunho no
 * navegador (`useRascunho`) para fechar e voltar em silêncio. Sem "check-in",
 * "marco" ou "acompanhamento" em nenhuma frase que a pessoa lê.
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

/** As três linhas do aceite: para quê, quem vê, por quanto tempo. */
const RESUMO_DO_ACEITE = [
  CHECK_IN_CONSENT_TEXT.purpose,
  CHECK_IN_CONSENT_TEXT.whoSees,
  CHECK_IN_CONSENT_TEXT.retention
];

/** O texto inteiro, na ordem em que a pessoa o lê. */
const TEXTO_COMPLETO_DO_ACEITE = [
  CHECK_IN_CONSENT_TEXT.purpose,
  CHECK_IN_CONSENT_TEXT.collected,
  CHECK_IN_CONSENT_TEXT.whoSees,
  CHECK_IN_CONSENT_TEXT.retention,
  CHECK_IN_CONSENT_TEXT.rights
];

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

export function CheckInScreen({
  applicationId,
  equipeLogada = false
}: {
  applicationId: string;
  /** Sessão da analista confirmada pela página: mostra o atalho de volta. */
  equipeLogada?: boolean;
}) {
  const { state, dispatch } = useIelDemo();
  const application = getApplication(state, applicationId);
  const atalho = equipeLogada ? atalhoDoCandidato(application) : undefined;
  const jobView = getCandidateJobView(state, applicationId);
  const contratacao = getSituacaoDeContratacao(state, applicationId);

  /*
   * Qual pergunta abrir: a pendente ou, quando a empresa informou saída e a
   * pessoa ainda não disse nada, a mais recente que ela alcançou. `null` é
   * "não há o que contar agora". A regra é a mesma que decide o botão da
   * Minha candidatura.
   */
  const marco: MarcoDoAcompanhamento | null = contratacao
    ? marcoParaContar(contratacao)
    : null;
  // A última resposta dada: quem abre o link sem pergunta aberta vê o que
  // já disse, em vez de "ainda não é hora".
  const ultimaResposta =
    contratacao?.checkIns[contratacao.checkIns.length - 1] ?? null;

  const [passo, setPasso] = useState<Passo>({ kind: 'consent' });
  const [aceitou, setAceitou] = useState(false);
  const [continua, setContinua] = useState<boolean | undefined>(undefined);
  const [como, setComo] = useState<ComoEstaSendo | undefined>(undefined);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  // O marco que acabou de ser respondido: depois do envio não há mais marco
  // aberto, e a tela de fim ainda precisa dizer "aos 30 dias".
  const [marcoEnviado, setMarcoEnviado] =
    useState<MarcoDoAcompanhamento | null>(null);
  // Verdadeiro depois de a pessoa tocar em "Começar": a base que chega do
  // navegador depois da primeira renderização não troca a tela por baixo.
  const mexeuRef = useRef(false);

  // Cada passo troca a tela inteira sem trocar a URL: o título do passo novo
  // recebe o foco, para o leitor de tela não voltar ao topo da página.
  const tituloRef = useFocoNoTitulo<HTMLHeadingElement>(passo.kind);

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

  // O aceite já tinha sido dado nesta mesma conversa, com esta mesma versão
  // de texto (`lerRascunho` barra outra). Retoma em silêncio.
  const aoRetomar = useCallback((rascunho: RascunhoDoCheckIn) => {
    setAceitou(true);
    setContinua(rascunho.continua);
    setComo(rascunho.comoEstaSendo);
    setComentario(rascunho.comentario);
    setPasso({ kind: rascunho.passo });
  }, []);

  const { restaurado, gravar, apagar } = useRascunho<RascunhoDoCheckIn>({
    chave: `iel-rascunho:como-esta-sendo:${applicationId}:${marco ?? 'nenhum'}`,
    ler: lerRascunho,
    aoRestaurar: marco === null ? () => undefined : aoRetomar
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
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={null}
      >
        <Card>
          <CardHeader>
            <CardTitle className="t-pergunta">
              <h1>Este link não abriu</h1>
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed">
              Confira a mensagem que você recebeu do IEL e abra o link inteiro.
            </CardDescription>
          </CardHeader>
        </Card>
      </MolduraPorLink>
    );
  }

  const etiqueta = (
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
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        <Aviso
          icone={IconClock}
          titulo="Esta pergunta ainda não é para você"
          tituloRef={tituloRef}
        >
          O IEL só pergunta como está sendo depois que a empresa registra uma
          contratação. Acompanhe pelo link da sua candidatura.
        </Aviso>
        {verCandidatura}
      </MolduraPorLink>
    );
  }

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
    setMarcoEnviado(marco);
    setPasso({ kind: 'done' });
  };

  /* ---------------------------------------------------------------- *
   * Fim
   * ---------------------------------------------------------------- */

  if (passo.kind === 'done' && continua !== undefined && como !== undefined) {
    const comoRotulo = COMO_ESTA_SENDO_LABEL[como].toLowerCase();
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
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Obrigado.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {continua
              ? `Aos ${marcoEnviado ?? marco} dias, você disse que continua na empresa e que está sendo ${comoRotulo}.`
              : `Você contou que saiu da empresa e que estava sendo ${comoRotulo}. Isso não é um erro seu e não vira nota no seu currículo.`}
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            {continua
              ? contratacao.proximoMarco !== null
                ? `Quem lê é só a equipe do IEL; a empresa não vê. A próxima pergunta é aos ${contratacao.proximoMarco} dias, por este mesmo link.`
                : 'Quem lê é só a equipe do IEL; a empresa não vê. Essa era a última pergunta dos 90 dias.'
              : 'Quem lê é só a equipe do IEL; a empresa não vê. A pessoa do IEL fala com você sobre outras vagas.'}
          </p>
        </div>

        <div className="mt-auto pt-2">{verCandidatura}</div>
      </MolduraPorLink>
    );
  }

  /* ---------------------------------------------------------------- *
   * Já respondeu, ainda não chegou, já passou
   * ---------------------------------------------------------------- */

  if (marco === null) {
    const proximo = contratacao.proximoMarco;
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        {ultimaResposta && !mexeuRef.current ? (
          /*
           * A resposta deste marco é uma só: quem volta lê o que disse e o
           * caminho para corrigir, que é o IEL — não um botão.
           */
          <Aviso
            icone={IconHistory}
            titulo="Você já respondeu"
            tituloRef={tituloRef}
            tom="combina"
          >
            {ultimaResposta.continua
              ? `Aos ${ultimaResposta.marco} dias, você disse que continua na empresa e que está sendo ${COMO_ESTA_SENDO_LABEL[ultimaResposta.comoEstaSendo].toLowerCase()}.`
              : `Aos ${ultimaResposta.marco} dias, você disse que saiu da empresa e que estava sendo ${COMO_ESTA_SENDO_LABEL[ultimaResposta.comoEstaSendo].toLowerCase()}.`}
            {ultimaResposta.comentario
              ? ` E deixou o recado: “${ultimaResposta.comentario}”`
              : null}
            {proximo !== null && ultimaResposta.continua
              ? ` A próxima pergunta é aos ${proximo} dias, por este mesmo link.`
              : null}
          </Aviso>
        ) : contratacao.porFonte.empresa === 'saiu' ? (
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
            Pela informação da empresa ao IEL, você não continua nela. Se isso
            não estiver certo, ou se quiser contar como foi, fale com a pessoa
            do IEL que mandou este link.
          </Aviso>
        ) : proximo !== null ? (
          <Aviso
            icone={IconClock}
            titulo="Ainda não é hora"
            tituloRef={tituloRef}
          >
            O IEL pergunta como está sendo aos {MARCOS_DO_ACOMPANHAMENTO[0]},{' '}
            {MARCOS_DO_ACOMPANHAMENTO[1]} e {MARCOS_DO_ACOMPANHAMENTO[2]} dias.
            A próxima pergunta é em {dias(proximo - contratacao.diasNaEmpresa)},
            por este mesmo link.
          </Aviso>
        ) : (
          <Aviso
            icone={IconClock}
            titulo="As perguntas terminaram"
            tituloRef={tituloRef}
          >
            O IEL perguntava aos 30, 60 e 90 dias, e esse tempo passou.
          </Aviso>
        )}
        {verCandidatura}
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          Precisa corrigir algo? Fale com a pessoa do IEL que mandou este link.
        </p>
      </MolduraPorLink>
    );
  }

  /* ---------------------------------------------------------------- *
   * Abertura e aceite
   * ---------------------------------------------------------------- */

  if (passo.kind === 'consent') {
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        <div className="flex flex-col gap-2.5">
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-tight tracking-tight outline-none"
          >
            Como está sendo na empresa?
          </h1>
          {/* Quem pergunta, por quê e a frase que torna a resposta possível. */}
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            O IEL, Centro de Empregos da Indústria, quer saber se a vaga de{' '}
            {jobView.activity} está dando certo. A empresa não vê o que você
            responde.
          </p>
          <TamanhoDaTarefa
            itens={['2 perguntas', '1 minuto', `aos ${marco} dias`]}
          />
        </div>

        <AceiteCurto
          id="check-in-aceite"
          titulo={CHECK_IN_CONSENT_TEXT.title}
          linhas={RESUMO_DO_ACEITE}
          textoCompleto={TEXTO_COMPLETO_DO_ACEITE}
          aceito={aceitou}
          onAceitar={setAceitou}
          rotuloDoBotao="Começar"
          onConfirmar={() => {
            mexeuRef.current = true;
            setPasso({ kind: 'continua' });
          }}
        />
      </MolduraPorLink>
    );
  }

  /* ---------------------------------------------------------------- *
   * As perguntas
   * ---------------------------------------------------------------- */

  const numero = passo.kind === 'continua' ? 1 : passo.kind === 'como' ? 2 : 3;
  const total = 3;
  const rotuloProgresso =
    passo.kind === 'comentario' ? 'Recado, opcional' : `${numero} de 2`;
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

  const voltar = (para: Passo) => (
    <Button
      variant="ghost"
      size="lg"
      className="h-12 w-full text-muted-foreground"
      onClick={() => {
        setErro(null);
        setPasso(para);
      }}
    >
      Voltar
    </Button>
  );

  // A frase que torna a resposta possível, em cada pergunta.
  const rodapeDasPerguntas = (
    <p className="text-center text-xs leading-relaxed text-muted-foreground">
      A empresa não vê nada disto.
    </p>
  );

  if (passo.kind === 'continua') {
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        {cabecalho}
        <div className="flex flex-col gap-1.5">
          <h1
            id="check-in-pergunta"
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-[1.25] tracking-tight outline-none"
          >
            Você continua na empresa?
          </h1>
          <p
            id="check-in-pergunta-dica"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            A da vaga de {jobView.activity}.
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
            onClick={() => setPasso({ kind: 'como' })}
          >
            Próxima
          </Button>
          {voltar({ kind: 'consent' })}
          {rodapeDasPerguntas}
        </div>
      </MolduraPorLink>
    );
  }

  if (passo.kind === 'como') {
    return (
      <MolduraPorLink
        atalhoDaEquipe={atalho}
        etiqueta={etiqueta}
      >
        {cabecalho}
        <div className="flex flex-col gap-1.5">
          <h1
            id="check-in-pergunta"
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-semibold leading-[1.25] tracking-tight outline-none"
          >
            {/* Quem já saiu responde no passado: "como está sendo" não cabe. */}
            {continua === false ? 'Como estava sendo?' : 'Como está sendo?'}
          </h1>
          <p
            id="check-in-pergunta-dica"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            O trabalho, no geral. Não existe resposta certa.
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
            onClick={() => setPasso({ kind: 'comentario' })}
          >
            Próxima
          </Button>
          {voltar({ kind: 'continua' })}
          {rodapeDasPerguntas}
        </div>
      </MolduraPorLink>
    );
  }

  // Sobrou o recado, que é opcional: enviar sem escrever nada é o caminho
  // normal, não uma exceção.
  const tamanho = comentario.trim().length;
  const passouDoLimite = tamanho > COMENTARIO_MAX;

  return (
    <MolduraPorLink
      atalhoDaEquipe={atalho}
      etiqueta={etiqueta}
    >
      {cabecalho}
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
        {voltar({ kind: 'como' })}
        {rodapeDasPerguntas}
      </div>
    </MolduraPorLink>
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
