'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';

import { APP_NAME } from '@workspace/common/app';
import { baseUrl } from '@workspace/routes';

function DashboardMockup() {
  return (
    <div className="card-soft mx-auto w-full max-w-[1120px] overflow-hidden border border-[hsl(var(--marketing-line))]">
      <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-3 sm:px-6 sm:py-4">
        <span className="size-2.5 rounded-full bg-red-400" />
        <span className="size-2.5 rounded-full bg-amber-400" />
        <span className="size-2.5 rounded-full bg-emerald-400" />
        <div className="ml-2 flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-muted-foreground sm:text-sm">
          kit-saas.arki.dev
        </div>
      </div>
      <div className="relative h-[220px] overflow-hidden bg-white sm:h-[500px] lg:h-[620px]">
        <Image
          src="/arki.png"
          alt="SaaS template dashboard"
          fill
          className="object-cover"
          priority
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent sm:h-52" />
      </div>
    </div>
  );
}

export function Hero() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: dashboardRef,
    offset: ['start 95%', 'end 25%']
  });

  const cardScale = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  const cardY = useTransform(scrollYProgress, [0, 1], [26, 0]);

  return (
    <section className="relative overflow-hidden pb-16 pt-30 lg:pb-24 lg:pt-38">
     <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 12% 18%, hsl(28 85% 85% / 0.9), transparent 34%), radial-gradient(circle at 88% 20%, hsl(320 60% 87% / 0.82), transparent 35%), radial-gradient(circle at 86% 60%, hsl(18 90% 82% / 0.82), transparent 33%), linear-gradient(180deg, hsl(var(--marketing-surface)) 0%, hsl(var(--marketing-surface)) 100%)'
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          background:
            'repeating-linear-gradient(to right, hsl(0 0% 100% / 0.28) 0, hsl(0 0% 100% / 0.28) 88px, transparent 88px, transparent 170px)',
          maskImage: 'linear-gradient(to bottom, black 25%, transparent 90%)'
        }}
      />

      <div className="container relative z-10 mx-auto px-4 text-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pill mx-auto w-fit"
        >
          <span className="gradient-text font-semibold">150h+</span>
          economizadas por lançamento com {APP_NAME}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto mt-6 max-w-4xl font-[var(--font-marketing-display)] text-5xl font-extrabold leading-[1.02] tracking-tight text-foreground md:text-7xl"
        >
          Template SaaS pronto
          <br />
          para lançar em <span className="gradient-text">produção</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-xl"
        >
          Autenticação, billing, multi-tenant e estrutura escalável em Next.js
          para você validar seu produto mais rápido.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href={`${baseUrl.dashboard}/auth/sign-up`}
            className="inline-flex h-12 items-center rounded-xl bg-foreground px-8 text-sm font-semibold text-background transition-opacity hover:opacity-85"
          >
            Começar agora
          </Link>
          <Link
            href={`${baseUrl.dashboard}/auth/sign-in`}
            className="inline-flex h-12 items-center rounded-xl border border-border bg-white px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Ver demo
          </Link>
        </motion.div>

        <motion.div
          ref={dashboardRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.5 }}
          style={{ scale: cardScale, y: cardY }}
          className="mt-12 w-full origin-top lg:mt-16"
        >
          <DashboardMockup />
        </motion.div>
      </div>
    </section>
  );
}
