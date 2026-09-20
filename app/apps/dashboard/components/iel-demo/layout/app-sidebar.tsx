'use client';

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStatusIntegracoes } from '@/features/iel-demo/analysis/analytics';
import { ALL_TALENTS } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getAcompanhamento,
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
  IconBriefcase,
  IconBuildingSkyscraper,
  IconChartBar,
  IconClipboardList,
  IconHeartHandshake,
  IconHelpCircle,
  IconHome,
  IconListCheck,
  IconListDetails,
  IconPlug,
  IconSearch,
  IconUsers
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
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
import { Kbd } from '@workspace/ui/shadcn/kbd';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator
} from '@workspace/ui/shadcn/sidebar';

import { pedeLigacaoHoje } from '../acompanhamento/leitura';
import { normalizarBusca } from '../jobs/busca';
import { ITEM_ATIVO, PREENCHIMENTO_DE_ESTADO } from '../metricas/cores';
import { montarPendencias } from '../overview/pendencias';
import { ComoFuncionaDialog } from './demo-dialogs';
import { NavUser } from './nav-user';
import { RECENTES_NA_BARRA, useRecentJobs } from './use-recent-jobs';

type ItemPrincipal = {
  href: string;
  label: string;
  icon: TablerIcon;
  badge: number | null;
  ativo: boolean;
};

type Secao = { titulo: string; itens: ItemPrincipal[] };

/**
 * Título de seção da barra: pequeno, discreto e igual em todas. Em tela baixa
 * (800px), título e seção ficam mais justos para a barra caber sem rolagem.
 */
const ROTULO_DA_SECAO =
  'text-xs font-medium text-muted-foreground [@media(max-height:860px)]:h-6';
const SECAO = '[@media(max-height:860px)]:py-1';

/**
 * O contador do destino aberto, sobre o azul-noite da barra: pastilha laranja
 * cheia com o texto em azul, e não o inverso — laranja com texto branco não
 * passa contraste em texto pequeno.
 *
 * O `!` é necessário porque o kit repinta o selo de branco quando o item
 * está ativo (`peer-data-[active=true]`), e é justamente no ativo que a
 * pastilha aparece: sem o `!` o número sumiria.
 */
const SELO_DO_ATIVO =
  'bg-[hsl(var(--brand-accent))] text-[hsl(var(--sidebar))]!';

/** Linha fina entre as seções, só com a barra recolhida (sem os títulos). */
function SeparadorRecolhido({ className }: { className?: string }) {
  return (
    <SidebarSeparator
      className={cn('hidden group-data-[collapsible=icon]:block', className)}
    />
  );
}

/** Um destino da barra, com `aria-current` e o contador quando houver. */
function ItemDaBarra({
  item,
  selo
}: {
  item: ItemPrincipal;
  /** Substitui o contador: o status da sincronização em Integrações. */
  selo?: ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.label}
        isActive={item.ativo}
        // O kit marca o item ativo só com `data-active`; o leitor de tela
        // precisa do `aria-current`.
        aria-current={item.ativo ? 'page' : undefined}
        className={ITEM_ATIVO}
      >
        <Link href={item.href}>
          <item.icon />
          <span>{item.label}</span>
        </Link>
      </SidebarMenuButton>
      {selo ??
        (item.badge ? (
          <SidebarMenuBadge
            className={cn('tabular-nums', item.ativo && SELO_DO_ATIVO)}
          >
            {item.badge}
          </SidebarMenuBadge>
        ) : null)}
    </SidebarMenuItem>
  );
}

/**
 * Barra do analista, organizada por páginas.
 *
 * Ela já foi uma árvore Empresa → Vaga. Com mais de 2.500 empresas atendidas
 * e perto de 2.500 vagas por mês, a árvore não cabia e não se achava nada
 * nela. Ficaram destinos fixos em seções com título — Seleção, Talentos,
 * Análise —, as últimas vagas em que a analista mexeu, a seção Sistema no pé
 * e a busca ⌘K para chegar em qualquer outra coisa.
 *
 * Papéis (prancha 2): só o analista tem app. Empresa e candidato recebem
 * link, e essas telas ficam fora desta casca.
 */
export function AppSidebar({ ehEquipe }: { ehEquipe: boolean }) {
  const { state, persona } = useIelDemo();
  const pathname = usePathname();
  const iel = routes.dashboard.iel;

  const [busca, setBusca] = useState(false);
  const [comoFunciona, setComoFunciona] = useState(false);

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
  /*
   * O contador de Acompanhamento é o mesmo "para ligar hoje" da tela: quem
   * chegou a um marco, recebeu a pergunta e não respondeu. O seletor já é
   * memorizado por identidade do estado.
   */
  const paraLigarHoje = useMemo(
    () => getAcompanhamento(state).filter(pedeLigacaoHoje).length,
    [state]
  );

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

  const item = (
    href: string,
    label: string,
    icon: TablerIcon,
    ativo: boolean,
    badge: number | null = null
  ): ItemPrincipal => ({ href, label, icon, badge, ativo });

  /*
   * A barra em seções com título, no padrão do `sidebar-07`: o que é da
   * seleção do dia, o que é do banco de talentos e o que é análise. Seção
   * vazia (a do gestor, por exemplo) não aparece.
   */
  const secoes: Secao[] = eGestor
    ? [
        {
          titulo: 'Seleção',
          itens: [
            item(
              empresaDoGestor
                ? iel.companies.byId(empresaDoGestor)
                : iel.companies.index,
              'Minha empresa',
              IconBuildingSkyscraper,
              pathname.startsWith(iel.companies.index)
            )
          ]
        }
      ]
    : [
        {
          titulo: 'Seleção',
          itens: [
            item(
              iel.index,
              'Início',
              IconHome,
              pathname === iel.index,
              pendencias > 0 ? pendencias : null
            ),
            item(
              iel.jobs.index,
              'Vagas',
              IconBriefcase,
              pathname.startsWith(iel.jobs.index),
              emSelecao > 0 ? emSelecao : null
            ),
            /*
             * "Análise de aderência" saiu daqui em 19/09: a leitura por vaga
             * repetia a mesa de seleção, e a mesma conta virou aba da pessoa,
             * no perfil dela. O menu não guarda mais um destino para ela.
             */
            item(
              iel.companies.index,
              'Empresas',
              IconBuildingSkyscraper,
              pathname.startsWith(iel.companies.index)
            ),
            /*
             * A segunda metade do ciclo: depois do "contratei", quem ligar
             * hoje para saber se a pessoa ficou — sem depender do RH.
             */
            item(
              iel.followUp.index,
              'Acompanhamento',
              IconHeartHandshake,
              pathname.startsWith(iel.followUp.index),
              paraLigarHoje > 0 ? paraLigarHoje : null
            )
          ]
        },
        /*
         * O banco de talentos e os questionários reúnem a base de pessoas do
         * IEL, então ficam fora do menu do gestor: seriam porta para o
         * recorte de outras empresas (PRODUTO.md §5).
         *
         * "Mapa de cultura" saiu daqui na mesma data: ele é a leitura de
         * encaixe de *uma* cultura contra a base, e passou a ser aba da
         * empresa, que é de onde a cultura vem.
         */
        {
          titulo: 'Talentos',
          itens: [
            item(
              iel.talents.index,
              'Banco de talentos',
              IconUsers,
              pathname.startsWith(iel.talents.index)
            ),
            item(
              iel.candidates,
              'Questionários',
              IconClipboardList,
              pathname.startsWith(iel.candidates)
            )
          ]
        },
        {
          titulo: 'Análise',
          itens: [item(iel.bi, 'BI', IconChartBar, pathname.startsWith(iel.bi))]
        }
      ];

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
    >
      <SidebarHeader>
        {/*
         * A marca, e só. Era um botão com a seta de dois sentidos do block,
         * que no shadcn abre o seletor de conta — aqui não abria nada, e o
         * hover prometia um menu inexistente. Início já está no primeiro
         * item da barra, logo abaixo.
         *
         * Recolhida, a barra tem 32px de largura: o símbolo carrega a
         * própria medida, quadrada, para a ligadura não virar um oval.
         */}
        <div className="flex h-12 items-center gap-2 px-1 group-data-[collapsible=icon]:px-0">
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
        </div>
        {/*
         * A busca é o atalho principal: com milhares de vagas, empresas e
         * pessoas, chegar pelo nome é mais rápido que navegar. A importação
         * deixou de ser ação da barra: o Empregare sincroniza sozinho todo
         * dia às 06:00, e a planilha virou plano B (no menu da vaga e em
         * Integrações).
         */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              onClick={() => setBusca(true)}
              aria-label="Buscar vaga, empresa ou pessoa"
              aria-keyshortcuts="Meta+K Control+K"
              aria-haspopup="dialog"
              tooltip="Buscar (⌘K)"
              className="text-muted-foreground"
            >
              <IconSearch />
              <span className="flex-1 truncate text-xs">
                Vaga, empresa, pessoa…
              </span>
              <Kbd className="ml-auto group-data-[collapsible=icon]:hidden">
                ⌘K
              </Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/*
       * Sem o `gap` do kit entre os grupos: o respiro vem do `p-2` de cada
       * seção, igual entre todas. Recolhida, os títulos somem e um separador
       * fino marca onde uma seção acaba.
       */}
      <SidebarContent className="gap-0">
        {secoes.map((secao, indice) => (
          <Fragment key={secao.titulo}>
            {indice > 0 ? <SeparadorRecolhido /> : null}
            <SidebarGroup className={SECAO}>
              <SidebarGroupLabel className={ROTULO_DA_SECAO}>
                {secao.titulo}
              </SidebarGroupLabel>
              <SidebarMenu>
                {secao.itens.map((entrada) => (
                  <ItemDaBarra
                    key={entrada.label}
                    item={entrada}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </Fragment>
        ))}

        <NavRecentes vagas={vagas} />

        {/* Sistema fica no pé da barra, logo acima de quem está usando. */}
        <div className="mt-auto flex flex-col">
          <SeparadorRecolhido />
          <SidebarGroup className={SECAO}>
            <SidebarGroupLabel className={ROTULO_DA_SECAO}>
              Sistema
            </SidebarGroupLabel>
            <SidebarMenu>
              {/*
               * Instrumento e Integrações são assunto do IEL: o gestor não
               * vê. O instrumento vem antes porque é conteúdo do produto
               * (as frases), e Integrações é encanamento.
               */}
              {eGestor ? null : (
                <ItemDaBarra
                  item={item(
                    iel.instrument.index,
                    'Instrumento',
                    IconListCheck,
                    pathname.startsWith(iel.instrument.index)
                  )}
                />
              )}
              {/*
               * Temas vem logo depois do Instrumento: é a mesma matéria, lida
               * em vez de ajustada. Quem só quer saber o que se pergunta não
               * precisa entrar na tela que liga e desliga frase.
               */}
              {eGestor ? null : (
                <ItemDaBarra
                  item={item(
                    iel.themes.index,
                    'Temas',
                    IconListDetails,
                    pathname.startsWith(iel.themes.index)
                  )}
                />
              )}
              {eGestor ? null : (
                <ItemDaBarra
                  item={item(
                    iel.dataSources,
                    'Integrações',
                    IconPlug,
                    pathname === iel.dataSources
                  )}
                  selo={<SeloDaSincronizacao />}
                />
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setComoFunciona(true)}
                  tooltip="Como funciona"
                >
                  <IconHelpCircle />
                  <span>Como funciona</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </div>
      </SidebarContent>

      <SidebarFooter>
        <NavUser ehEquipe={ehEquipe} />
      </SidebarFooter>

      <BuscaGlobal
        open={busca}
        onOpenChange={setBusca}
      />
      <ComoFuncionaDialog
        open={comoFunciona}
        onOpenChange={setComoFunciona}
      />
    </Sidebar>
  );
}

/**
 * O selo que diz que o dado chega sozinho, no item Integrações: um ponto
 * verde e a hora da última sincronização do Empregare ("● 06:00"). Se a
 * última execução deixou aviso, o ponto fica laranja. A frase inteira vai
 * para o leitor de tela e para a dica do mouse. Recolhida, a barra esconde o
 * selo junto com os outros contadores.
 */
function SeloDaSincronizacao() {
  const empregare = getStatusIntegracoes().find(
    (integracao) => integracao.id === 'empregare'
  );
  if (!empregare) return null;

  const quando = empregare.detalhe.replace(/^Sincronizado · /, '');
  const atencao = empregare.estado === 'atencao';
  const hora = quando.replace(/^hoje /, '');
  const texto = atencao
    ? `Empregare · sincronização de ${quando} com aviso`
    : `Empregare sincronizado · ${hora}`;

  return (
    <SidebarMenuBadge
      title={texto}
      className="gap-1.5 font-normal text-muted-foreground tabular-nums"
    >
      <span
        aria-hidden="true"
        className={cn(
          'size-2 shrink-0 rounded-full',
          atencao
            ? PREENCHIMENTO_DE_ESTADO.atencao
            : PREENCHIMENTO_DE_ESTADO.combina
        )}
      />
      <span aria-hidden="true">{hora}</span>
      <span className="sr-only">{texto}</span>
    </SidebarMenuBadge>
  );
}

/** Quantas vagas a barra sugere quando ainda não há recentes. */
const SUGESTOES_NA_BARRA = 3;

/**
 * Quantas recentes a barra mostra. Com as seções e o pé, cinco não cabiam sem
 * rolagem numa tela de 800px de altura; as outras continuam no ⌘K.
 */
const RECENTES_VISIVEIS = 3;

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
      .slice(0, RECENTES_VISIVEIS);
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
    <SidebarGroup className={cn(SECAO, 'group-data-[collapsible=icon]:hidden')}>
      <SidebarGroupLabel className={ROTULO_DA_SECAO}>
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
                className={ITEM_ATIVO}
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
