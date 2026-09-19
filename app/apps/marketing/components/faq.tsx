'use client';

import { useState } from 'react';
import { faqEntries } from '@/lib/seo/faq-content';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'framer-motion';

import { SectionBadge } from './section-badge';

function FaqItem({
  question,
  answer,
  defaultOpen = false
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border px-4 py-4 last:border-b-0 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="text-sm font-bold text-foreground">{question}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90"
        >
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={16}
              className="text-background"
            />
          </motion.span>
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-2 pt-2 text-sm font-normal leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq() {
  return (
    <section
      id="faq"
      className="section-shell scroll-mt-24 py-24 lg:py-30"
    >
      <div className="container mx-auto max-w-3xl px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <SectionBadge className="mb-3">Perguntas frequentes</SectionBadge>
          <h2 className="font-[var(--font-marketing-display)] text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Voce tem duvidas, nos temos respostas
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card-soft overflow-hidden"
        >
          {faqEntries.map((faq, i) => (
            <FaqItem
              key={faq.q}
              question={faq.q}
              answer={faq.a}
              defaultOpen={i === 0}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card-soft mt-12 flex flex-col items-center p-8 text-center"
        >
          <h3 className="text-lg font-semibold">
            Ainda com duvidas? Nosso time ajuda voce.
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Tire duvidas de implementacao, arquitetura e melhor estrategia para
            lancar seu SaaS.
          </p>
          <a
            href="mailto:hello@arki.dev"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Falar com especialista
          </a>
        </motion.div>
      </div>
    </section>
  );
}
