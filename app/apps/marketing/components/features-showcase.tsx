'use client';

import Image from 'next/image';
import { Tick02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';

import { SectionBadge } from './section-badge';

const features = [
  {
    title: 'Arquitetura modular',
    description:
      'Estrutura clara por domínio para evoluir sem reescrever o projeto inteiro.'
  },
  {
    title: 'Actions e APIs consistentes',
    description:
      'Server Actions e handlers tipados para fluxo previsível entre frontend e backend.'
  },
  {
    title: 'Integrações prontas',
    description:
      'Auth, billing, email e analytics configurados para acelerar seu time desde o dia um.'
  },
  {
    title: 'Pronto para deploy',
    description:
      'Base preparada para ambientes reais com variáveis, segurança e observabilidade.'
  }
];

export function FeaturesShowcase() {
  return (
    <section className="section-shell py-24 lg:py-30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-18">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <SectionBadge>Stack moderna</SectionBadge>
            <h2 className="mt-5 font-[var(--font-marketing-display)] text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl">
              Menos boilerplate,
              <br />
              mais produto no ar
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Você começa com um template SaaS completo e foca no que gera
              valor: distribuição, conversão e retenção.
            </p>

            <div className="mt-8 overflow-hidden p-3">
              <Image
                src="/showcase.png"
                alt="Recursos da base"
                width={640}
                height={430}
                className="w-full rounded-xl object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <ul className="card-soft space-y-5 p-6">
              {features.map(({ title, description }) => (
                <li
                  key={title}
                  className="flex gap-4"
                >
                  <div className="icon-ring mt-0.5 h-fit">
                    <span className="size-6">
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={13}
                      />
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
