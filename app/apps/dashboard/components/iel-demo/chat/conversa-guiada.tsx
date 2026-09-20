'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode
} from 'react';
import Image from 'next/image';
import type { ValorDaEscala } from '@/features/iel-demo/analysis/instrumento';
import {
  iniciarConversa,
  opcoesEmEspera,
  passoEmEspera,
  progressoDaConversa,
  responder,
  ultimaRespostaMutavel,
  voltar,
  type AcaoFinal,
  type ConversaRoteiro,
  type EstadoConversa,
  type MensagemConversa,
  type ReguaDoPasso
} from '@/features/iel-demo/chat/motor';
import { nowIso } from '@/features/iel-demo/state/storage';
import { IconSquare, IconVolume } from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import { Progress } from '@workspace/ui/shadcn/progress';
import { ScrollArea } from '@workspace/ui/shadcn/scroll-area';
import { Skeleton } from '@workspace/ui/shadcn/skeleton';

import { FraseOriginal } from '../shared/fluxo-por-link';
import {
  ReguaDeConcordancia,
  type OrigemDaResposta
} from '../shared/regua-de-concordancia';
import { useRascunho } from '../shared/use-rascunho';
import { useMovimentoReduzido, useVoz, type Voz } from './use-voz';

/**
 * A conversa guiada no celular (C2): o IEL fala, a pessoa toca.
 *
 * ## Por que botão e não texto
 *
 * O público é operacional, no celular, com baixo letramento digital (R10).
 * Escrever é a parte difícil; escolher entre três frases lidas (ou ouvidas)
 * não é. Botão também garante que o dado coletado é exatamente o que a
 * finalidade pede — uma alternativa por pergunta — e nada de texto livre que
 * poderia trazer, sem querer, saúde, família ou religião (LGPD, art. 6º, III).
 *
 * ## Ritmo
 *
 * Cada fala do IEL entra depois de um "digitando…" de 0,6 a 0,9 s: dá tempo de
 * ler a anterior e marca quem está falando. Com `prefers-reduced-motion`, não
 * há animação nem espera — tudo entra de uma vez.
 *
 * ## A cena e a régua
 *
 * Numa frase do instrumento, a bolha traz a cena ("Chega uma tarefa nova. Eu
 * começo e vou ajustando no caminho.") com a frase original do cliente a um
 * toque, e o rodapé mostra a régua de um toque no lugar dos cinco botões:
 * o degrau tocado se preenche e, um instante depois, vira a resposta. Pelo
 * teclado a régua só seleciona, e um botão "Confirmar" aparece para fechar
 * a resposta (Enter também serve).
 *
 * ## Áudio
 *
 * Cada bolha do IEL tem "Ouvir"; numa pergunta, a leitura inclui a cena e
 * os degraus da régua.
 * "Ouvir tudo", no topo, começa desligado e, ligado, lê o bloco atual e cada
 * fala nova. Só leitura: nada é gravado.
 *
 * O componente é o motor com cara. O roteiro, o que vira dado e o que
 * acontece no fim são de quem o monta (`conversa-candidato`,
 * `conversa-colaborador`).
 */
export type ConversaGuiadaProps = {
  roteiro: ConversaRoteiro;
  /** Uma linha de contexto no topo da conversa (ex.: "Vaga de Assistente"). */
  contexto?: ReactNode;
  /** Primeiro toque da pessoa: quem monta congela o roteiro a partir daqui. */
  onPrimeiraResposta?: () => void;
  /** O fim foi alcançado depois do aceite: as respostas, chave → opção. */
  onConcluir?: (respostas: Record<string, string>) => void;
  /** As ações do fim, desenhadas por quem monta. */
  renderAcoesFinais?: (acoes: AcaoFinal[]) => ReactNode;
  /**
   * O que entra na conversa logo depois da primeira fala do fim ("Pronto,
   * recebemos…") e antes das seguintes, que dizem o que acontece agora: é
   * onde a devolutiva pessoal cabe. Só depois do aceite.
   */
  renderFim?: (respostas: Record<string, string>) => ReactNode;
  /**
   * Verdadeiro quando a conversa recomeça por um toque da pessoa ("Responder
   * de novo"): o botão que ela tocou some, e o foco precisa de um lugar para
   * ir que não seja o topo da página.
   */
  focarAoAbrir?: boolean;
  /**
   * Chave do rascunho no navegador (uma por link). Sem ela, fechar a aba na
   * frase 9 joga fora as oito anteriores — e quem responde no celular, no
   * intervalo do turno, fecha a aba.
   */
  rascunhoChave?: string;
};

/** A conversa como ela cabe no navegador da pessoa. */
type RascunhoDaConversa = {
  /** Outro roteiro (já respondeu, venceu) não retoma este rascunho. */
  roteiroId: string;
  /** Muda a lista de frases, muda a contagem: o rascunho deixa de valer. */
  passos: number;
  estado: EstadoConversa;
};

function atrasoDe(texto: string): number {
  return 600 + Math.min(300, texto.length * 3);
}

function hora(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ConversaGuiada({
  roteiro,
  contexto,
  onPrimeiraResposta,
  onConcluir,
  renderAcoesFinais,
  renderFim,
  focarAoAbrir = false,
  rascunhoChave
}: ConversaGuiadaProps) {
  const [estado, setEstado] = useState<EstadoConversa>(() =>
    iniciarConversa(roteiro, nowIso())
  );
  const [revelados, setRevelados] = useState(0);
  const [digitando, setDigitando] = useState(false);
  const [ouvirTudo, setOuvirTudo] = useState(false);

  const reduzir = useMovimentoReduzido();
  const voz = useVoz();

  const fimRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  // O grupo de resposta do rodapé: botões ou régua. O foco vai para o
  // primeiro botão que houver nele.
  const opcoesRef = useRef<HTMLDivElement>(null);
  const acoesRef = useRef<HTMLDivElement>(null);
  const esperaRef = useRef<HTMLParagraphElement>(null);
  const ultimoFaladoRef = useRef(-1);
  // Depois que a pessoa tocou em algo, o foco acompanha a conversa. Antes
  // disso, mover o foco atropelaria a leitura da página que acabou de abrir.
  const respondeuRef = useRef(focarAoAbrir);
  const baseId = useId();

  const { historico } = estado;

  /*
   * Fechar e voltar.
   *
   * A conversa inteira é um objeto de dados (o motor é puro), então retomar é
   * devolver o estado e pular a animação: o histórico já revelado entra de
   * uma vez, e a pessoa cai no mesmo botão em que parou. Um rascunho de outro
   * roteiro — porque ela respondeu nesse meio-tempo, ou porque o link venceu
   * — é descartado em vez de reaproveitado.
   */
  const lerRascunho = useCallback(
    (bruto: unknown): RascunhoDaConversa | null => {
      if (!bruto || typeof bruto !== 'object') return null;
      const dado = bruto as Partial<RascunhoDaConversa>;
      if (dado.roteiroId !== roteiro.id) return null;
      if (dado.passos !== roteiro.passos.length) return null;
      const guardado = dado.estado;
      if (!guardado || !Array.isArray(guardado.historico)) return null;
      // Conversa acabada ou recusada não se retoma: ou o dado já foi
      // gravado, ou a pessoa disse não.
      if (guardado.encerrada || guardado.aceite !== 'aceito') return null;
      if (Object.keys(guardado.respostas ?? {}).length === 0) return null;
      return {
        roteiroId: roteiro.id,
        passos: roteiro.passos.length,
        estado: guardado
      };
    },
    [roteiro]
  );

  // Quem monta troca a função a cada renderização; a retomada acontece uma
  // vez, no efeito de leitura do navegador, e chama a versão atual.
  const onPrimeiraRespostaRef = useRef(onPrimeiraResposta);
  useEffect(() => {
    onPrimeiraRespostaRef.current = onPrimeiraResposta;
  });

  const aoRetomar = useCallback((rascunho: RascunhoDaConversa) => {
    setEstado(rascunho.estado);
    // Sem isto, as falas já lidas voltariam a entrar uma a uma, com
    // "digitando…" entre elas — a pessoa esperaria de novo o que já leu.
    setRevelados(rascunho.estado.historico.length);
    respondeuRef.current = true;
    // Retomar vale como o primeiro toque: quem monta congela o roteiro aqui.
    // Sem isto, a última resposta mudava o estado para "já respondeu", o
    // roteiro trocava no meio e a pessoa nunca via o "Pronto, obrigado".
    onPrimeiraRespostaRef.current?.();
  }, []);

  const { restaurado, gravar, apagar } = useRascunho<RascunhoDaConversa>({
    chave: rascunhoChave ?? '',
    ler: lerRascunho,
    aoRestaurar: rascunhoChave ? aoRetomar : () => undefined
  });

  const roteiroId = roteiro.id;
  const totalDePassos = roteiro.passos.length;
  useEffect(() => {
    if (!rascunhoChave || !restaurado) return;
    if (estado.encerrada || estado.aceite !== 'aceito') {
      // O fim apaga o rascunho: o que valia como "continue de onde parou" já
      // virou resposta gravada. Só o fim a que a pessoa chegou tocando: a
      // base da demonstração chega do navegador depois da primeira
      // renderização, e nesse instante um convite reenviado ao vivo ainda
      // parece vencido — um roteiro só de fim, que apagaria o rascunho de
      // quem fechou e voltou.
      if (estado.encerrada && respondeuRef.current) apagar();
      return;
    }
    gravar({ roteiroId, passos: totalDePassos, estado });
  }, [
    rascunhoChave,
    restaurado,
    gravar,
    apagar,
    estado,
    roteiroId,
    totalDePassos
  ]);

  // Revela uma fala por vez. A da pessoa entra na hora; a do IEL, depois do
  // "digitando…". Um corte no histórico ("mudar minha resposta") traz o
  // contador de volta.
  useEffect(() => {
    if (revelados > historico.length) {
      setRevelados(historico.length);
      return;
    }
    if (revelados === historico.length) {
      setDigitando(false);
      return;
    }
    const proxima = historico[revelados];
    if (!proxima) return;

    if (reduzir) {
      setDigitando(false);
      setRevelados(historico.length);
      return;
    }
    if (proxima.autor === 'pessoa') {
      setRevelados((atual) => atual + 1);
      return;
    }

    setDigitando(true);
    const espera = window.setTimeout(() => {
      setDigitando(false);
      setRevelados((atual) => atual + 1);
    }, atrasoDe(proxima.texto));
    return () => window.clearTimeout(espera);
  }, [revelados, historico, reduzir]);

  const visiveis = historico.slice(0, revelados);
  const tudoVisivel = revelados >= historico.length && !digitando;
  const opcoes = tudoVisivel ? opcoesEmEspera(roteiro, estado) : [];
  const passo = passoEmEspera(roteiro, estado);
  const mutavel = ultimaRespostaMutavel(roteiro, estado);
  const progresso = progressoDaConversa(roteiro, estado);

  // "Ouvir tudo": cada fala nova do IEL entra na fila de leitura.
  useEffect(() => {
    if (!ouvirTudo || !voz.disponivel) return;
    for (
      let index = ultimoFaladoRef.current + 1;
      index < revelados;
      index += 1
    ) {
      const mensagem = historico[index];
      if (mensagem?.autor === 'iel') {
        voz.falar(mensagem.id, mensagem.fala, { fila: true });
      }
    }
    ultimoFaladoRef.current = Math.max(ultimoFaladoRef.current, revelados - 1);
  }, [ouvirTudo, revelados, historico, voz]);

  // A última fala sempre à vista.
  useEffect(() => {
    fimRef.current?.scrollIntoView({
      block: 'end',
      behavior: reduzir ? 'auto' : 'smooth'
    });
  }, [revelados, digitando, opcoes.length, reduzir]);

  const mostraAcoesFinais =
    opcoes.length === 0 &&
    estado.encerrada &&
    tudoVisivel &&
    Boolean(renderAcoesFinais) &&
    estado.acoesFinais.length > 0;

  // O foco nunca fica sem dono. O botão tocado some da tela; se nada
  // recebesse o foco, o TalkBack voltaria para o topo da página. Então:
  // - com opções na tela, o foco vai para a primeira (o grupo diz a pergunta);
  // - no fim, para a primeira ação;
  // - enquanto o IEL "digita", para o aviso de espera no rodapé.
  // As falas novas continuam chegando pelo `role="log"`, que as anuncia.
  const alvoDoFoco =
    opcoes.length > 0
      ? `opcoes:${passo?.id}:${revelados}`
      : mostraAcoesFinais
        ? 'acoes'
        : `espera:${estado.encerrada ? 'fim' : revelados}`;
  useEffect(() => {
    if (!respondeuRef.current) return;
    if (alvoDoFoco.startsWith('opcoes')) {
      opcoesRef.current
        ?.querySelector<HTMLElement>('button:not([disabled])')
        ?.focus({ preventScroll: true });
      return;
    }
    if (alvoDoFoco === 'acoes') {
      acoesRef.current
        ?.querySelector<HTMLElement>('a[href], button:not([disabled])')
        ?.focus({ preventScroll: true });
      return;
    }
    // Só puxa para o aviso se o foco se perdeu (o botão tocado sumiu).
    const ativo = document.activeElement;
    if (!ativo || ativo === document.body) {
      esperaRef.current?.focus({ preventScroll: true });
    }
  }, [alvoDoFoco]);

  // Recomeçar por toque: o botão tocado sumiu com a conversa anterior, e o
  // foco vai para o título, de onde a leitura segue na ordem da tela.
  useEffect(() => {
    if (focarAoAbrir) tituloRef.current?.focus({ preventScroll: true });
  }, [focarAoAbrir]);

  // A pergunta que as opções respondem: a fala do IEL do passo em espera.
  const indiceDaPergunta = (() => {
    for (let index = visiveis.length - 1; index >= 0; index -= 1) {
      const mensagem = visiveis[index];
      if (mensagem?.autor === 'iel' && mensagem.passoId === passo?.id) {
        return index;
      }
    }
    return -1;
  })();
  const idDoTexto = (index: number) => `${baseId}-fala-${index}`;
  const idDaPergunta =
    indiceDaPergunta >= 0 ? idDoTexto(indiceDaPergunta) : undefined;

  const alternarOuvirTudo = () => {
    if (ouvirTudo) {
      setOuvirTudo(false);
      voz.parar();
      return;
    }
    // Liga lendo o bloco atual: tudo o que o IEL disse desde a última
    // resposta da pessoa.
    let ultimaDaPessoa = -1;
    visiveis.forEach((mensagem, index) => {
      if (mensagem.autor === 'pessoa') ultimaDaPessoa = index;
    });
    ultimoFaladoRef.current = ultimaDaPessoa;
    voz.parar();
    setOuvirTudo(true);
  };

  const tocar = (opcaoId: string) => {
    if (!respondeuRef.current) {
      respondeuRef.current = true;
      onPrimeiraResposta?.();
    }
    const proximo = responder(roteiro, estado, opcaoId, nowIso());
    if (proximo === estado) return;
    if (!ouvirTudo) voz.parar();
    setEstado(proximo);
    if (proximo.encerrada && !estado.encerrada && proximo.aceite === 'aceito') {
      onConcluir?.(proximo.respostas);
    }
  };

  const mudar = () => {
    voz.parar();
    const anterior = voltar(roteiro, estado);
    // O que foi cortado do histórico volta a ser "não lido" para o Ouvir tudo.
    ultimoFaladoRef.current = Math.min(
      ultimoFaladoRef.current,
      anterior.historico.length - 1
    );
    setEstado(anterior);
  };

  const valorDoProgresso =
    progresso.fase === 'antes' || progresso.total === 0
      ? 0
      : Math.round((progresso.atual / progresso.total) * 100);

  const rotuloProgresso =
    progresso.fase === 'perguntas'
      ? `Frase ${progresso.atual} de ${progresso.total}`
      : progresso.fase === 'fim'
        ? progresso.atual === progresso.total
          ? 'Pronto'
          : 'Conversa encerrada'
        : 'Antes de começar';

  return (
    <div className="-mb-10 flex h-[calc(100dvh-3rem)] flex-col">
      <header className="flex shrink-0 flex-col gap-3 border-b pt-2 pb-3">
        <div className="flex items-center gap-3">
          <Image
            src="/marca/simbolo.png"
            alt=""
            width={32}
            height={32}
            className="size-8 shrink-0 rounded-md border bg-background p-0.5"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <h1
              ref={tituloRef}
              tabIndex={-1}
              className="text-sm font-semibold leading-tight outline-none"
            >
              <span className="sr-only">Conversa com o </span>
              Centro de Empregos
            </h1>
            <span className="text-xs text-muted-foreground">
              responde na hora
            </span>
          </div>
          {voz.disponivel ? (
            <Button
              type="button"
              variant={ouvirTudo ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={ouvirTudo}
              aria-label="Ouvir tudo em voz alta"
              // 36px de desenho, 48px de toque: o pseudo-elemento alarga a
              // área clicável sem mudar a altura do cabeçalho.
              className="relative h-9 after:absolute after:-inset-1.5 after:content-['']"
              onClick={alternarOuvirTudo}
            >
              <IconVolume aria-hidden="true" />
              {/* Nome fixo: o estado ligado/desligado é o `aria-pressed` (e a
                  cor), para o leitor não ouvir um botão que muda de nome. */}
              Ouvir tudo
            </Button>
          ) : null}
        </div>
        {progresso.total > 0 ? (
          <div className="flex flex-col gap-1.5">
            {/* O texto visível é a leitura; a barra repete o mesmo valor
                para quem navega por elementos. */}
            <span
              className="flex justify-between text-xs text-muted-foreground"
              aria-hidden="true"
            >
              {rotuloProgresso}
              {/* Quantas ainda faltam: a pergunta que a pessoa faz no meio
                  de uma fila de 16 frases. */}
              {progresso.fase === 'perguntas' ? (
                <span>
                  {progresso.total - progresso.atual === 0
                    ? 'Última'
                    : `Faltam ${progresso.total - progresso.atual}`}
                </span>
              ) : null}
            </span>
            <Progress
              className="h-1 bg-muted"
              value={valorDoProgresso}
              // O `Progress` do kit não repassa `value` ao Radix; sem isto a
              // barra é lida como "ocupada", sem número.
              aria-valuenow={valorDoProgresso}
              aria-label={rotuloProgresso}
              aria-valuetext={rotuloProgresso}
            />
          </div>
        ) : null}
      </header>

      <ScrollArea className="min-h-0 flex-1">
        {contexto ? (
          <div className="flex justify-center pt-4">{contexto}</div>
        ) : null}
        {/*
         * `role="log"` com `additions`: o leitor anuncia só a fala que entrou,
         * não a conversa inteira de novo. "Mudar minha resposta" corta o
         * histórico — remoção, que não é anunciada.
         */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Mensagens"
          className="flex flex-col gap-3 py-4"
        >
          {visiveis.map((mensagem, index) => (
            <Fragment key={mensagem.id}>
              <Bolha
                mensagem={mensagem}
                textoId={idDoTexto(index)}
                voz={voz}
                mutavel={mutavel?.id === mensagem.id && tudoVisivel}
                onMudar={mudar}
              />
              {/* A devolutiva entra depois da primeira fala do fim e antes
                  das que dizem o que acontece agora. */}
              {renderFim &&
              estado.encerrada &&
              estado.aceite === 'aceito' &&
              mensagem.autor === 'iel' &&
              mensagem.id.endsWith(':f0') ? (
                <div className="py-1">{renderFim(estado.respostas)}</div>
              ) : null}
            </Fragment>
          ))}
        </div>
        {digitando ? <Digitando /> : null}
        <div ref={fimRef} />
      </ScrollArea>

      {/*
       * No celular o botão do VLibras pousa no canto de baixo, à direita, a
       * 12–52px do pé da tela (`iel-theme.css`). Com a régua no rodapé, o
       * quinto degrau — "Sou eu", justamente o extremo — ficava por baixo
       * dele; o rodapé reserva essa altura até 640px, e nada acima disso.
       */}
      <footer className="flex shrink-0 flex-col gap-2 border-t pt-3 pb-[max(env(safe-area-inset-bottom),3.75rem)] sm:pb-[max(env(safe-area-inset-bottom),1rem)]">
        {opcoes.length > 0 && passo?.tipo === 'pergunta' && passo.regua ? (
          <div ref={opcoesRef}>
            <ReguaDaConversa
              key={passo.id}
              nome={`${baseId}-${passo.id}`}
              regua={passo.regua}
              labelledBy={idDaPergunta}
              onResponder={tocar}
            />
          </div>
        ) : opcoes.length > 0 ? (
          <div
            ref={opcoesRef}
            role="group"
            aria-labelledby={idDaPergunta}
            aria-label={idDaPergunta ? undefined : 'Escolha uma resposta'}
            className="flex flex-col gap-2"
          >
            {opcoes.map((opcao, index) => (
              <Fragment key={opcao.id}>
                <Button
                  type="button"
                  variant="outline"
                  aria-describedby={`${baseId}-opcao-${index}`}
                  className="h-auto min-h-12 w-full justify-start py-3 text-left text-[15px] leading-snug whitespace-normal"
                  onClick={() => tocar(opcao.id)}
                >
                  {opcao.label}
                </Button>
                {/* Fora do botão e escondido: entra só como descrição, depois
                    do nome ("Aceito, botão, Opção 1 de 3"). */}
                <span
                  id={`${baseId}-opcao-${index}`}
                  hidden
                >
                  Opção {index + 1} de {opcoes.length}
                </span>
              </Fragment>
            ))}
          </div>
        ) : mostraAcoesFinais && renderAcoesFinais ? (
          <div ref={acoesRef}>{renderAcoesFinais(estado.acoesFinais)}</div>
        ) : (
          <p
            ref={esperaRef}
            tabIndex={-1}
            className="flex min-h-12 items-center justify-center text-xs text-muted-foreground outline-none"
          >
            {estado.encerrada ? 'Conversa encerrada' : 'Aguarde a mensagem…'}
          </p>
        )}
      </footer>
    </div>
  );
}

function Bolha({
  mensagem,
  textoId,
  voz,
  mutavel,
  onMudar
}: {
  mensagem: MensagemConversa;
  textoId: string;
  voz: Voz;
  mutavel: boolean;
  onMudar: () => void;
}) {
  const doIel = mensagem.autor === 'iel';
  const tocando = voz.falandoId === mensagem.id;

  return (
    <div
      className={cn('flex flex-col gap-1', doIel ? 'items-start' : 'items-end')}
    >
      <div
        className={cn(
          'flex max-w-[85%] flex-col gap-1 px-3.5 py-2.5 text-[15px] leading-relaxed',
          doIel
            ? 'rounded-2xl rounded-tl-sm bg-muted text-foreground'
            : 'rounded-2xl rounded-tr-sm bg-primary text-primary-foreground'
        )}
      >
        {/* Quem fala, para quem não vê o lado da bolha. */}
        <span className="sr-only">
          {doIel ? 'Centro de Empregos disse:' : 'Você respondeu:'}
        </span>
        <p id={textoId}>{mensagem.texto}</p>
        {mensagem.apoio ? (
          <p className="text-[13px] leading-snug text-muted-foreground">
            {mensagem.apoio}
          </p>
        ) : null}
        {mensagem.original ? <FraseOriginal texto={mensagem.original} /> : null}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {/* A hora é só visual: lida a cada fala nova, ela atrasaria a
            frase que importa. */}
        <time
          dateTime={mensagem.em}
          aria-hidden="true"
        >
          {hora(mensagem.em)}
        </time>
        {doIel && voz.disponivel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={tocando}
            aria-label={
              tocando
                ? 'Parar a leitura em voz alta'
                : 'Ouvir esta mensagem em voz alta'
            }
            className="relative h-7 gap-1 px-2 text-[11px] font-medium text-muted-foreground after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-['']"
            onClick={() =>
              tocando ? voz.parar() : voz.falar(mensagem.id, mensagem.fala)
            }
          >
            {tocando ? (
              <IconSquare
                aria-hidden="true"
                className="size-3"
              />
            ) : (
              <IconVolume
                aria-hidden="true"
                className="size-3.5"
              />
            )}
            {tocando ? 'Parar' : 'Ouvir'}
          </Button>
        ) : null}
        {mutavel ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            aria-label={`Mudar minha resposta: ${mensagem.texto}`}
            className="relative h-7 px-2 text-[12px] text-muted-foreground after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-['']"
            onClick={onMudar}
          >
            mudar minha resposta
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * A régua no rodapé da conversa: um toque responde.
 *
 * Tem estado próprio (o degrau tocado) e é remontada a cada pergunta pela
 * `key`, então uma espera pendente nunca responde a frase seguinte. Pelo
 * teclado a seleção não avança sozinha — as setas passariam por três
 * degraus até parar no certo —, e um botão "Confirmar" aparece para fechar
 * a resposta; Enter no degrau faz o mesmo.
 */
function ReguaDaConversa({
  nome,
  regua,
  labelledBy,
  onResponder
}: {
  nome: string;
  regua: ReguaDoPasso;
  labelledBy?: string;
  onResponder: (opcaoId: string) => void;
}) {
  const [valor, setValor] = useState<ValorDaEscala | null>(null);
  const [origem, setOrigem] = useState<OrigemDaResposta | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <ReguaDeConcordancia
        nome={nome}
        valor={valor}
        rotulos={regua.rotulos}
        tom={regua.tom}
        aria-labelledby={labelledBy}
        onChange={(escolhido, como) => {
          setValor(escolhido);
          setOrigem(como);
        }}
        onConfirmar={(escolhido) => onResponder(String(escolhido))}
      />
      {valor !== null && origem === 'teclado' ? (
        <Button
          type="button"
          className="h-12 w-full text-[15px]"
          onClick={() => onResponder(String(valor))}
        >
          Confirmar resposta
        </Button>
      ) : null}
    </div>
  );
}

/**
 * Três pontos que pulsam; com movimento reduzido, a espera nem existe.
 *
 * Fica fora do `log` e escondido do leitor: aparece antes de cada fala, e
 * anunciar "digitando" a cada vez seria ruído. A fala em si é anunciada.
 */
function Digitando() {
  return (
    <div
      className="flex items-start pb-4"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
        {[0, 150, 300].map((atraso) => (
          <span
            key={atraso}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 motion-reduce:animate-none"
            style={{ animationDelay: `${atraso}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/** O que aparece antes da hidratação: a moldura, sem relógio nem voz. */
export function ConversaCarregando() {
  return (
    <div
      className="-mb-10 flex h-[calc(100dvh-3rem)] flex-col gap-4 pt-2"
      aria-busy="true"
    >
      <p className="sr-only">Carregando a conversa…</p>
      <div
        className="flex items-center gap-3"
        aria-hidden="true"
      >
        <Skeleton className="size-8 rounded-md" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-14 w-3/4 rounded-2xl" />
      <Skeleton className="h-10 w-2/3 rounded-2xl" />
    </div>
  );
}
