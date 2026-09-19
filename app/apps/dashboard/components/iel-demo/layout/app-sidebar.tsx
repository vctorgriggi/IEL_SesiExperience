'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getTalent,
  getVisibleCompanies,
  getVisibleJobs,
  getVisibleTalentIds
} from '@/features/iel-demo/state/selectors';
import {
  Building2,
  ChevronsUpDown,
  CirclePlus,
  Database,
  HelpCircle,
  Inbox,
  ListOrdered,
  ScatterChart,
  Search,
  Users
} from 'lucide-react';

import { routes } from '@workspace/routes';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@workspace/ui/shadcn/command';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem
} from '@workspace/ui/shadcn/sidebar';

import { montarPendencias } from '../overview/pendencias';
import { ComoFuncionaDialog, RoteiroDialog } from './demo-dialogs';
import { NavJobs } from './nav-jobs';
import { NavUser } from './nav-user';

/**
 * Barra do analista.
 *
 * Papéis (prancha 2): só o analista tem app. A barra é dele — empresa e
 * candidato recebem link, e essas telas ficam fora desta casca.
 */
export function AppSidebar() {
  const { state, persona } = useIelDemo();
  const pathname = usePathname();
  const iel = routes.dashboard.iel;

  const [busca, setBusca] = useState(false);
  const [comoFunciona, setComoFunciona] = useState(false);
  const [roteiro, setRoteiro] = useState(false);

  /*
   * A fila do dia percorre o ranking de cada vaga visível, e a barra fica
   * montada em todas as telas. Sem memória, abrir um diálogo recalcularia a
   * base inteira.
   */
  const pendencias = useMemo(() => montarPendencias(state).length, [state]);
  const primeiraVaga = useMemo(
    () => getVisibleJobs(state).find((job) => job.stage !== 'encerrada'),
    [state]
  );

  /*
   * O gestor entra pela mesma casca, mas não faz o trabalho da analista:
   * importar planilha, varrer a fila do dia e navegar pela base de pessoas
   * são tarefas do IEL. Deixar esses destinos no menu dele seria oferecer
   * portas para o recorte de outras empresas (PRODUTO.md §5) — o único lugar
   * que faz sentido para ele é a própria empresa.
   */
  const eGestor = persona.kind === 'gestor';
  const empresaDoGestor = persona.companyId;

  const principais = eGestor
    ? [
        {
          href: empresaDoGestor
            ? iel.companies.byId(empresaDoGestor)
            : iel.companies.index,
          label: 'Minha empresa',
          icon: Building2,
          badge: null
        }
      ]
    : [
        {
          href: iel.index,
          label: 'Hoje',
          icon: Inbox,
          badge: pendencias > 0 ? pendencias : null
        },
        {
          href: iel.companies.index,
          label: 'Empresas',
          icon: Building2,
          badge: null
        },
        { href: iel.talents.index, label: 'Pessoas', icon: Users, badge: null },
        /*
         * O mapa reúne a base de talentos do IEL, então fica fora do menu do
         * gestor pela mesma razão que "Pessoas": seria porta para o recorte de
         * outras empresas (PRODUTO.md §5).
         */
        {
          href: iel.cultureMap,
          label: 'Mapa de cultura',
          icon: ScatterChart,
          badge: null
        }
      ];

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/*
             * Recolhida, a barra encolhe o botão para 32px de largura mas
             * mantém a altura de `size="lg"`; sem tirar o respiro e sem
             * travar a proporção, o símbolo esticava e a ligadura virava um
             * oval. A imagem carrega a própria medida — 32 por 32, quadrada —
             * e não herda nada do botão.
             */}
            <SidebarMenuButton
              size="lg"
              asChild
              className="group-data-[collapsible=icon]:[padding:0]!"
            >
              <Link href={iel.index}>
                <Image
                  src="/marca/simbolo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="aspect-square size-8 min-w-8 shrink-0 rounded-lg object-cover"
                />
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">Mind RH</span>
                  <span className="truncate text-xs text-muted-foreground">
                    IEL · Centro de Empregos
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            {eGestor ? null : (
              <SidebarMenu>
                <SidebarMenuItem className="flex items-center gap-2">
                  <SidebarMenuButton
                    asChild
                    tooltip="Importar planilha"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                  >
                    <Link
                      href={
                        primeiraVaga
                          ? iel.jobs.byId(primeiraVaga.id).import
                          : iel.jobs.index
                      }
                    >
                      <CirclePlus />
                      <span>Importar planilha</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuButton
                    onClick={() => setBusca(true)}
                    aria-label="Buscar (⌘K)"
                    title="Buscar (⌘K)"
                    className="size-8 shrink-0 justify-center border bg-background group-data-[collapsible=icon]:hidden"
                  >
                    <Search />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            )}

            <SidebarMenu>
              {principais.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavJobs />

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setComoFunciona(true)}
                  tooltip="Como funciona"
                >
                  <HelpCircle />
                  <span>Como funciona</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setRoteiro(true)}
                  tooltip="Roteiro da demo"
                >
                  <ListOrdered />
                  <span>Roteiro da demo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="De onde vem"
                  isActive={pathname === iel.dataSources}
                >
                  <Link href={iel.dataSources}>
                    <Database />
                    <span>De onde vem</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <BuscaGlobal
        open={busca}
        onOpenChange={setBusca}
      />
      <ComoFuncionaDialog
        open={comoFunciona}
        onOpenChange={setComoFunciona}
      />
      <RoteiroDialog
        open={roteiro}
        onOpenChange={setRoteiro}
      />
    </Sidebar>
  );
}

/**
 * Busca por vaga, empresa e pessoa — o que a analista procura pelo nome.
 *
 * O recorte é o da persona: o que `getVisible*` não devolve não aparece aqui
 * também.
 */
function BuscaGlobal({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state } = useIelDemo();
  const router = useRouter();
  const iel = routes.dashboard.iel;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  const ir = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const talentos = getVisibleTalentIds(state)
    .map((id) => getTalent(id, state))
    .filter((talent) => talent !== null);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Buscar"
      description="Vagas, empresas e pessoas da base."
    >
      <CommandInput placeholder="Buscar vaga, empresa ou pessoa…" />
      <CommandList>
        <CommandEmpty>Nada encontrado.</CommandEmpty>
        <CommandGroup heading="Vagas">
          {getVisibleJobs(state).map((job) => (
            <CommandItem
              key={job.id}
              value={`vaga ${job.title}`}
              onSelect={() => ir(iel.jobs.byId(job.id).index)}
            >
              {job.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Empresas">
          {getVisibleCompanies(state).map((company) => (
            <CommandItem
              key={company.id}
              value={`empresa ${company.name}`}
              onSelect={() => ir(iel.companies.byId(company.id))}
            >
              {company.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Pessoas">
          {talentos.map((talent) => (
            <CommandItem
              key={talent.id}
              value={`pessoa ${talent.name}`}
              onSelect={() => ir(iel.talents.byId(talent.id).index)}
            >
              {talent.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
