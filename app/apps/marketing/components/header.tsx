'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Cancel01Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { AnimatePresence, motion } from 'framer-motion';

import { baseUrl } from '@workspace/routes';

const navLinks = [
  { label: 'Início', href: '/' },
  { label: 'Recursos', href: '/#features' },
  { label: 'Planos', href: '/#pricing' },
  { label: 'Depoimentos', href: '/#about' },
  { label: 'FAQ', href: '/#faq' }
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full px-3 pt-3 sm:px-4 lg:px-6">
      <div
        className={`mx-auto max-w-7xl rounded-2xl transition-all duration-300 ${
          scrolled ? 'glass-nav' : 'border border-transparent bg-transparent'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 lg:px-7">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Image
              src="/logo.png"
              alt="Arki"
              width={110}
              height={32}
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2.5 md:flex">
            <Link
              href={`${baseUrl.dashboard}/auth/sign-in`}
              className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Entrar
            </Link>
            <Link
              href={`${baseUrl.dashboard}/auth/sign-up`}
              className="inline-flex h-11 items-center rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Começar agora
            </Link>
          </div>

          <button
            className="flex size-10 items-center justify-center rounded-xl border border-border bg-white md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Alternar menu"
          >
            <HugeiconsIcon
              icon={mobileOpen ? Cancel01Icon : Menu01Icon}
              size={17}
            />
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-border bg-white/95 px-4 pb-4 pt-2 md:hidden"
            >
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-3 grid gap-2 border-t border-border pt-3">
                <Link
                  href={`${baseUrl.dashboard}/auth/sign-in`}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white text-sm font-medium"
                >
                  Entrar
                </Link>
                <Link
                  href={`${baseUrl.dashboard}/auth/sign-up`}
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground text-sm font-medium text-background"
                >
                  Começar agora
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
