'use client';

import { motion, useReducedMotion } from 'motion/react';

import type { Ponto } from './celular';

/**
 * De onde o dedo entra: o canto de baixo, à direita, como a mão de quem
 * segura o celular. Coordenadas da tela do celular (390×820).
 */
const REPOUSO: Ponto = { x: 330, y: 760 };

/** O deslocamento até o alvo: uma mola sem pressa, como um polegar. */
const MOLA = { type: 'spring', stiffness: 90, damping: 16, mass: 0.9 } as const;

/**
 * O dedo do candidato: um círculo translúcido que vai até o alvo e toca.
 *
 * Ele não é um cursor de mouse — é um toque de tela, por isso é redondo e
 * grande. Só existe visualmente; para o leitor de tela, a legenda já contou
 * o que aconteceu.
 */
export function Dedo({
  alvo,
  visivel,
  tocando
}: {
  /** Onde o dedo vai; sem alvo, ele descansa fora de vista. */
  alvo: Ponto | null;
  visivel: boolean;
  /** O instante do toque: o dedo afunda e solta uma onda. */
  tocando: boolean;
}) {
  const reduzido = useReducedMotion();
  const ponto = alvo ?? REPOUSO;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 z-40 size-11"
      initial={false}
      animate={{
        x: ponto.x - 22,
        y: ponto.y - 22,
        opacity: visivel ? 1 : 0,
        scale: tocando ? 0.8 : 1
      }}
      transition={
        reduzido
          ? { duration: 0 }
          : {
              x: MOLA,
              y: MOLA,
              opacity: { duration: 0.25 },
              scale: { type: 'spring', stiffness: 500, damping: 22 }
            }
      }
    >
      <span className="absolute inset-0 rounded-full bg-sidebar/25 ring-2 ring-sidebar/50 backdrop-blur-[1px]" />
      {tocando && !reduzido ? (
        <motion.span
          className="absolute inset-0 rounded-full ring-2 ring-sidebar/60"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ) : null}
    </motion.div>
  );
}
