'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const phrases = [
  'setup de auth do zero',
  'billing manual',
  'estrutura sem padrão',
  'multi-tenancy complexo',
  'deploy inseguro',
  'código acoplado',
  'documentação zerada'
];

const listItems = [...phrases, ...phrases];
const ROW_HEIGHT = 56;
const VISIBLE_ROWS = 5;
const ROTATE_INTERVAL_MS = 2500;

export function WaveGoodbye() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((i) => {
        const next = i + 1;
        if (next > phrases.length) {
          setResetKey((k) => k + 1);
          return 0;
        }
        return next;
      });
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const centerOffset = Math.floor(VISIBLE_ROWS / 2) * ROW_HEIGHT;
  const translateY = centerOffset - currentIndex * ROW_HEIGHT;

  return (
    <section className="section-shell overflow-hidden py-14 lg:py-18">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
        <div className="relative flex w-full max-w-xl shrink-0 items-center justify-center lg:max-w-sm lg:justify-start">
          <Image
            className="absolute -right-4 bottom-0 hidden md:block"
            src="/arrow.svg"
            alt="Arrow"
            width={140}
            height={280}
            quality={82}
          />
          <p className="text-center font-[var(--font-marketing-display)] text-[clamp(2rem,9vw,3rem)] font-extrabold tracking-tight text-foreground lg:text-left">
            Diga adeus a
          </p>
        </div>

        <div
          className="w-full overflow-hidden px-1 sm:px-2 lg:flex-1 lg:px-0"
          style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}
        >
          <div
            key={resetKey}
            className="flex flex-col transition-transform duration-500 ease-out"
            style={{ transform: `translateY(${translateY}px)` }}
          >
            {listItems.map((phrase, i) => {
              const isHighlighted = i === currentIndex;
              return (
                <div
                  key={i}
                  className="flex shrink-0 items-center justify-center lg:justify-start"
                  style={{ height: ROW_HEIGHT }}
                >
                  <span
                    className={
                      isHighlighted
                        ? 'gradient-text max-w-full text-center text-[clamp(1.45rem,7vw,2.75rem)] font-extrabold leading-none tracking-tight lg:text-left'
                        : 'max-w-full text-center text-[clamp(1.45rem,7vw,2.75rem)] font-extrabold leading-none tracking-tight text-muted-foreground/45 lg:text-left'
                    }
                  >
                    {phrase}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
