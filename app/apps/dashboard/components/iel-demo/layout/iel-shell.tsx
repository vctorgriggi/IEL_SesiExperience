'use client';

import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Separator } from '@workspace/ui/shadcn/separator';
import { SidebarInset, SidebarProvider } from '@workspace/ui/shadcn/sidebar';

import { AcoesRapidas } from './acoes-rapidas';
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
 * A casa de quem chegou por link: "/candidatura/<id>" ou "/consulta/<token>".
 *
 * O prefixo já para na barra antes do identificador, então o que falta é o
 * primeiro segmento depois dele. Devolve nulo quando não há para onde ir —
 * a própria casa, ou um caminho sem identificador.
 */
function inicioDoLink(pathname: string, base: string): string | null {
  const identificador = pathname.slice(base.length).split('/')[0];
  if (!identificador) return null;
  const inicio = `${base}${identificador}`;
  return inicio === pathname ? null : inicio;
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
  /*
   * A candidatura inteira numa coluna estreita: "Minha candidatura", o
   * questionário e a conversa. O prefixo para antes do identificador, então
   * as três telas herdam a mesma medida — são a mesma pessoa, no mesmo
   * celular, no mesmo link.
   */
  {
    base: prefixo(routes.dashboard.iel.applications.byId(SENTINELA).index),
    largura: 'max-w-xl',
    cabecalho: true
  },
  {
    base: prefixo(routes.dashboard.iel.cultureInvite.byToken(SENTINELA)),
    largura: 'max-w-xl',
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
export function IelShell({
  children,
  ehEquipe
}: {
  children: ReactNode;
  /** A porta exige senha, então há de onde sair. */
  ehEquipe: boolean;
}) {
  const pathname = usePathname();

  // A porta da Central desenha a própria tela, com a marca no centro. Compara
  // exato: é uma tela só, e com o produto na raiz um prefixo curto casaria
  // com mais do que ela.
  if (pathname === routes.dashboard.iel.signIn) return children;

  const porLink = PREFIXOS_POR_LINK.find((rota) =>
    pathname.startsWith(rota.base)
  );

  if (porLink) {
    return (
      <LinkShell
        largura={porLink.largura}
        cabecalho={porLink.cabecalho}
        inicio={inicioDoLink(pathname, porLink.base)}
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
        {/* Primeiro foco da página: pula a barra lateral e o cabeçalho. */}
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-md bg-background px-3 py-2 text-sm font-medium ring-2 ring-ring focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Pular para o conteúdo
        </a>
        <SidebarProvider style={ESTILO_DA_CASCA}>
          <AppSidebar ehEquipe={ehEquipe} />
          <SidebarInset>
            <SiteHeader />
            <div
              id="conteudo"
              tabIndex={-1}
              className="flex flex-1 flex-col gap-4 p-4 pb-24 outline-none md:gap-6 lg:p-6 lg:pb-24"
            >
              {children}
            </div>
            <AcoesRapidas />
          </SidebarInset>
        </SidebarProvider>
      </PageHeaderProvider>
    </div>
  );
}

/**
 * Uma tarefa por link: a marca do produto, o cliente e o conteúdo.
 *
 * O cabeçalho diz de quem é a página que chegou por SMS: a marca Mind RH e,
 * ao lado, o IEL, que é quem fala com o candidato (R5). A marca é o único
 * caminho de volta: do questionário e da conversa, ela leva a "Minha
 * candidatura" — a casa da pessoa, de onde as tarefas saem e para onde
 * voltam. Já estando lá, ela é só a marca, e não um link para a própria
 * página.
 */
function LinkShell({
  children,
  largura,
  cabecalho,
  inicio
}: {
  children: ReactNode;
  largura: string;
  cabecalho: boolean;
  /** Para onde a marca volta, ou nulo quando esta já é a tela inicial. */
  inicio: string | null;
}) {
  const marca = (
    <Image
      src="/marca/mindrh-wordmark.png"
      alt="Mind RH"
      width={2624}
      height={613}
      priority
      className="h-5 w-auto"
    />
  );

  return (
    <div
      data-iel-theme=""
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      {cabecalho ? (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-background/85 px-4 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            {inicio ? (
              <Link
                href={inicio}
                aria-label="Voltar ao início"
                className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {marca}
              </Link>
            ) : (
              marca
            )}
            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />
            <span className="truncate text-xs font-medium text-muted-foreground">
              IEL · Centro de Empregos
            </span>
          </div>
        </header>
      ) : null}
      <main
        className={cn(
          'mx-auto w-full flex-1 px-4 py-4 sm:py-6 pb-24 sm:pb-12',
          largura
        )}
      >
        {children}
      </main>
    </div>
  );
}
