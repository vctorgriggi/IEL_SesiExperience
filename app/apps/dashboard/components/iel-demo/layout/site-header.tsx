'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { routes } from '@workspace/routes';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@workspace/ui/shadcn/breadcrumb';
import { Separator } from '@workspace/ui/shadcn/separator';
import { SidebarTrigger, useSidebar } from '@workspace/ui/shadcn/sidebar';

import { TourMenu } from '../tour/tour-menu';
import { NotificacoesMenu } from './notificacoes-menu';
import {
  usePageHeaderContent,
  type PageHeaderCrumb
} from './page-header-context';

/**
 * Caminho de reserva, para a tela que ainda não publica o seu.
 *
 * As telas dizem onde estão por `usePageHeader`; enquanto uma não disser, o
 * cabeçalho não pode ficar vazio — a barra de 48px é o que orienta quem
 * entrou por link direto.
 */
function caminhoDaRota(pathname: string): PageHeaderCrumb[] {
  const iel = routes.dashboard.iel;
  if (pathname === iel.index) return [{ label: 'Início' }];
  if (pathname.startsWith(iel.jobs.index)) return [{ label: 'Vagas' }];
  if (pathname.startsWith(iel.companies.index)) return [{ label: 'Empresas' }];
  if (pathname.startsWith(iel.talents.index))
    return [{ label: 'Banco de talentos' }];
  if (pathname.startsWith(iel.clarifications.index))
    return [{ label: 'Perguntas' }];
  if (pathname.startsWith(iel.referrals.index))
    return [{ label: 'Encaminhamentos' }];
  if (pathname.startsWith(iel.dataSources)) return [{ label: 'Integrações' }];
  if (pathname.startsWith(iel.candidates)) return [{ label: 'Questionários' }];
  if (pathname.startsWith(iel.bi)) return [{ label: 'BI' }];
  return [{ label: 'Início' }];
}

/** Cabeçalho de 48px: gatilho da barra, caminho e as ações da tela. */
export function SiteHeader() {
  const pathname = usePathname();
  const { breadcrumb, actions } = usePageHeaderContent();
  const { isMobile, open, openMobile } = useSidebar();
  const trilha =
    breadcrumb && breadcrumb.length > 0 ? breadcrumb : caminhoDaRota(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        {/* O kit traz o nome em inglês ("Toggle Sidebar"); o `aria-label`
            o substitui, e o `aria-expanded` diz se o menu está aberto. */}
        <SidebarTrigger
          className="-ml-1"
          aria-label="Menu principal"
          aria-expanded={isMobile ? openMobile : open}
        />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb
          aria-label="Onde você está"
          className="min-w-0 flex-1"
        >
          {/*
           * Em 390px o caminho não pode quebrar em três linhas e empurrar o
           * título: a lista fica numa linha só, os degraus do meio somem no
           * celular (o último já diz onde se está) e o degrau atual corta com
           * reticências em vez de embrulhar.
           */}
          <BreadcrumbList className="min-w-0 flex-nowrap">
            {trilha.map((crumb, index) => {
              const ultimo = index === trilha.length - 1;
              return (
                <Fragment key={`${crumb.label}-${index}`}>
                  {index > 0 ? (
                    <BreadcrumbSeparator className="hidden sm:block" />
                  ) : null}
                  <BreadcrumbItem
                    className={
                      ultimo ? 'min-w-0' : 'hidden min-w-0 sm:inline-flex'
                    }
                  >
                    {crumb.href && !ultimo ? (
                      <BreadcrumbLink asChild>
                        <Link
                          href={crumb.href}
                          className="truncate"
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="truncate">
                        {crumb.label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
        {/*
         * O tour fica sempre à direita, antes das ações da tela: é a mesma
         * porta em todas as telas, e quem procura ajuda procura no mesmo
         * canto. As ações da página vêm depois porque mudam a cada tela.
         */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {/*
           * O sino antes do tour: o que precisa de mim hoje vem antes de como
           * a tela funciona. Os dois ficam no mesmo canto em todas as telas;
           * as ações da página vêm depois porque mudam a cada tela.
           */}
          <NotificacoesMenu />
          <TourMenu />
          {actions}
        </div>
      </div>
    </header>
  );
}
