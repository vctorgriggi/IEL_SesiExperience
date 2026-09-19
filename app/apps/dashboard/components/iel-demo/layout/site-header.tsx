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
import { SidebarTrigger } from '@workspace/ui/shadcn/sidebar';

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
  if (pathname === iel.index) return [{ label: 'Hoje' }];
  if (pathname.startsWith(iel.jobs.index)) return [{ label: 'Vagas' }];
  if (pathname.startsWith(iel.companies.index)) return [{ label: 'Empresas' }];
  if (pathname.startsWith(iel.talents.index)) return [{ label: 'Pessoas' }];
  if (pathname.startsWith(iel.clarifications.index))
    return [{ label: 'Perguntas' }];
  if (pathname.startsWith(iel.referrals.index))
    return [{ label: 'Encaminhamentos' }];
  if (pathname.startsWith(iel.dataSources)) return [{ label: 'De onde vem' }];
  return [{ label: 'Hoje' }];
}

/** Cabeçalho de 48px: gatilho da barra, caminho e as ações da tela. */
export function SiteHeader() {
  const pathname = usePathname();
  const { breadcrumb, actions } = usePageHeaderContent();
  const trilha =
    breadcrumb && breadcrumb.length > 0 ? breadcrumb : caminhoDaRota(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {trilha.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {crumb.href && index < trilha.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        {actions ? (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
