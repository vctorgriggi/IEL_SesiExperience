'use client';

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode
} from 'react';
import Image from 'next/image';
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
  type MensagemConversa
} from '@/features/iel-demo/chat/motor';
import { nowIso } from '@/features/iel-demo/state/storage';
import { Square, Volume2 } from 'lucide-react';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import { Progress } from '@workspace/ui/shadcn/progress';
import { ScrollArea } from '@workspace/ui/shadcn/scroll-area';
import { Skeleton } from '@workspace/ui/shadcn/skeleton';

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
 * ## Áudio
 *
 * Cada bolha do IEL tem "Ouvir"; numa pergunta, a leitura inclui as opções.
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
   * Verdadeiro quando a conversa recomeça por um toque da pessoa ("Responder
   * de novo"): o botão que ela tocou some, e o foco precisa de um lugar para
   * ir que não seja o topo da página.
   */
  focarAoAbrir?: boolean;
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
  focarAoAbrir = false
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
  const primeiraOpcaoRef = useRef<HTMLButtonElement>(null);
  const acoesRef = useRef<HTMLDivElement>(null);
  const esperaRef = useRef<HTMLParagraphElement>(null);
  const ultimoFaladoRef = useRef(-1);
  // Depois que a pessoa tocou em algo, o foco acompanha a conversa. Antes
  // disso, mover o foco atropelaria a leitura da página que acabou de abrir.
  const respondeuRef = useRef(focarAoAbrir);
  const baseId = useId();

  const { historico } = estado;

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
      primeiraOpcaoRef.current?.focus({ preventScroll: true });
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
      ? `Pergunta ${progresso.atual} de ${progresso.total}`
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
              <Volume2 aria-hidden="true" />
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
              className="text-xs text-muted-foreground"
              aria-hidden="true"
            >
              {rotuloProgresso}
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
            <Bolha
              key={mensagem.id}
              mensagem={mensagem}
              textoId={idDoTexto(index)}
              voz={voz}
              mutavel={mutavel?.id === mensagem.id && tudoVisivel}
              onMudar={mudar}
            />
          ))}
        </div>
        {digitando ? <Digitando /> : null}
        <div ref={fimRef} />
      </ScrollArea>

      <footer className="flex shrink-0 flex-col gap-2 border-t pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        {opcoes.length > 0 ? (
          <div
            role="group"
            aria-labelledby={idDaPergunta}
            aria-label={idDaPergunta ? undefined : 'Escolha uma resposta'}
            className="flex flex-col gap-2"
          >
            {opcoes.map((opcao, index) => (
              <Fragment key={opcao.id}>
                <Button
                  ref={index === 0 ? primeiraOpcaoRef : undefined}
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
              <Square
                aria-hidden="true"
                className="size-3"
              />
            ) : (
              <Volume2
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
