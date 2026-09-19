'use client';

import { useEffect, useRef, useState } from 'react';
import {
  FlashIcon,
  FolderOpenIcon,
  Tick02Icon,
  UserGroup02Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

const stats = [
  {
    icon: UserGroup02Icon,
    value: 400,
    suffix: '',
    label: 'Desenvolvedores impactados'
  },
  {
    icon: Tick02Icon,
    value: 80,
    suffix: '',
    label: 'Funcionalidades entregues'
  },
  {
    icon: FolderOpenIcon,
    value: 1,
    suffix: 'K+',
    label: 'Downloads'
  },
  {
    icon: FlashIcon,
    value: 200,
    suffix: '',
    label: 'Horas economizadas'
  }
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView) {
          setInView(true);
        }
      },
      { threshold: 0.45 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [inView]);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, {
      duration: 1.8,
      ease: 'easeOut'
    });
    const unsubscribe = rounded.on('change', (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [inView, value, count, rounded]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  return (
    <section className="section-shell py-18">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative grid grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-8">
          <div
            className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block"
            aria-hidden
          />

          {stats.map(({ icon: Icon, value, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative flex flex-col items-center text-center"
            >
              <div className="icon-ring relative z-10 mb-5">
                <span className="size-13">
                  <HugeiconsIcon
                    icon={Icon}
                    size={22}
                  />
                </span>
              </div>
              <p className="font-[var(--font-marketing-display)] text-4xl font-bold tracking-tight md:text-5xl">
                <AnimatedCounter
                  value={value}
                  suffix={suffix}
                />
              </p>
              <p className="mt-1.5 text-base text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
