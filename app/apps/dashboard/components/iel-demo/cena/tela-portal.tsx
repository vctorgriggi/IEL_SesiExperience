'use client';

import type { RefObject } from 'react';
import {
  IconCheck,
  IconClock,
  IconMapPin,
  IconSearch
} from '@tabler/icons-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@workspace/ui/lib/utils';
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

import { PREENCHIMENTO_DE_ESTADO, TEXTO_DE_ESTADO } from '../metricas/cores';

export type VagaNoPortal = {
  atividade: string;
  localidade: string;
  turno: string;
  segmento: string;
  resumo: string;
  requisitos: string[];
};

const MOLA = { type: 'spring', stiffness: 260, damping: 24 } as const;

/**
 * As faíscas do "Candidatura enviada": oito pontos que saem do check e
 * somem. Nas cores da marca e do estado "combina" — é um aceno, não uma
 * festa.
 */
const FAISCAS = Array.from({ length: 8 }, (_, i) => {
  const angulo = (i / 8) * Math.PI * 2;
  const distancia = i % 2 === 0 ? 46 : 34;
  return {
    x: Math.cos(angulo) * distancia,
    y: Math.sin(angulo) * distancia,
    cor:
      i % 3 === 0
        ? 'bg-sidebar-primary'
        : i % 3 === 1
          ? PREENCHIMENTO_DE_ESTADO.combina
          : 'bg-sidebar'
  };
});

function Faiscas() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 size-0 -translate-x-[4.5rem]"
    >
      {FAISCAS.map((faisca, i) => (
        <motion.span
          key={i}
          className={cn(
            'absolute -mt-[3px] -ml-[3px] size-1.5 rounded-full',
            faisca.cor
          )}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: faisca.x, y: faisca.y, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.12 }}
        />
      ))}
    </span>
  );
}

/**
 * Ato 1: o portal de vagas, como o candidato o vê.
 *
 * Um portal genérico — cabeçalho pequeno, um cartão de vaga e o botão. A
 * vaga aparece por atividade, localidade, turno e segmento, que é o que o
 * candidato pode saber (R5); o nome da empresa não entra nem aqui.
 */
export function TelaPortal({
  vaga,
  passo,
  botaoRef
}: {
  vaga: VagaNoPortal;
  /** 0 a vaga aparece · 1 o dedo desce · 2 o botão afunda · 3 enviada. */
  passo: number;
  /** Para o dedo achar o botão. */
  botaoRef: RefObject<HTMLButtonElement | null>;
}) {
  const reduzido = useReducedMotion();
  const enviada = passo >= 3;

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <header className="flex items-center justify-between bg-card px-5 pt-14 pb-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Portal de vagas
          </span>
          <span className="text-[17px] font-bold tracking-tight">
            Empregare
          </span>
        </div>
        <IconSearch className="size-5 text-muted-foreground" />
      </header>

      <div className="flex flex-col gap-3 px-4 pt-4">
        <motion.div
          initial={reduzido ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={MOLA}
        >
          <Card className="gap-4 py-5">
            <CardHeader className="gap-2 px-5">
              <Badge
                variant="secondary"
                className="w-fit"
              >
                {vaga.segmento}
              </Badge>
              <CardTitle className="text-[20px] leading-tight [text-wrap:balance]">
                {vaga.atividade}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
                <span className="inline-flex items-center gap-1">
                  <IconMapPin className="size-3.5" />
                  {vaga.localidade}
                </span>
                <span className="inline-flex items-center gap-1">
                  <IconClock className="size-3.5" />
                  {vaga.turno}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 px-5">
              <p className="line-clamp-3 text-[14px] leading-relaxed text-muted-foreground">
                {vaga.resumo}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {vaga.requisitos.map((requisito) => (
                  <li key={requisito}>
                    <Badge
                      variant="outline"
                      className="font-normal text-muted-foreground"
                    >
                      {requisito}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="px-5">
              <div className="relative h-14 w-full">
                <AnimatePresence
                  mode="wait"
                  initial={false}
                >
                  {enviada ? (
                    <motion.div
                      key="enviada"
                      className={cn(
                        'absolute inset-0 flex items-center justify-center gap-3 rounded-md bg-[hsl(var(--estado-combina-bg))]',
                        TEXTO_DE_ESTADO.combina
                      )}
                      initial={reduzido ? false : { opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={MOLA}
                    >
                      <motion.span
                        className={cn(
                          'flex size-8 items-center justify-center rounded-full text-white',
                          PREENCHIMENTO_DE_ESTADO.combina
                        )}
                        initial={reduzido ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 14,
                          delay: 0.05
                        }}
                      >
                        <IconCheck
                          className="size-5"
                          stroke={2.5}
                        />
                      </motion.span>
                      <span className="text-[16px] font-semibold">
                        Candidatura enviada
                      </span>
                      {!reduzido ? <Faiscas /> : null}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="botao"
                      className="absolute inset-0"
                      exit={reduzido ? undefined : { opacity: 0, scale: 0.9 }}
                      animate={{ scale: passo === 2 ? 0.94 : 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 24
                      }}
                    >
                      {/*
                       * Cenário, não controle: quem "toca" é o dedo animado.
                       * Fica fora da ordem de tabulação para o teclado do
                       * palco não parar aqui.
                       */}
                      <Button
                        ref={botaoRef}
                        size="lg"
                        tabIndex={-1}
                        className="h-14 w-full text-[16px]"
                      >
                        Candidatar-se
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Um segundo cartão, cortado pela borda: o portal é uma lista. */}
        <Card className="gap-1 py-4 opacity-60">
          <CardHeader className="px-5">
            <CardDescription className="text-[12px]">
              Outras vagas perto de você
            </CardDescription>
            <CardTitle className="text-[15px] leading-tight">
              Auxiliar de expedição
            </CardTitle>
            <CardDescription className="text-[13px]">
              Várzea Grande, MT · Turno da manhã
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
