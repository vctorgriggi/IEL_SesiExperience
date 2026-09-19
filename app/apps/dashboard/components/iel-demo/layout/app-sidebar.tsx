'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ALL_TALENTS } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getCompany,
  getCompatibleCount,
  getJobListState,
  getReferralListSelection,
  getTalent,
  getVisibleCompanies,
  getVisibleJobs,
  getVisibleTalentIds,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';
import {
  Briefcase,
  Building2,
  ChartColumn,
  ChevronsUpDown,
  CirclePlus,
  HelpCircle,
  Inbox,
  ListOrdered,
  MessageSquare,
  Plug,
  Search,
  Users,
  type LucideIcon
} from 'lucide-react';

import { routes } from '@workspace/routes';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@workspace/ui/shadcn/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/shadcn/dialog';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem
} from '@workspace/ui/shadcn/sidebar';

import { normalizarBusca } from '../jobs/busca';
import { montarPendencias } from '../overview/pendencias';
import { ComoFuncionaDialog, RoteiroDialog } from './demo-dialogs';
import { NavUser } from './nav-user';
import { RECENTES_NA_BARRA, useRecentJobs } from './use-recent-jobs';

type ItemPrincipal = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge: number | null;
  ativo: boolean;
};

/**
 * Barra do analista, organizada por páginas.
 *
 * Ela já foi uma árvore Empresa → Vaga. Com mais de 2.500 empresas atendidas
 * e perto de 2.500 vagas por mês, a árvore não cabia e não se achava nada
 * nela. Ficaram quatro destinos fixos — Hoje, Vagas, Empresas, Pessoas —, as
 * cinco vagas em que a analista mexeu por último e a busca ⌘K para chegar em
 * qualquer uma das outras.
 *
 * Papéis (prancha 2): só o analista tem app. Empresa e candidato recebem
 * link, e essas telas ficam fora desta casca.
 */
export function AppSidebar() {
  const { state, persona } = useIelDemo();
  const pathname = usePathname();
  const iel = routes.dashboard.iel;

  const [busca, setBusca] = useState(false);
  const [comoFunciona, setComoFunciona] = useState(false);
  const [roteiro, setRoteiro] = useState(false);

  // ⌘K / Ctrl+K em qualquer tela da casca.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setBusca((aberta) => !aberta);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /*
   * A fila do dia percorre o ranking de cada vaga visível, e a barra fica
   * montada em todas as telas. Sem memória, abrir um diálogo recalcularia a
   * base inteira.
   */
  const pendencias = useMemo(() => montarPendencias(state).length, [state]);
  const vagas = useMemo(() => getVisibleJobs(state), [state]);
  const emSelecao = useMemo(
    () =>
      vagas.filter((job) => getJobListState(state, job) === 'em-selecao')
        .length,
    [vagas, state]
  );
  const primeiraVaga = vagas.find((job) => job.stage !== 'encerrada');

  /*
   * O gestor entra pela mesma casca, mas não faz o trabalho da analista:
   * importar planilha, varrer a fila do dia e navegar pela base de pessoas
   * são tarefas do IEL. Deixar esses destinos no menu dele seria oferecer
   * portas para o recorte de outras empresas (PRODUTO.md §5) — o único lugar
   * que faz sentido para ele é a própria empresa, e as recentes dele se
   * limitam às vagas dela.
   */
  const eGestor = persona.kind === 'gestor';
  const empresaDoGestor = persona.companyId;

  const principais: ItemPrincipal[] = eGestor
    ? [
        {
          href: empresaDoGestor
            ? iel.companies.byId(empresaDoGestor)
            : iel.companies.index,
          label: 'Minha empresa',
          icon: Building2,
          badge: null,
          ativo: pathname.startsWith(iel.companies.index)
        }
      ]
    : [
        {
          href: iel.index,
          label: 'Hoje',
          icon: Inbox,
          badge: pendencias > 0 ? pendencias : null,
          ativo: pathname === iel.index
        },
        {
          href: iel.jobs.index,
          label: 'Vagas',
          icon: Briefcase,
          badge: emSelecao > 0 ? emSelecao : null,
          ativo: pathname.startsWith(iel.jobs.index)
        },
        {
          href: iel.companies.index,
          label: 'Empresas',
          icon: Building2,
          badge: null,
          ativo: pathname.startsWith(iel.companies.index)
        },
        {
          href: iel.talents.index,
          label: 'Pessoas',
          icon: Users,
          badge: null,
          ativo: pathname.startsWith(iel.talents.index)
        },
        {
          href: iel.candidates,
          label: 'Candidatos',
          icon: MessageSquare,
          badge: null,
          ativo: pathname.startsWith(iel.candidates)
        },
        {
          href: iel.bi,
          label: 'BI',
          icon: ChartColumn,
          badge: null,
          ativo: pathname.startsWith(iel.bi)
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
                    aria-label="Buscar vaga, empresa ou pessoa"
                    aria-keyshortcuts="Meta+K Control+K"
                    aria-haspopup="dialog"
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
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={item.ativo}
                    // O kit marca o item ativo só com `data-active`; o
                    // leitor de tela precisa do `aria-current`.
                    aria-current={item.ativo ? 'page' : undefined}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge className="tabular-nums">
                      {item.badge}
                    </SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <NavRecentes vagas={vagas} />

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
              {/* Integrações é assunto do IEL: o gestor não vê. */}
              {eGestor ? null : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Integrações"
                    isActive={pathname === iel.dataSources}
                    aria-current={
                      pathname === iel.dataSources ? 'page' : undefined
                    }
                  >
                    <Link href={iel.dataSources}>
                      <Plug />
                      <span>Integrações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
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

/** Quantas vagas a barra sugere quando ainda não há recentes. */
const SUGESTOES_NA_BARRA = 3;

/**
 * As últimas vagas abertas, ou, na primeira visita, as que têm mais gente
 * passando do corte.
 *
 * Some com a barra recolhida: o nome da vaga é o conteúdo da linha, e um
 * ícone repetido cinco vezes não diria qual é qual.
 */
function NavRecentes({ vagas }: { vagas: Job[] }) {
  const { state } = useIelDemo();
  const pathname = usePathname();
  const iel = routes.dashboard.iel;
  const recentes = useRecentJobs();

  // O recorte da persona vale aqui também: o gestor só vê vagas da empresa.
  const visiveis = useMemo(() => {
    const porId = new Map(vagas.map((job) => [job.id, job]));
    return recentes
      .map((id) => porId.get(id))
      .filter((job): job is Job => Boolean(job))
      .slice(0, RECENTES_NA_BARRA);
  }, [recentes, vagas]);

  const semRecentes = visiveis.length === 0;

  // O ranking de cada vaga custa caro: só é calculado sem recentes.
  const sugestoes = useMemo(() => {
    if (!semRecentes) return [];
    return vagas
      .filter((job) => job.stage !== 'encerrada')
      .map((job) => ({ job, compativeis: getCompatibleCount(state, job.id) }))
      .sort((a, b) => b.compativeis - a.compativeis)
      .slice(0, SUGESTOES_NA_BARRA)
      .map((entrada) => entrada.job);
  }, [semRecentes, vagas, state]);

  const lista = semRecentes ? sugestoes : visiveis;
  if (lista.length === 0) return null;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>
        {semRecentes ? 'Sugestões' : 'Recentes'}
      </SidebarGroupLabel>
      <SidebarMenu>
        {lista.map((job) => {
          const href = iel.jobs.byId(job.id).index;
          const marcados = getReferralListSelection(state, job.id).length;
          const empresa = getCompany(job.companyId)?.name;
          return (
            <SidebarMenuItem key={job.id}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(href)}
                aria-current={pathname.startsWith(href) ? 'page' : undefined}
                title={empresa ? `${job.title} · ${empresa}` : job.title}
              >
                {/*
                 * O contador é o dado da linha e não pode encolher: a regra
                 * do bloco corta o último filho com reticências, e "0/5"
                 * virava "0..". Quem cede espaço é o nome da vaga.
                 */}
                <Link href={href}>
                  <span className="min-w-0 flex-1 truncate">{job.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {marcados}/{REFERRAL_LIMIT}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/** Quantos resultados cada grupo do ⌘K mostra. */
const RESULTADOS_POR_GRUPO = 8;

type Resultado = { id: string; titulo: string; detalhe: string; href: string };

/**
 * Filtra um índice já normalizado e devolve os primeiros resultados e o total.
 *
 * Quem começa com o termo vem antes de quem só o contém: "sinop" deve trazer
 * "Sinop Alimentos" antes de "Vale do Sinop".
 */
function filtrar(
  indice: { busca: string; resultado: Resultado }[],
  termo: string
): { itens: Resultado[]; total: number } {
  const noInicio: Resultado[] = [];
  const noMeio: Resultado[] = [];
  for (const entrada of indice) {
    const posicao = entrada.busca.indexOf(termo);
    if (posicao === 0) noInicio.push(entrada.resultado);
    else if (posicao > 0) noMeio.push(entrada.resultado);
  }
  const todos = noInicio.concat(noMeio);
  return {
    itens: todos.slice(0, RESULTADOS_POR_GRUPO),
    total: todos.length
  };
}

/**
 * Busca por vaga, empresa e pessoa — o jeito rápido de chegar a uma entre
 * milhares.
 *
 * O filtro é feito aqui, e não pelo `cmdk`: entregar 2.500 empresas ao
 * componente para ele esconder quase todas custaria cada tecla. Cada grupo
 * mostra no máximo oito resultados e diz quantos havia.
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
  const { state, persona } = useIelDemo();
  const router = useRouter();
  const iel = routes.dashboard.iel;
  const recentes = useRecentJobs();
  const [consulta, setConsulta] = useState('');

  // O índice só é montado com o diálogo aberto e só muda com o estado.
  const indice = useMemo(() => {
    if (!open) return null;

    const vagas = getVisibleJobs(state).map((job) => {
      const empresa = getCompany(job.companyId)?.name ?? '';
      return {
        busca: normalizarBusca(`${job.title} ${empresa}`),
        resultado: {
          id: job.id,
          titulo: job.title,
          detalhe: empresa,
          href: iel.jobs.byId(job.id).index
        }
      };
    });

    const empresas = getVisibleCompanies(state).map((company) => ({
      busca: normalizarBusca(company.name),
      resultado: {
        id: company.id,
        titulo: company.name,
        detalhe: company.location,
        href: iel.companies.byId(company.id)
      }
    }));

    const talentos =
      persona.kind === 'gestor'
        ? getVisibleTalentIds(state)
            .map((id) => getTalent(id, state))
            .filter((talent) => talent !== null)
        : [...ALL_TALENTS, ...(state.importedTalents ?? [])];
    const pessoas = talentos.map((talent) => ({
      busca: normalizarBusca(talent.name),
      resultado: {
        id: talent.id,
        titulo: talent.name,
        detalhe: talent.city,
        href: iel.talents.byId(talent.id).index
      }
    }));

    return { vagas, empresas, pessoas };
  }, [open, state, persona.kind, iel]);

  const termo = normalizarBusca(consulta);

  const grupos = useMemo(() => {
    if (!indice || !termo) return [];
    return [
      { titulo: 'Vagas', ...filtrar(indice.vagas, termo) },
      { titulo: 'Empresas', ...filtrar(indice.empresas, termo) },
      { titulo: 'Pessoas', ...filtrar(indice.pessoas, termo) }
    ].filter((grupo) => grupo.total > 0);
  }, [indice, termo]);

  // Sem nada digitado, o atalho mais provável é voltar a uma vaga recente.
  const vagasRecentes = useMemo(() => {
    if (!indice || termo) return [];
    const porId = new Map(
      indice.vagas.map((entrada) => [entrada.resultado.id, entrada.resultado])
    );
    return recentes
      .map((id) => porId.get(id))
      .filter((resultado): resultado is Resultado => Boolean(resultado))
      .slice(0, RECENTES_NA_BARRA);
  }, [indice, termo, recentes]);

  const mudarAbertura = (aberta: boolean) => {
    if (!aberta) setConsulta('');
    onOpenChange(aberta);
  };

  const ir = (href: string) => {
    mudarAbertura(false);
    router.push(href);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={mudarAbertura}
    >
      <DialogContent
        className="overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* Título e descrição dentro do conteúdo: é ali que o Radix os liga
            ao diálogo (`aria-labelledby`/`aria-describedby`). */}
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar</DialogTitle>
          <DialogDescription>
            Digite o nome de uma vaga, empresa ou pessoa e use as setas para
            escolher um resultado. Esc fecha.
          </DialogDescription>
        </DialogHeader>
        <Command
          label="Buscar vaga, empresa ou pessoa"
          shouldFilter={false}
          className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5"
        >
          <CommandInput
            placeholder="Buscar vaga, empresa ou pessoa…"
            value={consulta}
            onValueChange={setConsulta}
          />
          <CommandList>
            <CommandEmpty>
              {termo
                ? 'Nada encontrado com esse nome.'
                : 'Digite o nome de uma vaga, empresa ou pessoa.'}
            </CommandEmpty>
            {vagasRecentes.length > 0 ? (
              <CommandGroup heading="Vagas recentes">
                {vagasRecentes.map((resultado) => (
                  <LinhaDeResultado
                    key={resultado.id}
                    resultado={resultado}
                    onSelect={ir}
                  />
                ))}
              </CommandGroup>
            ) : null}
            {grupos.map((grupo) => (
              <CommandGroup
                key={grupo.titulo}
                heading={
                  grupo.total > grupo.itens.length
                    ? `${grupo.titulo} · ${grupo.itens.length} de ${grupo.total}`
                    : grupo.titulo
                }
              >
                {grupo.itens.map((resultado) => (
                  <LinhaDeResultado
                    key={resultado.id}
                    resultado={resultado}
                    onSelect={ir}
                  />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function LinhaDeResultado({
  resultado,
  onSelect
}: {
  resultado: Resultado;
  onSelect: (href: string) => void;
}) {
  return (
    <CommandItem
      value={resultado.id}
      onSelect={() => onSelect(resultado.href)}
    >
      <span className="min-w-0 flex-1 truncate">{resultado.titulo}</span>
      {resultado.detalhe ? (
        <span className="shrink-0 truncate text-xs text-muted-foreground">
          {resultado.detalhe}
        </span>
      ) : null}
    </CommandItem>
  );
}
