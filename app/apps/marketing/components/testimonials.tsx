'use client';

import { motion } from 'framer-motion';

import { SectionBadge } from './section-badge';

const testimonials = [
  {
    name: 'John Matthews',
    role: 'Tech Lead',
    content:
      'Reduzimos semanas de setup para dias. Autenticação, billing e multi-tenant já vieram prontos; só customizamos o que importava para o produto.',
    rating: 5
  },
  {
    name: 'Sarah Collins',
    role: 'Founder',
    content:
      'A base é limpa e documentada. Conseguimos lançar o MVP e iterar rápido sem refatorar tudo. O tempo para primeira venda caiu muito.',
    rating: 5
  },
  {
    name: 'David Chen',
    role: 'Dev Full Stack',
    content:
      'Código organizado, tipos em tudo e padrão de API consistente. Foi fácil integrar nosso backend e escalar sem retrabalho estrutural.',
    rating: 5
  }
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

function Stars({ count = 5 }: { count?: number }) {
  return (
    <div
      className="flex gap-0.5"
      aria-label={`${count} estrelas`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="size-4 text-amber-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const colors = [
    '#ff8f72',
    '#7c9cff',
    '#4bbf9e',
    '#f0b957',
    '#b178ff',
    '#58c6df'
  ];
  const color = colors[name.charCodeAt(0) % colors.length];

  return (
    <div
      style={{ backgroundColor: color }}
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
    >
      {name.charAt(0)}
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      id="about"
      className="section-shell scroll-mt-24 py-24 lg:py-30"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <SectionBadge className="gap-1.5">Depoimentos</SectionBadge>
          <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            O que quem já lançou diz
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Veja como a base pronta ajudou times a validar produto e escalar,
            pelos próprios depoimentos.
          </p>
        </motion.header>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {testimonials.map((t) => (
            <motion.article
              key={t.name}
              variants={cardVariants}
              className="card-soft group relative overflow-hidden p-6 md:p-7"
            >
              <div className="relative">
                <div className="flex items-start gap-3">
                  <Avatar name={t.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <Stars count={t.rating} />
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {t.content}
                </p>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  {t.role}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
