'use client';

import { useEffect, useId, useRef } from 'react';
import {
  isValorDaEscala,
  type RotuloDaRegua,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';

import { cn } from '@workspace/ui/lib/utils';
import { Label } from '@workspace/ui/shadcn/label';
import { RadioGroup, RadioGroupItem } from '@workspace/ui/shadcn/radio-group';

import { ICONE_TINGIDO, LADO } from '../metricas/cores';

/**
 * A régua de um toque: os cinco degraus da escala, com a palavra escrita em
 * cada um, para o candidato e para o colaborador — no formulário e na
 * conversa.
 *
 * ## Por que uma régua e não cinco linhas
 *
 * Cinco alternativas empilhadas, cada uma com uma bolinha e "Concordo",
 * "Discordo", pareciam um formulário de repartição — e eram lidas como tal.
 * A régua mostra a escala inteira de uma vez, do "Nada a ver comigo" ao "Sou
 * eu", com os extremos mais pesados para a pessoa ver onde ela acaba. O
 * degrau tocado se preenche no tom de quem responde (`cores.ts`) e, depois
 * de um instante, a tela avança sozinha: é o "um toque" da decisão. O
 * instante existe para a pessoa ver o que tocou antes de a frase mudar, e o
 * "Voltar" continua sempre ao alcance.
 *
 * ## Teclado e leitor de tela
 *
 * É um `radiogroup` do shadcn: setas movem e escolhem, Espaço escolhe, e
 * Enter confirma — no teclado o avanço não é automático, porque as setas
 * passariam por três degraus antes de parar no certo. O leitor anuncia cada
 * degrau como "Sou eu, 5 de 5". A cor nunca está sozinha: o rótulo está
 * escrito em cada degrau, e o selecionado muda também a borda e o peso.
 *
 * ## Tamanho
 *
 * Cinco colunas cabem em 390px com 72px de altura e rótulo de 12px em duas
 * linhas ("Nada a ver / comigo"). Abaixo de 360px a régua empilha, uma linha
 * por degrau, com o mesmo alvo de 56px.
 */

/** Quanto a tela espera, depois do toque, para avançar. */
export const INSTANTE_DA_REGUA_MS = 350;

export type OrigemDaResposta = 'toque' | 'teclado';

export type ReguaDeConcordanciaProps = {
  valor: ValorDaEscala | null;
  /** O degrau escolhido e como foi escolhido: toque avança, teclado espera. */
  onChange: (valor: ValorDaEscala, origem: OrigemDaResposta) => void;
  /**
   * Chamado um instante depois do toque, ou no Enter do teclado: é o "pode
   * avançar" da régua. Sem ele a régua só seleciona.
   */
  onConfirmar?: (valor: ValorDaEscala) => void;
  /** Os cinco degraus: `ROTULOS_DA_REGUA.candidato` ou `.colaborador`. */
  rotulos: RotuloDaRegua[];
  /** Nome do grupo, para os ids dos degraus: uma frase, um nome. */
  nome: string;
  /**
   * De quem é a resposta: a pessoa (verde-azulado) ou a empresa (azul, quando
   * o colaborador descreve o ambiente). É a mesma leitura de cor das telas do
   * analista — "Cor nos dados", DESIGN.md §8.
   */
  tom?: 'pessoa' | 'empresa';
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};

export function ReguaDeConcordancia({
  valor,
  onChange,
  onConfirmar,
  rotulos,
  nome,
  tom = 'pessoa',
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy
}: ReguaDeConcordanciaProps) {
  const dicaId = useId();
  // Verdadeiro entre o dedo tocar num degrau e o Radix avisar a mudança: é
  // o que distingue um toque (avança sozinho) de uma seta do teclado (não).
  const toqueRef = useRef(false);
  const esperaRef = useRef<number | null>(null);
  const onConfirmarRef = useRef(onConfirmar);
  useEffect(() => {
    onConfirmarRef.current = onConfirmar;
  });

  const cancelarEspera = () => {
    if (esperaRef.current !== null) {
      window.clearTimeout(esperaRef.current);
      esperaRef.current = null;
    }
  };

  // Outra frase, outro grupo: uma espera pendente da frase anterior não pode
  // avançar esta. E desmontar cancela também.
  useEffect(() => cancelarEspera, [nome]);

  const ultimo = rotulos.length;

  return (
    /*
     * `data-regua` marca a única exceção ao piso de 16px das telas do
     * candidato (`iel-theme.css`). Cinco colunas em 390px não comportam
     * rótulo de 16px — "Nada a ver comigo" em 70px de largura viraria quatro
     * linhas —, e mostrar a escala inteira de uma vez é o que faz a régua ser
     * régua, como explica o cabeçalho deste arquivo. Abaixo de 360px ela
     * empilha e o rótulo já sobe para 15px. O escopo do atributo é este
     * componente: qualquer outro texto pequeno que apareça numa tela por link
     * continua sendo levantado para 16px.
     */
    <div
      data-regua=""
      className="flex flex-col"
    >
      <RadioGroup
        className="grid grid-cols-5 gap-2 sm:gap-2.5 max-[420px]:grid-cols-1"
        aria-labelledby={labelledBy}
        aria-describedby={[describedBy, dicaId].filter(Boolean).join(' ')}
        value={valor === null ? '' : String(valor)}
        onValueChange={(texto) => {
          const escolhido = Number(texto);
          if (!isValorDaEscala(escolhido)) return;
          const origem: OrigemDaResposta = toqueRef.current
            ? 'toque'
            : 'teclado';
          toqueRef.current = false;
          onChange(escolhido, origem);
          cancelarEspera();
          if (origem === 'toque' && onConfirmarRef.current) {
            esperaRef.current = window.setTimeout(() => {
              esperaRef.current = null;
              onConfirmarRef.current?.(escolhido);
            }, INSTANTE_DA_REGUA_MS);
          }
        }}
      >
        {rotulos.map((degrau, indice) => {
          const id = `${nome}-${degrau.valor}`;
          const selecionado = valor === degrau.valor;
          const extremo = indice === 0 || indice === ultimo - 1;
          return (
            <Label
              key={degrau.valor}
              htmlFor={id}
              data-selected={selecionado ? '' : undefined}
              data-extremo={extremo ? '' : undefined}
              onPointerDown={() => {
                toqueRef.current = true;
                // Um dedo que encosta e desliza para fora não gera clique; o
                // sinal expira para não contaminar a próxima seta do teclado.
                window.setTimeout(() => {
                  toqueRef.current = false;
                }, 300);
              }}
              className={cn(
                'group relative flex min-h-[84px] sm:min-h-[96px] cursor-pointer flex-col items-center justify-between rounded-2xl border border-foreground/15 bg-card p-2 sm:p-3 text-center text-[12px] sm:text-[13px] font-medium leading-tight shadow-2xs transition-all duration-200 select-none',
                'has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-2 has-focus-visible:ring-offset-background',
                'max-[420px]:min-h-14 max-[420px]:flex-row max-[420px]:justify-between max-[420px]:gap-3 max-[420px]:px-4 max-[420px]:text-left max-[420px]:text-[14px]',
                // Os extremos pesam mais: são as âncoras da escala.
                extremo
                  ? 'border-foreground/30 font-semibold text-foreground'
                  : 'text-foreground/90',
                selecionado
                  ? cn(
                      ICONE_TINGIDO[tom],
                      LADO[tom].borda,
                      'font-bold shadow-lg shadow-black/10 scale-[1.03] z-10'
                    )
                  : 'hover:border-foreground/40 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md'
              )}
            >
              <RadioGroupItem
                id={id}
                value={String(degrau.valor)}
                className="sr-only"
                aria-label={`${degrau.rotulo}, ${degrau.valor} de ${ultimo}`}
                onKeyDown={(evento) => {
                  if (evento.key !== 'Enter') return;
                  const focado = degrau.valor;
                  if (valor !== focado) onChange(focado, 'teclado');
                  cancelarEspera();
                  onConfirmarRef.current?.(focado);
                }}
              />
              {/*
                O número do degrau, escrito.

                Estava aqui uma fileira de pontinhos preenchidos até a posição
                do degrau — a mesma informação, em código que só quem enxerga
                a régua inteira decifra. O número diz a posição sem pedir
                comparação, e é o que a voz dita ("toque no número. Um: nada a
                ver comigo"): quem ouviu "três" acha o três na tela sem ler
                "mais ou menos".

                Ele já esteve na régua antes e saiu, porque número em cima da
                palavra lia como nota de 1 a 5 — "tirei 2 nesta pergunta". A
                pastilha é o que separa uma coisa da outra: pequena, redonda e
                em tom de apoio, ela lê como etiqueta de posição, e não como
                placar. O leitor de tela continua ouvindo "rótulo, N de 5" e
                não lê a pastilha duas vezes.
              */}
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition-colors',
                  selecionado
                    ? 'bg-white/25 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {degrau.valor}
              </span>

              {/* Rótulo da régua */}
              <span
                aria-hidden="true"
                className={cn(
                  'whitespace-normal [text-wrap:balance] transition-colors py-0.5',
                  selecionado ? 'text-white' : ''
                )}
              >
                {degrau.rotulo}
              </span>

              {/* Espaçador sutil para alinhar os textos na vertical */}
              <div
                className="hidden sm:block h-1 w-full"
                aria-hidden="true"
              />
            </Label>
          );
        })}
      </RadioGroup>
      <p
        id={dicaId}
        className="sr-only"
      >
        Toque num degrau para responder. No teclado, use as setas para escolher
        e Enter para confirmar.
      </p>
    </div>
  );
}
