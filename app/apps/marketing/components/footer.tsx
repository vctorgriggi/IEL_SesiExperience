import Link from 'next/link';

import { APP_NAME } from '@workspace/common/app';
import { baseUrl, routes } from '@workspace/routes';

const footerLinks = {
  Início: [
    { label: 'Recursos', href: '/#features' },
    { label: 'Planos', href: '/#pricing' },
    { label: 'Depoimentos', href: '/#about' },
    { label: 'Perguntas frequentes', href: '/#faq' }
  ],
  Páginas: [
    { label: 'Início', href: routes.marketing.index },
    { label: 'Criar conta', href: `${baseUrl.dashboard}/auth/sign-up` },
    { label: 'Entrar', href: `${baseUrl.dashboard}/auth/sign-in` },
    { label: 'Política de privacidade', href: routes.marketing.privacyPolicy },
    { label: 'Termos de uso', href: routes.marketing.termsOfUse },
    { label: 'Contato', href: routes.marketing.contact }
  ],
  Social: [
    { label: 'LinkedIn', href: '#' },
    { label: 'Twitter / X', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'GitHub', href: '#' }
  ]
};

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Main footer */}
        <div className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2"
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-background">
                <span className="text-sm font-bold text-foreground">A</span>
              </div>
              <span className="text-base font-semibold">{APP_NAME}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-background/60">
              O ponto de partida premium para lançar, validar e escalar novos
              produtos SaaS.
            </p>
            <a
              href="mailto:hello@arki.dev"
              className="mt-4 flex items-center gap-2 text-sm text-background/60 transition-colors hover:text-background"
            >
              <span>✉</span>
              <span>hello@arki.dev</span>
              <span>→</span>
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="mb-4 text-sm font-semibold text-background">
                {group}
              </h4>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-background/60 transition-colors hover:text-background"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-4 border-t border-white/10 py-6 md:flex-row md:justify-between">
          <p className="text-xs text-background/40">
            © {new Date().getFullYear()} {APP_NAME}. Todos os direitos
            reservados.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-green-400" />
              <span className="text-xs text-background/40">
                Todos os sistemas funcionando
              </span>
            </div>
            <Link
              href={routes.marketing.privacyPolicy}
              className="text-xs text-background/40 transition-colors hover:text-background/80"
            >
              Política de privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
