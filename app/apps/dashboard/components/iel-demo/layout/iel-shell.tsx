'use client';

import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Separator } from '@workspace/ui/shadcn/separator';
import { SidebarInset, SidebarProvider } from '@workspace/ui/shadcn/sidebar';

import { contextoDaRota, MindTrigger } from '../chat/mind-sheet';
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

/**
 * As telas por link e a largura que cada uma pede.
 *
 * Candidato e colaborador fazem uma tarefa no celular: uma coluna estreita,
 * porque a leitura é vertical e a resposta é um toque. O relatório da empresa
 * é outra coisa — é um documento, lido no computador, com nome e barra lado a
 * lado — e pede 56rem. A largura é da casca, não da página: quem chega por
 * link não deve descobrir a medida do seu papel dentro do conteúdo.
 */
const PREFIXO_DO_RELATORIO = prefixo(
  routes.dashboard.iel.report.byToken(SENTINELA)
);

const PREFIXOS_POR_LINK: {
  base: string;
  largura: string;
  /** Falso quando a própria página já se apresenta. */
  cabecalho: boolean;
}[] = [
  {
    base: prefixo(routes.dashboard.iel.applications.byId(SENTINELA).fit),
    largura: 'max-w-md',
    cabecalho: true
  },
  {
    base: prefixo(routes.dashboard.iel.cultureInvite.byToken(SENTINELA)),
    largura: 'max-w-md',
    cabecalho: true
  },
  /*
   * O relatório é um documento, não uma tela: ele tem o próprio cabeçalho,
   * com a marca e os botões, e é esse cabeçalho que vai para o PDF. A casca
   * se cala aqui para a marca não aparecer duas vezes na mesma dobra.
   */
  { base: PREFIXO_DO_RELATORIO, largura: 'max-w-4xl', cabecalho: false }
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
  const porLink = PREFIXOS_POR_LINK.find((rota) =>
    pathname.startsWith(rota.base)
  );

  if (porLink) {
    return (
      <LinkShell
        largura={porLink.largura}
        cabecalho={porLink.cabecalho}
      >
        {children}
      </LinkShell>
    );
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
            <MindTrigger contexto={contextoDaRota(pathname)} />
          </SidebarInset>
        </SidebarProvider>
      </PageHeaderProvider>
    </div>
  );
}

/**
 * Uma tarefa por link: a marca do produto, o cliente e o conteúdo.
 *
 * O cabeçalho aqui não navega — não há para onde ir. Ele existe para dizer de
 * quem é a página que chegou por SMS: a marca Mind RH e, ao lado, o IEL, que
 * é quem fala com o candidato (R5).
 */
function LinkShell({
  children,
  largura,
  cabecalho
}: {
  children: ReactNode;
  largura: string;
  cabecalho: boolean;
}) {
  return (
    <div
      data-iel-theme=""
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      {cabecalho ? (
        <header className="flex h-12 shrink-0 items-center gap-2 px-4">
          <Image
            src="/marca/mindrh-wordmark.png"
            alt="Mind RH"
            width={2624}
            height={613}
            priority
            className="h-5 w-auto"
          />
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4"
          />
          <span className="truncate text-xs text-muted-foreground">
            IEL · Centro de Empregos
          </span>
        </header>
      ) : null}
      <main className={cn('mx-auto w-full flex-1 px-4 pb-10', largura)}>
        {children}
      </main>
    </div>
  );
}
