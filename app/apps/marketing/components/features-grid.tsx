'use client';

import Image from 'next/image';
import {
  CreditCardIcon,
  Folder01Icon,
  LockIcon,
  UserMultipleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { motion } from 'framer-motion';

import { SectionBadge } from './section-badge';

const features = [
  {
    icon: LockIcon,
    title: 'Autenticação pronta',
    description:
      'Login, cadastro, recuperação de senha e sessão segura já implementados para produção.'
  },
  {
    icon: CreditCardIcon,
    title: 'Billing integrado',
    description:
      'Planos, assinaturas e pagamentos configuráveis para validar e monetizar seu SaaS.'
  },
  {
    icon: UserMultipleIcon,
    title: 'Multi-tenancy e organizações',
    description:
      'Suporte a múltiplos workspaces e times com permissões e convites prontos.'
  },
  {
    icon: Folder01Icon,
    title: 'Código organizado e documentado',
    description:
      'Estrutura modular, tipagem forte e documentação para evoluir sem retrabalho.'
  }
];

function Mockup() {
  return (
    <div className="relative overflow-hidden p-3 sm:p-4">
      <Image
        src="/modules.png"
        alt="Dashboard e módulos do starter"
        width={640}
        height={390}
        quality={100}
        className="h-auto w-full rounded-xl object-cover object-top"
        sizes="(max-width: 1024px) 100vw, 85vw"
      />
    </div>
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function FeaturesGrid() {
  return (
    <section
      id="features"
      className="section-shell scroll-mt-24 py-24 lg:py-30"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-18">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.div variants={itemVariants}>
              <SectionBadge>Template SaaS</SectionBadge>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground md:text-5xl"
            >
              Tudo que voce precisa
              <br />
              para lançar em produção
            </motion.h2>

            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {features.map(({ icon: featureIcon, title, description }) => (
                <motion.div
                  key={title}
                  variants={itemVariants}
                  className="card-soft p-5"
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted">
                    <HugeiconsIcon
                      icon={featureIcon}
                      size={17}
                      className="text-foreground"
                    />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <Mockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
