'use client';

import type { RefObject } from 'react';
import {
  IconChevronLeft,
  IconMessage,
  IconMicrophone
} from '@tabler/icons-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { cn } from '@workspace/ui/lib/utils';

import { LADO } from '../metricas/cores';

const MOLA = { type: 'spring', stiffness: 260, damping: 24 } as const;

/** Quem manda, como aparece no celular: o IEL, nunca a empresa (R5). */
const REMETENTE = 'IEL — Centro de Empregos';

/**
 * Ato 2: a mensagem chega.
 *
 * Um app de mensagens neutro — bolhas, "digitando", uma notificação — sem
 * imitar nenhum produto. O texto da bolha é o que o IEL manda de verdade
 * (`analysis/mensagens.ts`, etapa "convite ao questionário"); a cena só o
 * põe na tela. O link é decorativo: quem abre o questionário é o dedo, no
 * terceiro ato.
 */
export function TelaMensagens({
  mensagem,
  link,
  passo,
  destacarLink,
  linkRef
}: {
  /** A mensagem inteira, com o link em `https://` dentro. */
  mensagem: string;
  /** O endereço como aparece na bolha, sem o `https://`. */
  link: string;
  /** 0 vazio · 1 notificação · 2 digitando · 3 a bolha. */
  passo: number;
  /** O toque no link, no terceiro ato: a bolha pulsa e o link acende. */
  destacarLink: boolean;
  /** Para o dedo achar o link. */
  linkRef: RefObject<HTMLSpanElement | null>;
}) {
  const reduzido = useReducedMotion();
  const [antes = '', depois = ''] = mensagem.split(`https://${link}`);
  const previa = mensagem.split('\n')[0] ?? '';

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <header className="flex items-center gap-3 border-b bg-card px-4 pt-13 pb-3">
        <IconChevronLeft className="size-5 text-muted-foreground" />
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar text-[12px] font-bold text-sidebar-foreground">
          IEL
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-semibold">
            {REMETENTE}
          </p>
          <p className="text-[12px] text-muted-foreground">Mensagens</p>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col gap-3 overflow-hidden px-4 pt-4">
        <span className="mx-auto rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
          Hoje
        </span>

        <AnimatePresence
          mode="wait"
          initial={false}
        >
          {passo === 2 ? (
            <motion.div
              key="digitando"
              className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-3.5 shadow-xs"
              initial={reduzido ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduzido ? undefined : { opacity: 0, scale: 0.9 }}
              transition={MOLA}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-2 rounded-full bg-muted-foreground/70"
                  animate={
                    reduzido
                      ? undefined
                      : { y: [0, -4, 0], opacity: [0.5, 1, 0.5] }
                  }
                  transition={{
                    repeat: Infinity,
                    duration: 0.9,
                    delay: i * 0.15
                  }}
                />
              ))}
            </motion.div>
          ) : null}

          {passo >= 3 ? (
            <motion.div
              key="bolha"
              className="flex max-w-[88%] flex-col gap-1"
              initial={reduzido ? false : { opacity: 0, y: 12, scale: 0.96 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: destacarLink && !reduzido ? [1, 1.03, 1] : 1
              }}
              // O pulso tem três quadros, e mola só anda entre dois.
              transition={{
                ...MOLA,
                scale: { duration: 0.4, ease: 'easeInOut' }
              }}
            >
              <p className="rounded-2xl rounded-bl-md bg-card px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line shadow-xs">
                {antes}
                <span
                  ref={linkRef}
                  className={cn(
                    'rounded-sm underline decoration-2 underline-offset-2 transition-colors',
                    LADO.empresa.texto,
                    destacarLink && LADO.empresa.fundo
                  )}
                >
                  {link}
                </span>
                {depois}
              </p>
              <span className="pl-1 text-[11px] text-muted-foreground">
                09:14
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <footer className="flex items-center gap-3 border-t bg-card px-4 pt-3 pb-7">
        <div className="flex h-10 flex-1 items-center rounded-full border bg-background px-4 text-[14px] text-muted-foreground">
          Mensagem
        </div>
        <IconMicrophone className="size-5 text-muted-foreground" />
      </footer>

      {/* A notificação desce por cima de tudo e recolhe sozinha. */}
      <AnimatePresence>
        {passo === 1 ? (
          <motion.div
            key="notificacao"
            className="absolute inset-x-3 top-14 z-20 flex items-start gap-3 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur"
            initial={reduzido ? false : { y: -140, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduzido ? undefined : { y: -140, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar text-sidebar-foreground">
              <IconMessage className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-semibold">
                  {REMETENTE}
                </p>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  agora
                </span>
              </div>
              <p className="line-clamp-2 text-[13px] text-muted-foreground">
                {previa}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
