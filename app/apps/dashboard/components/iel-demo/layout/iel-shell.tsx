'use client';

import type { CSSProperties, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { routes } from '@workspace/routes';
import { SidebarInset, SidebarProvider } from '@workspace/ui/shadcn/sidebar';

import { AppSidebar } from './app-sidebar';
import { PageHeaderProvider } from './page-header-context';
import { SiteHeader } from './site-header';

/**
 * Prefixos das telas que chegam por link, derivados de `@workspace/routes`.
 *
 * O sentinela existe para não escrever o caminho à mão: a rota continua
 * sendo a do pacote, e daqui só se lê o que vem antes do identificador.
 */
const SENTINELA = '__id__';

function prefixo(caminho: string): string {
  return caminho.slice(0, caminho.indexOf(SENTINELA));
}

/**
 * Medidas da casca, no formato do block: a barra em 16rem e o cabeçalho em
 * 3rem, ambos escritos na escala de espaçamento do Tailwind.
 */
const ESTILO_DA_CASCA: CSSProperties & Record<`--${string}`, string> = {
  '--sidebar-width': 'calc(var(--spacing) * 64)',
  '--header-height': 'calc(var(--spacing) * 12)'
};

const PREFIXOS_POR_LINK = [
  prefixo(routes.dashboard.iel.applications.byId(SENTINELA).fit),
  prefixo(routes.dashboard.iel.cultureInvite.byToken(SENTINELA))
];

/**
 * Casca do analista: barra lateral, cabeçalho de 48px e o conteúdo.
 *
 * Candidato e empresa não entram aqui. São três papéis e três produtos
 * (prancha 2): quem chega por link faz uma tarefa no celular, sem login e
 * sem menu — dar a eles a navegação do analista seria mostrar um app que
 * eles não têm.
 */
export function IelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const porLink = PREFIXOS_POR_LINK.some((base) => pathname.startsWith(base));

  if (porLink) {
    return <LinkShell>{children}</LinkShell>;
  }

  return (
    <div
      data-iel-theme=""
      className="bg-background text-foreground"
    >
      <PageHeaderProvider>
        <SidebarProvider style={ESTILO_DA_CASCA}>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 lg:p-6">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </PageHeaderProvider>
    </div>
  );
}

/** Uma tarefa por link: o quadrado "IEL" e nada mais. */
function LinkShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-iel-theme=""
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      <header className="flex h-12 shrink-0 items-center px-4">
        <span
          aria-hidden="true"
          className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground"
        >
          IEL
        </span>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-10">
        {children}
      </main>
    </div>
  );
}
