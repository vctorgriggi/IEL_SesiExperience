'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent
} from 'react';
import { IconArrowUpRight, IconPlayerSkipForward } from '@tabler/icons-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';

import {
  Celular,
  centroNaTela,
  useEscalaDoCelular,
  type Ponto
} from './celular';
import { Dedo } from './dedo';
import {
  avancarAto,
  duracaoDoAto,
  legendaDoAto,
  MOMENTO_INICIAL,
  momentoSeguinte,
  NOMES_DOS_ATOS,
  ROTEIRO,
  ULTIMO_ATO,
  ultimoPasso,
  voltarAto,
  type Ato,
  type Momento
} from './roteiro';
import { TelaMensagens } from './tela-mensagens';
import { TelaPortal, type VagaNoPortal } from './tela-portal';
import { TelaQuestionario, type ModoDoQuestionario } from './tela-questionario';

import './cena.css';

export type DadosDaCena = {
  applicationId: string;
  primeiroNome: string;
  vaga: VagaNoPortal;
  /** A mensagem real do IEL, com o link em `https://` dentro. */
  mensagem: string;
  /** O endereço como aparece na bolha, sem `https://`. */
  linkNaMensagem: string;
  /**
   * Quantas frases esta candidatura ainda pergunta, contadas no servidor.
   * A legenda do terceiro ato sai daqui: o número muda com as competências
   * que a empresa escolhe e com o que já foi reaproveitado.
   */
  frasesQueFaltam: number;
  /** A rota real do questionário. */
  hrefDoQuestionario: string;
  modoDoQuestionario: ModoDoQuestionario;
};

const ATOS: Ato[] = [1, 2, 3];

/** Onde um clique ou tecla é do conteúdo, e não do palco. */
const SELETOR_INTERATIVO =
  'button, a, input, select, textarea, [role="radio"], [role="radiogroup"], [contenteditable]';

/**
 * A cena do candidato, para o telão.
 *
 * Um celular no centro e uma legenda ao lado; três atos que andam sozinhos
 * pelo relógio do `roteiro.ts` e obedecem ao teclado de quem apresenta. No
 * terceiro ato o celular passa a ser de verdade: é o questionário real, e
 * a partir dali o teclado e o toque são dele.
 */
export function CenaDoCandidato({ dados }: { dados: DadosDaCena }) {
  const reduzido = useReducedMotion();
  const escala = useEscalaDoCelular();

  /*
   * A contagem é a do servidor, tirada no instante em que a cena abriu, e
   * fica parada: quem apresenta responde o questionário dentro do celular,
   * e ler o estado vivo faria a legenda cair para "é só confirmar" no meio
   * do ato, quando as respostas fossem enviadas. Mudança de competência
   * pela analista entra na próxima abertura da cena.
   */
  const { frasesQueFaltam } = dados;

  const [momento, setMomento] = useState<Momento>(MOMENTO_INICIAL);
  // Cada reinício remonta o celular: as entradas animam de novo do zero.
  const [tomada, setTomada] = useState(0);

  const botaoRef = useRef<HTMLButtonElement>(null);
  const linkRef = useRef<HTMLSpanElement>(null);
  const [alvoDoDedo, setAlvoDoDedo] = useState<Ponto | null>(null);

  const { ato, passo } = momento;
  const questionarioAberto = ato === 3 && passo === ultimoPasso(3);

  // O relógio: cada passo dura o que o roteiro diz e chama o seguinte.
  useEffect(() => {
    const duracao = ROTEIRO[momento.ato][momento.passo];
    if (duracao == null) return;
    const id = window.setTimeout(() => setMomento(momentoSeguinte), duracao);
    return () => window.clearTimeout(id);
  }, [momento]);

  /*
   * O dedo mede o alvo na hora de partir, e mede de novo se a janela mudar
   * de tamanho: as coordenadas são da tela do celular, não do telão.
   */
  useLayoutEffect(() => {
    if (ato === 1 && passo >= 1 && botaoRef.current) {
      setAlvoDoDedo(centroNaTela(botaoRef.current));
    } else if (ato === 3 && passo <= 1 && linkRef.current) {
      setAlvoDoDedo(centroNaTela(linkRef.current));
    } else {
      setAlvoDoDedo(null);
    }
  }, [ato, passo, escala]);

  const avancar = useCallback(() => setMomento(avancarAto), []);
  const voltar = useCallback(() => setMomento(voltarAto), []);
  const reiniciar = useCallback(() => {
    setMomento(MOMENTO_INICIAL);
    setTomada((n) => n + 1);
  }, []);
  const pularParaOQuestionario = useCallback(
    () => setMomento({ ato: ULTIMO_ATO, passo: ultimoPasso(ULTIMO_ATO) }),
    []
  );

  /*
   * Teclado do palco: → e espaço avançam, ← volta, Esc reinicia. Dentro do
   * celular, no terceiro ato, o teclado é do questionário — a régua usa as
   * setas e o botão usa o espaço — e o palco fica quieto.
   */
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      // Esc reinicia de qualquer lugar — inclusive com o foco no questionário,
      // que é onde ele está depois de responder. Só não quando algo já o usou
      // (um diálogo aberto fecha com Esc e avisa por `preventDefault`).
      if (evento.key === 'Escape') {
        if (!evento.defaultPrevented) reiniciar();
        return;
      }

      const alvo = evento.target instanceof HTMLElement ? evento.target : null;
      if (alvo?.closest('[data-cena-celular]')) return;
      if (alvo?.closest(SELETOR_INTERATIVO)) return;

      if (evento.key === 'ArrowRight' || evento.key === ' ') {
        evento.preventDefault();
        avancar();
      } else if (evento.key === 'ArrowLeft') {
        evento.preventDefault();
        voltar();
      }
    }
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [avancar, voltar, reiniciar]);

  function aoClicarNoPalco(evento: MouseEvent<HTMLDivElement>) {
    const alvo = evento.target instanceof HTMLElement ? evento.target : null;
    if (alvo?.closest(SELETOR_INTERATIVO)) return;
    if (ato === 3 && alvo?.closest('[data-cena-celular]')) return;
    avancar();
  }

  const dedoVisivel =
    (ato === 1 && (passo === 1 || passo === 2)) || (ato === 3 && passo <= 1);
  const dedoTocando = (ato === 1 && passo === 2) || (ato === 3 && passo === 1);

  // Qual tela está no celular; a conversa fica até o link ser tocado.
  const tela: 'portal' | 'mensagens' | 'questionario' =
    ato === 1
      ? 'portal'
      : ato === 2 || passo <= 1
        ? 'mensagens'
        : 'questionario';

  return (
    <div
      data-iel-theme=""
      data-sidebar="sidebar"
      className="cena-palco fixed inset-0 overflow-hidden text-foreground select-none"
      onClick={aoClicarNoPalco}
    >
      <h1 className="sr-only">{dados.primeiroNome} se candidata</h1>

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 sm:px-6">
          <p className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold tracking-tight">
              Mind RH
            </span>
            <span className="hidden text-[12px] text-muted-foreground sm:inline">
              IEL · Centro de Empregos da Indústria
            </span>
          </p>
          <div className="flex items-center gap-1">
            <AnimatePresence>
              {questionarioAberto ? (
                <motion.div
                  key="tela-cheia"
                  initial={reduzido ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                  >
                    <a
                      href={dados.hrefDoQuestionario}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir em tela cheia
                      <IconArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
            {!questionarioAberto ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={pularParaOQuestionario}
              >
                <span className="hidden sm:inline">
                  Pular para o questionário
                </span>
                <span className="sm:hidden">Pular</span>
                <IconPlayerSkipForward aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-12 lg:px-10">
          {/* A legenda: uma frase por ato, ao lado do celular. */}
          <div className="flex max-w-md flex-col items-center gap-2 text-center lg:items-start lg:justify-self-end lg:text-left">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Ato {ato} de {ULTIMO_ATO} · {NOMES_DOS_ATOS[ato]}
            </p>
            <div
              aria-live="polite"
              className="min-h-[3.2em] text-xl leading-snug font-semibold [text-wrap:balance] sm:text-2xl lg:min-h-[4.5em] lg:text-[34px] lg:leading-[1.25]"
            >
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                <motion.p
                  key={ato}
                  initial={reduzido ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduzido ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {legendaDoAto(ato, frasesQueFaltam)}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <Celular escala={escala}>
            {/*
             * O que está no celular nos dois primeiros atos é cenário: o
             * leitor de tela ouve a legenda. No terceiro, o questionário é
             * real e volta a ser lido.
             */}
            <div
              key={tomada}
              className="absolute inset-0"
              aria-hidden={tela !== 'questionario'}
            >
              <AnimatePresence
                mode="wait"
                initial={false}
              >
                {tela === 'portal' ? (
                  <motion.div
                    key="portal"
                    className="absolute inset-0"
                    exit={reduzido ? undefined : { opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TelaPortal
                      vaga={dados.vaga}
                      passo={passo}
                      botaoRef={botaoRef}
                    />
                  </motion.div>
                ) : tela === 'mensagens' ? (
                  <motion.div
                    key="mensagens"
                    className="absolute inset-0"
                    initial={reduzido ? false : { opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    // A conversa se desfaz em blur quando o link abre.
                    exit={
                      reduzido
                        ? undefined
                        : { opacity: 0, scale: 1.04, filter: 'blur(12px)' }
                    }
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                  >
                    <TelaMensagens
                      mensagem={dados.mensagem}
                      link={dados.linkNaMensagem}
                      passo={ato === 3 ? ultimoPasso(2) : passo}
                      destacarLink={ato === 3 && passo === 1}
                      linkRef={linkRef}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="questionario"
                    className="absolute inset-0"
                    initial={reduzido ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TelaQuestionario
                      applicationId={dados.applicationId}
                      href={dados.hrefDoQuestionario}
                      modo={dados.modoDoQuestionario}
                      aberto={questionarioAberto}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <Dedo
                alvo={alvoDoDedo}
                visivel={dedoVisivel}
                tocando={dedoTocando}
              />
            </div>
          </Celular>

          {/* A terceira coluna só existe para o celular ficar no centro. */}
          <div className="hidden lg:block" />
        </main>

        <footer className="flex shrink-0 flex-col gap-2 px-4 pt-2 pb-4 sm:px-6">
          <ol className="flex gap-2">
            {ATOS.map((umAto) => (
              <li
                key={umAto}
                className="flex flex-1 flex-col gap-1.5"
                aria-current={umAto === ato ? 'step' : undefined}
              >
                <span className="block h-[3px] overflow-hidden rounded-full bg-foreground/15">
                  {/*
                   * O ato em curso enche na cor de "onde você está" (o
                   * laranja da barra), no ritmo do relógio; os passados
                   * ficam cheios, em marfim.
                   */}
                  <motion.span
                    key={`${umAto}-${ato}-${tomada}`}
                    className={cn(
                      'block h-full rounded-full',
                      umAto === ato ? 'bg-sidebar-primary' : 'bg-foreground/70'
                    )}
                    initial={{ width: umAto < ato ? '100%' : '0%' }}
                    animate={{ width: umAto <= ato ? '100%' : '0%' }}
                    transition={
                      umAto === ato && !reduzido
                        ? {
                            duration: duracaoDoAto(umAto) / 1000,
                            ease: 'linear'
                          }
                        : { duration: 0 }
                    }
                  />
                </span>
                <span
                  className={cn(
                    'text-[11px] tracking-[0.16em] uppercase',
                    umAto === ato ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {NOMES_DOS_ATOS[umAto]}
                </span>
              </li>
            ))}
          </ol>
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            → avança · ← volta · Esc reinicia
          </p>
        </footer>
      </div>
    </div>
  );
}
