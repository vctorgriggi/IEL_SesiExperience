'use client';

import { useState } from 'react';
import { StarIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';

import { baseUrl } from '@workspace/routes';

export function CtaSection() {
  const [email, setEmail] = useState('');

  return (
    <section className="dark-section bg-background py-24 lg:py-32">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Ative seu{' '}
            <span
              style={{
                background:
                  'linear-gradient(135deg, #ff6b6b 0%, #ffa500 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              teste gratuito de 7 dias
            </span>{' '}
            e lance{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              com confiança
            </span>
          </h2>
          <p className="mt-4 text-base text-foreground/70">
            Sem compromisso, sem complexidade e com estrutura pronta para
            vender. Comece agora e valide seu próximo SaaS em tempo recorde.
          </p>

          {/* Email input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `${baseUrl.dashboard}/auth/sign-up?email=${encodeURIComponent(email)}`;
            }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu melhor e-mail"
              required
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground px-7 py-3 text-sm font-semibold text-background transition-all duration-300 ease-out hover:scale-[1.02] hover:opacity-90"
            >
              Começar agora
            </button>
          </form>

          {/* Rating */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-foreground/60">
            <div className="flex">
              {[1, 2, 3, 4].map((i) => (
                <HugeiconsIcon
                  key={i}
                  icon={StarIcon}
                  size={14}
                  className="fill-yellow-400 text-yellow-400"
                />
              ))}
              <HugeiconsIcon
                icon={StarIcon}
                size={14}
                className="fill-yellow-400/50 text-yellow-400"
              />
            </div>
            <span>
              <strong className="text-foreground/90">Nota média 4,9</strong> ·
              Aprovado por 300+ desenvolvedores
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
