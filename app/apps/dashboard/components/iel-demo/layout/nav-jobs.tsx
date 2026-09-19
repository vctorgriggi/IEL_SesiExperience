'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCultureSampleProgress,
  getReferralListSelection,
  getVisibleCompanies,
  getVisibleJobs,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import {
  AlertCircle,
  Briefcase,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { Badge } from '@workspace/ui/shadcn/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@workspace/ui/shadcn/collapsible';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem
} from '@workspace/ui/shadcn/sidebar';

/**
 * A árvore Empresa → Vaga.
 *
 * É a navegação de trabalho da analista: ela não procura "uma vaga", procura
 * a vaga de uma empresa. Cada linha de vaga carrega quantos currículos já
 * foram marcados dos cinco que a remessa aceita, e a empresa cujo perfil
 * ainda não fecha avisa ali mesmo — cobrar a amostra é tarefa dela.
 */
/** Quantas empresas cabem na árvore antes de "Todas as vagas". */
const EMPRESAS_NA_ARVORE = 6;

export function NavJobs() {
  const { state } = useIelDemo();
  const pathname = usePathname();
  const iel = routes.dashboard.iel;

  const jobs = getVisibleJobs(state).filter((job) => job.stage !== 'encerrada');

  /*
   * A árvore mostra as primeiras empresas com vaga aberta, mais a empresa da
   * rota atual. A base de demonstração tem um pano de fundo gerado com
   * dezenas de empresas, e listar todas aqui empurraria o rodapé para fora
   * da tela — o resto está em "Todas as vagas", que tem busca e filtro.
   */
  const comVaga = getVisibleCompanies(state).filter((company) =>
    jobs.some((job) => job.companyId === company.id)
  );
  const daRota = comVaga.find(
    (company) =>
      pathname === iel.companies.byId(company.id) ||
      jobs.some(
        (job) =>
          job.companyId === company.id &&
          pathname.startsWith(iel.jobs.byId(job.id).index)
      )
  );
  const companies = comVaga.slice(0, EMPRESAS_NA_ARVORE);
  if (daRota && !companies.includes(daRota)) companies.push(daRota);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Vagas abertas</SidebarGroupLabel>
      <SidebarMenu>
        {companies.map((company) => {
          const companyJobs = jobs.filter(
            (job) => job.companyId === company.id
          );
          if (companyJobs.length === 0) return null;

          const aberta =
            pathname === iel.companies.byId(company.id) ||
            companyJobs.some((job) =>
              pathname.startsWith(iel.jobs.byId(job.id).index)
            );
          const amostra = getCultureSampleProgress(state, company.id);

          return (
            <Collapsible
              key={company.id}
              asChild
              defaultOpen={aberta}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={company.name}>
                    <Briefcase />
                    <span className="truncate">{company.name}</span>
                    {amostra.ready || amostra.total === 0 ? null : (
                      <Badge
                        variant="outline"
                        className="ml-auto gap-1 font-normal tabular-nums text-muted-foreground"
                        title="A consulta aos colaboradores ainda não sustenta o perfil da empresa."
                      >
                        <AlertCircle className="text-amber-600" />
                        {amostra.answered}/{amostra.total}
                      </Badge>
                    )}
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-has-[[data-slot=badge]]/collapsible:ml-0" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {companyJobs.map((job) => {
                      const href = iel.jobs.byId(job.id).index;
                      const marcados = getReferralListSelection(
                        state,
                        job.id
                      ).length;
                      return (
                        <SidebarMenuSubItem key={job.id}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === href}
                          >
                            <Link href={href}>
                              <span className="truncate">{job.title}</span>
                              <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                                {marcados}/{REFERRAL_LIMIT}
                              </span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}

        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className="text-muted-foreground"
          >
            <Link href={iel.jobs.index}>
              <MoreHorizontal />
              <span>Todas as vagas</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
