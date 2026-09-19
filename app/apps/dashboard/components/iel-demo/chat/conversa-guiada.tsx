'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  renderAcoesFinais
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
  const primeiraOpcaoRef = useRef<HTMLButtonElement>(null);
  const ultimoFaladoRef = useRef(-1);
  const respondeuRef = useRef(false);

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

  // Quando os botões aparecem, o foco vai para o primeiro — quem usa leitor
  // de tela ou teclado não precisa caçar a resposta. O foco só se move depois
  // de a pessoa ter tocado em algo: na abertura da página, mover o foco
  // atropelaria a leitura da primeira fala.
  const chaveDasOpcoes = opcoes.length > 0 ? `${passo?.id}:${revelados}` : '';
  useEffect(() => {
    if (!chaveDasOpcoes || !respondeuRef.current) return;
    primeiraOpcaoRef.current?.focus({ preventScroll: true });
  }, [chaveDasOpcoes]);

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
            <span className="text-sm font-semibold leading-tight">
              Centro de Empregos
            </span>
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
              className="h-9"
              onClick={alternarOuvirTudo}
            >
              <Volume2 aria-hidden="true" />
              {ouvirTudo ? 'Ouvindo tudo' : 'Ouvir tudo'}
            </Button>
          ) : null}
        </div>
        {progresso.total > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span
              className="text-xs text-muted-foreground"
              aria-live="polite"
            >
              {rotuloProgresso}
            </span>
            <Progress
              className="h-1 bg-muted"
              value={
                progresso.fase === 'antes'
                  ? 0
                  : (progresso.atual / progresso.total) * 100
              }
              aria-label={rotuloProgresso}
            />
          </div>
        ) : null}
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div
          role="log"
          aria-live="polite"
          aria-label="Conversa com o Centro de Empregos"
          className="flex flex-col gap-3 py-4"
        >
          {contexto ? (
            <div className="flex justify-center">{contexto}</div>
          ) : null}
          {visiveis.map((mensagem) => (
            <Bolha
              key={mensagem.id}
              mensagem={mensagem}
              voz={voz}
              mutavel={mutavel?.id === mensagem.id && tudoVisivel}
              onMudar={mudar}
            />
          ))}
          {digitando ? <Digitando /> : null}
          <div ref={fimRef} />
        </div>
      </ScrollArea>

      <footer className="flex shrink-0 flex-col gap-2 border-t pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        {opcoes.length > 0 ? (
          <div
            role="group"
            aria-label="Escolha uma resposta"
            className="flex flex-col gap-2"
          >
            {opcoes.map((opcao, index) => (
              <Button
                key={opcao.id}
                ref={index === 0 ? primeiraOpcaoRef : undefined}
                type="button"
                variant="outline"
                className="h-auto min-h-12 w-full justify-start py-3 text-left text-[15px] leading-snug whitespace-normal"
                onClick={() => tocar(opcao.id)}
              >
                {opcao.label}
              </Button>
            ))}
          </div>
        ) : estado.encerrada &&
          tudoVisivel &&
          renderAcoesFinais &&
          estado.acoesFinais.length > 0 ? (
          renderAcoesFinais(estado.acoesFinais)
        ) : (
          <p className="flex min-h-12 items-center justify-center text-xs text-muted-foreground">
            {estado.encerrada ? 'Conversa encerrada' : 'Aguarde a mensagem…'}
          </p>
        )}
      </footer>
    </div>
  );
}

function Bolha({
  mensagem,
  voz,
  mutavel,
  onMudar
}: {
  mensagem: MensagemConversa;
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
        <p>{mensagem.texto}</p>
        {mensagem.apoio ? (
          <p className="text-[13px] leading-snug text-muted-foreground">
            {mensagem.apoio}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <time dateTime={mensagem.em}>{hora(mensagem.em)}</time>
        {doIel && voz.disponivel ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={tocando}
            aria-label={tocando ? 'Parar a leitura' : 'Ouvir esta mensagem'}
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

/** Três pontos que pulsam; com movimento reduzido, a espera nem existe. */
function Digitando() {
  return (
    <div className="flex items-start">
      <div
        className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5"
        aria-label="Centro de Empregos está digitando"
        role="status"
      >
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
    <div className="-mb-10 flex h-[calc(100dvh-3rem)] flex-col gap-4 pt-2">
      <div className="flex items-center gap-3">
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
