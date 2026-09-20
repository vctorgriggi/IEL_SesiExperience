'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  contextoDaRota,
  ehTelaPorLink,
  MindSheet
} from '@/components/iel-demo/chat/mind-sheet';
import {
  formatAdherence,
  type AdherenceResult
} from '@/features/iel-demo/analysis/adherence';
import {
  calcularPosicaoCultural,
  classificarCultura,
  faixaDeAderencia,
  temBaseParaRanquear
} from '@/features/iel-demo/analysis/mapa-cultural';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByJob,
  getCompany,
  getCompanyCultureAnswers,
  getCultureFit,
  getCultureMapPoints,
  getJobsByCompany,
  type CultureMapPoint
} from '@/features/iel-demo/state/selectors';
import {
  IconAlertTriangle,
  IconBuildingSkyscraper,
  IconCheck,
  IconHourglass,
  IconInbox,
  IconMap,
  IconMessageCircleQuestion,
  IconPhone,
  IconPlus,
  IconSelector,
  IconSend,
  IconUserSearch,
  type TablerIcon
} from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Button } from '@workspace/ui/shadcn/button';
import { Checkbox } from '@workspace/ui/shadcn/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@workspace/ui/shadcn/command';
import { ScrollArea } from '@workspace/ui/shadcn/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@workspace/ui/shadcn/sheet';

import { normalizarBusca } from '../jobs/busca';
import {
  EncaminharPessoa,
  EncaminharSelecionados
} from '../mapa-cultural/encaminhar-pessoa';
import { FaixaBadge } from '../mapa-cultural/faixa-badge';
import {
  COR_DA_EMPRESA,
  COR_DO_TALENTO,
  PlanoCultural
} from '../mapa-cultural/plano-cultural';
import {
  barraDaAderencia,
  ICONE_NO_TOM,
  TEXTO_DE_ESTADO,
  textoDaAderencia,
  TRILHO
} from '../metricas/cores';
import {
  montarPendencias,
  TIPO_DE_PENDENCIA_LABEL,
  type NivelDePrioridade,
  type Pendencia,
  type TipoDePendencia
} from '../overview/pendencias';

/**
 * O botão do canto, que era só o Mind, agora abre um leque.
 *
 * A pílula "Pergunte ao Mind" ocupava 180px fixos sobre o conteúdo de toda
 * tela para oferecer *uma* porta. O leque troca isso por um botão redondo de
 * 48px que guarda quatro: perguntar ao Mind, a fila do dia, a análise de
 * cultura de um par (uma pessoa contra uma empresa) e o mapa de cultura de
 * uma empresa (ela contra a base inteira). É a mesma economia do menu
 * recolhido da barra lateral — a porta não some, só para de disputar a dobra
 * com o que a analista veio ler.
 *
 * As quatro abrem aba lateral e resolvem ali: nenhuma tira a analista da tela
 * em que ela está, e sair é escolha dela, no verbo.
 */

/** Um ícone por tipo de pendência, no mesmo tom da fila do Início. */
const ICONE_DO_TIPO: Record<
  TipoDePendencia,
  { Icone: TablerIcon; tom: string }
> = {
  respostas: { Icone: IconInbox, tom: ICONE_NO_TOM.pessoa },
  perguntas: { Icone: IconMessageCircleQuestion, tom: ICONE_NO_TOM.atencao },
  ligacao: { Icone: IconPhone, tom: ICONE_NO_TOM.pessoa },
  envio: { Icone: IconSend, tom: ICONE_NO_TOM.combina },
  questionario: { Icone: IconHourglass, tom: ICONE_NO_TOM.neutro },
  cultura: { Icone: IconBuildingSkyscraper, tom: ICONE_NO_TOM.empresa }
};

const PONTO_DA_PRIORIDADE: Record<NivelDePrioridade, string> = {
  alta: 'bg-rose-500',
  media: 'bg-amber-500',
  normal: 'bg-muted-foreground/60'
};

const ROTULO_DA_PRIORIDADE: Record<NivelDePrioridade, string> = {
  alta: 'Alta',
  media: 'Média',
  normal: 'Normal'
};

/** Cor do prazo: atraso é vermelho, alerta é âmbar, o resto é apoio. */
function classeDoPrazo(status: Pendencia['statusPrazo']): string {
  if (status === 'atrasado') return 'text-rose-700 dark:text-rose-400';
  if (status === 'urgente') return 'text-amber-700 dark:text-amber-400';
  return 'text-muted-foreground/70';
}

type Painel = 'nenhum' | 'mind' | 'fila' | 'cultura' | 'mapa';

/**
 * O leque do canto inferior direito. Monte uma vez na casca da analista.
 *
 * Em tela por link ele não aparece: candidato e empresa não têm assistente
 * nem fila, e a mesma checagem do Mind vale para o leque inteiro.
 */
export function AcoesRapidas() {
  const pathname = usePathname();
  const { state, persona } = useIelDemo();
  const [aberto, setAberto] = useState(false);
  const [painel, setPainel] = useState<Painel>('nenhum');
  const raizRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  const pendencias = useMemo(() => montarPendencias(state), [state]);

  /*
   * O leque é um menu de canto, não um diálogo: não prende o foco nem tranca
   * a página. Então ele mesmo precisa fechar quando a atenção sai — Esc, um
   * clique fora ou o foco indo para outro lugar. Sem isso ele fica aberto
   * sobre o conteúdo depois que a analista já foi ler outra coisa.
   */
  useEffect(() => {
    if (!aberto) return;

    const fechar = () => {
      setAberto(false);
      fabRef.current?.focus();
    };

    const naTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') fechar();
    };
    const noPonteiro = (evento: PointerEvent) => {
      const alvo = evento.target;
      if (alvo instanceof Node && raizRef.current?.contains(alvo)) return;
      // Clique fora fecha, mas não devolve o foco: quem clicou já escolheu
      // para onde estava indo.
      setAberto(false);
    };

    document.addEventListener('keydown', naTecla);
    document.addEventListener('pointerdown', noPonteiro);
    return () => {
      document.removeEventListener('keydown', naTecla);
      document.removeEventListener('pointerdown', noPonteiro);
    };
  }, [aberto]);

  // Navegar fecha o leque: a ação escolhida já levou para outra tela.
  useEffect(() => setAberto(false), [pathname]);

  if (ehTelaPorLink(pathname)) return null;

  /*
   * O gestor entra pela mesma casca, mas a fila é do trabalho do IEL e as
   * duas leituras de cultura varrem a base inteira — seriam porta para o
   * recorte de outras empresas (PRODUTO.md §5). Sobra uma porta só, e um
   * leque de um item é um botão com passo a mais: para ele o canto volta a
   * ser o botão do Mind.
   */
  const eGestor = persona.kind === 'gestor';
  const contexto = contextoDaRota(pathname);

  const acoes: {
    id: string;
    rotulo: string;
    Icone: TablerIcon | null;
    badge: number | null;
    /** Ou abre um painel aqui mesmo, ou leva para uma tela. */
    aoEscolher?: () => void;
    href?: string;
  }[] = eGestor
    ? []
    : [
        {
          id: 'fila',
          rotulo: 'Precisa de você hoje',
          Icone: IconInbox,
          badge: pendencias.length > 0 ? pendencias.length : null,
          aoEscolher: () => setPainel('fila')
        },
        /*
         * As duas leituras de cultura moram dentro de um cadastro — a da
         * pessoa é aba do perfil dela, a da empresa é aba da empresa —, e
         * chegar em qualquer uma custa três passos: abrir a lista, achar o
         * nome, abrir a aba. Aqui cabem em um, de qualquer tela: a analista
         * está ao telefone com a empresa e precisa de "onde esta pessoa se
         * encaixa" ou "quem cabe aqui" agora.
         *
         * São as duas únicas do leque que pedem um alvo, e por isso o painel
         * começa pela busca em vez de um seletor no botão: o botão do canto
         * não pode prometer uma leitura que ainda não tem de quem.
         */
        {
          id: 'cultura',
          rotulo: 'Análise de cultura',
          Icone: IconUserSearch,
          badge: null,
          aoEscolher: () => setPainel('cultura')
        },
        {
          id: 'mapa',
          rotulo: 'Mapa de cultura',
          Icone: IconMap,
          badge: null,
          aoEscolher: () => setPainel('mapa')
        }
      ];

  const abrirMind = () => {
    setAberto(false);
    setPainel('mind');
  };

  return (
    <>
      {/*
       * O recuo maior no celular é o VLibras, não estética: o widget do
       * governo desenha o próprio botão num shadow DOM `fixed` com o mesmo
       * `z-40`, e no telefone ele estaciona no canto de baixo à direita —
       * medido em 390px, ele ocupa 338,728 num quadrado de 40px, bem em cima
       * de onde este botão cairia. Empatados no z, o VLibras vence por vir
       * depois no documento, e o leque ficaria inclicável. Então o canto
       * direito é dele no telefone e este botão se acomoda ao lado. Do `sm`
       * para cima o VLibras sobe para o meio da lateral e o recuo volta ao
       * normal.
       */}
      <div
        ref={raizRef}
        className="fixed right-20 bottom-4 z-40 flex flex-col items-end gap-2 sm:right-6"
      >
        {/*
         * As ações saem de baixo para cima, e a lista é escrita na ordem
         * visual: a primeira do leque é a que fica mais perto do polegar. O
         * rótulo fica sempre visível quando aberto — um leque de ícones mudos
         * obriga a abrir para descobrir, e o público do produto tem baixo
         * letramento digital (R10).
         */}
        {aberto && !eGestor ? (
          <ul className="flex flex-col items-end gap-2">
            {acoes.map(({ id, rotulo, Icone, badge, aoEscolher, href }) => {
              const conteudo = (
                <>
                  <span>{rotulo}</span>
                  {badge !== null ? (
                    <span className="rounded-full bg-primary/10 px-1.5 text-xs font-semibold tabular-nums text-primary">
                      {badge}
                    </span>
                  ) : null}
                  {Icone ? <Icone aria-hidden="true" /> : null}
                </>
              );
              const classe =
                'shadow-xs motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1';

              return (
                <li key={id}>
                  {href ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className={classe}
                    >
                      <Link href={href}>{conteudo}</Link>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={classe}
                      onClick={() => {
                        setAberto(false);
                        aoEscolher?.();
                      }}
                    >
                      {conteudo}
                    </Button>
                  )}
                </li>
              );
            })}
            {/*
             * O Mind é o último da lista e o mais perto do botão: era ele
             * que ocupava o canto antes, e é a porta mais usada.
             */}
            <li>
              <Button
                type="button"
                size="sm"
                className="shadow-xs motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
                onClick={abrirMind}
                aria-haspopup="dialog"
              >
                Pergunte ao Mind
                <Image
                  src="/marca/simbolo.png"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 rounded-sm bg-background p-px"
                />
              </Button>
            </li>
          </ul>
        ) : null}

        <Button
          ref={fabRef}
          type="button"
          size="icon-lg"
          className="relative size-12 rounded-full shadow-lg"
          data-tour="acoes-rapidas"
          onClick={() => {
            if (eGestor) {
              setPainel('mind');
              return;
            }
            setAberto((atual) => !atual);
          }}
          aria-haspopup={eGestor ? 'dialog' : 'menu'}
          aria-expanded={eGestor ? undefined : aberto}
          aria-label={
            eGestor
              ? 'Pergunte ao Mind'
              : aberto
                ? 'Fechar ações rápidas'
                : 'Ações rápidas: Mind, fila do dia e importação'
          }
        >
          {aberto ? (
            // A mesma cruz girada: fechar é o gesto de desfazer o abrir, e o
            // giro conta isso sem trocar o desenho do botão.
            <IconPlus
              aria-hidden="true"
              className="rotate-45 transition-transform"
            />
          ) : (
            <Image
              src="/marca/simbolo.png"
              alt=""
              width={24}
              height={24}
              className="size-6 rounded-sm bg-background p-px"
            />
          )}
          {!aberto && pendencias.length > 0 && !eGestor ? (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] leading-none font-semibold tabular-nums text-white ring-2 ring-background"
            >
              {pendencias.length > 9 ? '9+' : pendencias.length}
            </span>
          ) : null}
        </Button>
      </div>

      <MindSheet
        contexto={contexto}
        open={painel === 'mind'}
        onOpenChange={(open) => setPainel(open ? 'mind' : 'nenhum')}
      />
      <FilaSheet
        pendencias={pendencias}
        open={painel === 'fila'}
        onOpenChange={(open) => setPainel(open ? 'fila' : 'nenhum')}
      />
      <CulturaSheet
        open={painel === 'cultura'}
        onOpenChange={(open) => setPainel(open ? 'cultura' : 'nenhum')}
      />
      <MapaSheet
        open={painel === 'mapa'}
        onOpenChange={(open) => setPainel(open ? 'mapa' : 'nenhum')}
      />
    </>
  );
}

/** Quantos nomes a busca mostra antes de pedir mais letras. */
const RESULTADOS_NA_BUSCA = 8;

/** Quantas linhas o ranking curto mostra antes do "ver tudo". */
const LINHAS_NO_RESUMO = 5;

type Alvo = { id: string; nome: string };

type Encaixe = {
  /** A outra ponta da medida: a empresa, ou a pessoa. */
  id: string;
  nome: string;
  detalhe: string;
  aderencia: AdherenceResult;
  temBase: boolean;
};

/**
 * A mesma ordem do perfil, nas duas direções.
 *
 * Quem tem base para ser ranqueado vem antes de quem não tem, e só depois o
 * percentual. Sem esse piso, uma ponta que respondeu dois temas apareceria na
 * frente de uma que respondeu doze só por ter tirado 100% nos dois.
 */
function ordenarEncaixes(lista: Encaixe[]): Encaixe[] {
  return [...lista].sort((a, b) => {
    if (a.temBase !== b.temBase) return a.temBase ? -1 : 1;
    const totalA = a.aderencia.total ?? -1;
    const totalB = b.aderencia.total ?? -1;
    if (totalA !== totalB) return totalB - totalA;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

/** Uma linha da lista de um seletor. */
type Opcao = { id: string; nome: string; detalhe: string; busca: string };

/**
 * O seletor de alvo das abas de cultura: um nome escrito, que abre uma busca.
 *
 * Antes eram dois passos em branco — a aba abria numa caixa de busca vazia e
 * não dizia nada até alguém digitar. Agora ela abre já medindo um par, e
 * trocar qualquer um dos lados é um clique no próprio nome.
 *
 * O filtro é feito aqui, e não pelo `cmdk` (`shouldFilter={false}`), pelo
 * mesmo motivo da busca global: entregar 2.500 empresas ao componente para
 * ele esconder quase todas custaria cada tecla. A lista mostra no máximo oito
 * e diz quantas havia.
 */
function SeletorDeAlvo({
  rotulo,
  alvo,
  opcoes,
  dica,
  vazio,
  aoEscolher,
  className
}: {
  /** O que este lado é, para quem usa leitor de tela: "Pessoa", "Empresa". */
  rotulo: string;
  alvo: Alvo;
  opcoes: Opcao[];
  dica: string;
  vazio: string;
  aoEscolher: (alvo: Alvo) => void;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [consulta, setConsulta] = useState('');
  const termo = normalizarBusca(consulta);

  const achados = useMemo(() => {
    const todos = termo
      ? opcoes.filter((opcao) => opcao.busca.includes(termo))
      : opcoes;
    return { itens: todos.slice(0, RESULTADOS_NA_BUSCA), total: todos.length };
  }, [opcoes, termo]);

  // Fechar limpa a busca: reabrir no meio do que se digitou antes esconderia
  // a lista inteira sem dizer por quê.
  const fechar = () => {
    setAberto(false);
    setConsulta('');
  };

  if (!aberto) {
    return (
      <button
        type="button"
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
          className
        )}
        onClick={() => setAberto(true)}
        aria-label={`${rotulo}: ${alvo.nome}. Trocar`}
      >
        <span className="min-w-0 flex-1 truncate">{alvo.nome}</span>
        <IconSelector
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </button>
    );
  }

  return (
    <Command
      label={dica}
      shouldFilter={false}
      className="rounded-md border bg-popover"
    >
      <CommandInput
        placeholder={dica}
        value={consulta}
        onValueChange={setConsulta}
        autoFocus
        onKeyDown={(evento) => {
          // Esc fecha só o seletor. Sem isto ele sobe para o `Sheet` e a aba
          // inteira fecha junto, levando embora o par que já estava montado.
          if (evento.key === 'Escape') {
            evento.preventDefault();
            evento.stopPropagation();
            fechar();
          }
        }}
      />
      <CommandList className="max-h-56">
        <CommandEmpty>{vazio}</CommandEmpty>
        <CommandGroup
          heading={
            achados.total > achados.itens.length
              ? `${rotulo} · ${achados.itens.length} de ${achados.total}`
              : rotulo
          }
        >
          {achados.itens.map((opcao) => (
            <CommandItem
              key={opcao.id}
              value={opcao.id}
              onSelect={() => {
                aoEscolher({ id: opcao.id, nome: opcao.nome });
                fechar();
              }}
            >
              <IconCheck
                aria-hidden="true"
                className={cn(
                  'size-4 shrink-0',
                  opcao.id === alvo.id ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{opcao.nome}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {opcao.detalhe}
                </span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

/** O ranking curto, igual nas duas direções: nome, barra, faixa. */
function RankingDeEncaixes({
  encaixes,
  vazio,
  antes,
  rodape,
  selecionados,
  aoAlternar
}: {
  encaixes: Encaixe[];
  vazio: string | null;
  /** O que vem antes da lista, dentro da rolagem — o mapa, quando há um. */
  antes?: ReactNode;
  rodape: ReactNode;
  /** Quem está marcado para envio em lote; ausente, a lista não seleciona. */
  selecionados?: Set<string>;
  aoAlternar?: (id: string) => void;
}) {
  // Quem é o alvo já está escrito no seletor, logo acima da rolagem: repetir
  // o nome aqui seria o mesmo dado duas vezes na mesma dobra.
  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        {/* O mapa vem antes da lista e fica mesmo quando a lista não tem o
            que mostrar: ele é a leitura, a lista é o recorte dela. */}
        {antes}
        {vazio !== null ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {vazio}
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {encaixes.map(({ id, nome, detalhe, aderencia, temBase }) => {
              const total = aderencia.total;
              const marcado = selecionados?.has(id) ?? false;
              return (
                <li
                  key={id}
                  className="flex flex-col gap-2 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* A caixa vem antes do nome: é o que se toca para
                        montar a remessa sem abrir pessoa por pessoa. */}
                    {aoAlternar ? (
                      <Checkbox
                        checked={marcado}
                        onCheckedChange={() => aoAlternar(id)}
                        aria-label={`Selecionar ${nome} para envio`}
                        className="mt-0.5"
                      />
                    ) : null}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium">
                        {nome}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {detalhe}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        textoDaAderencia(total)
                      )}
                    >
                      {formatAdherence(total)}
                    </span>
                  </div>

                  {/* A barra é leitura de apoio: o número e a faixa já dizem
                      tudo, e por isso ela não carrega rótulo próprio. */}
                  <div
                    aria-hidden="true"
                    className={cn('h-1.5 w-full rounded-full', TRILHO.trilha)}
                  >
                    <div
                      className={cn(
                        'h-full rounded-full',
                        barraDaAderencia(total)
                      )}
                      style={{ width: `${total ?? 0}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {total !== null ? (
                      <FaixaBadge faixa={faixaDeAderencia(total)} />
                    ) : null}
                    {!temBase ? (
                      <span className="text-xs text-muted-foreground">
                        Poucos temas respondidos para ranquear
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      <div className="border-t p-3">{rodape}</div>
    </>
  );
}

/**
 * Monta a lista de um seletor a partir dos pontos do mapa.
 *
 * Os índices de `getCultureMapPoints` já trazem só quem tem posição — quem
 * respondeu o questionário, do lado das pessoas; quem fechou o perfil, do
 * lado das empresas. É exatamente o recorte que o seletor deve oferecer:
 * escolher alguém sem posição abriria a aba num aviso de que não há o que
 * medir, e o seletor teria mandado a pessoa para um beco.
 */
function opcoesDosPontos(pontos: CultureMapPoint[]): Opcao[] {
  return pontos.map((ponto) => ({
    id: ponto.id,
    nome: ponto.name,
    detalhe: ponto.detail,
    busca: normalizarBusca(ponto.name)
  }));
}

/** A primeira opção da lista, para a aba abrir já medindo alguma coisa. */
function primeiraOpcao(opcoes: Opcao[]): Alvo | null {
  const primeira = opcoes[0];
  return primeira ? { id: primeira.id, nome: primeira.nome } : null;
}

/**
 * A análise de cultura de um par: uma pessoa e uma empresa.
 *
 * É a leitura individual — não um ranking. A aba abre já com um par
 * escolhido e mede as duas coisas que a conversa com a empresa pede: o
 * número (a aderência, pela mesma `getCultureFit` do perfil) e o desenho (os
 * dois pontos no plano cultural, com a linha entre eles).
 *
 * Abrir já medindo é decisão, não conveniência: a versão anterior abria em
 * dois passos de busca vazios e não dizia nada até alguém digitar duas
 * vezes. Quem chega aqui quer ver a leitura e trocar um dos lados, não
 * montar um par do zero — então o par vem montado e cada nome é o botão que
 * o troca.
 *
 * O mapa aqui é o `PlanoCultural` da aba da empresa, sem cópia, mas em
 * posição absoluta: cada um fica no quadrante que as respostas produzem, e a
 * distância entre os dois é a diferença. O modo alvo — empresa no centro,
 * pessoa no raio da aderência — existe para comparar *muitas* pessoas contra
 * uma empresa; com dois pontos ele jogaria fora justamente o que se quer ver
 * aqui, que é onde cada um dos dois está.
 */
function CulturaSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state } = useIelDemo();
  const [pessoa, setPessoa] = useState<Alvo | null>(null);
  const [empresa, setEmpresa] = useState<Alvo | null>(null);

  /*
   * Os índices só são montados com a aba aberta: são 268 pessoas e 2.500
   * empresas, e normalizar todo nome a cada render da casca seria trabalho
   * jogado fora em toda tela do produto.
   */
  const pessoas = useMemo(
    () => (open ? opcoesDosPontos(getCultureMapPoints(state, 'talentos')) : []),
    [open, state]
  );
  const empresas = useMemo(
    () => (open ? opcoesDosPontos(getCultureMapPoints(state, 'empresas')) : []),
    [open, state]
  );

  // Abrir escolhe o primeiro par; fechar esquece, porque o par de dez
  // minutos atrás não é a pergunta de agora.
  useEffect(() => {
    if (open) {
      setPessoa(primeiraOpcao(pessoas));
      setEmpresa(primeiraOpcao(empresas));
    } else {
      setPessoa(null);
      setEmpresa(null);
    }
    // As listas não mudam com a aba aberta; depender delas aqui desfaria a
    // escolha da analista a cada mexida no estado da demonstração.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="text-base">Análise de cultura</SheetTitle>
          <SheetDescription className="text-xs">
            Uma pessoa e uma empresa, lado a lado. Clique num nome para trocar.
          </SheetDescription>
        </SheetHeader>

        {pessoa && empresa ? (
          <>
            <div className="flex flex-col gap-1 border-b p-2">
              <SeletorDeAlvo
                rotulo="Pessoa"
                alvo={pessoa}
                opcoes={pessoas}
                dica="Buscar pessoa pelo nome"
                vazio="Ninguém com esse nome respondeu o questionário."
                aoEscolher={setPessoa}
                className="text-sm font-medium"
              />
              <SeletorDeAlvo
                rotulo="Empresa"
                alvo={empresa}
                opcoes={empresas}
                dica="Buscar empresa pelo nome"
                vazio="Nenhuma empresa com esse nome fechou o perfil."
                aoEscolher={setEmpresa}
                className="text-sm text-muted-foreground"
              />
            </div>
            <AnaliseDoPar
              pessoa={pessoa}
              empresa={empresa}
              aoSair={() => onOpenChange(false)}
            />
          </>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Ainda não há pessoa e empresa com perfil de cultura para comparar.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Primeiro nome, para o texto falar com a pessoa e não com o cadastro. */
function primeiroNome(nome: string): string {
  return nome.split(' ')[0] ?? nome;
}

/** A leitura do par: a aderência, o plano com os dois pontos e os eixos. */
function AnaliseDoPar({
  pessoa,
  empresa,
  aoSair
}: {
  pessoa: Alvo;
  empresa: Alvo;
  aoSair: () => void;
}) {
  const { state } = useIelDemo();

  const leitura = useMemo(
    () => getCultureFit(state, pessoa.id, empresa.id),
    [state, pessoa.id, empresa.id]
  );

  /*
   * A empresa é montada aqui, como em `MapaDaEmpresa`, e não lida de
   * `getCultureMapPoints`: varrer as 2.500 da carteira para achar uma só
   * seria trabalho jogado fora a cada render.
   */
  const pontoDaEmpresa = useMemo((): CultureMapPoint | null => {
    const company = getCompany(empresa.id);
    if (!company) return null;
    const respostas = getCompanyCultureAnswers(state, empresa.id);
    const posicao = calcularPosicaoCultural(respostas.declared);
    if (!posicao) return null;
    return {
      id: company.id,
      name: company.name,
      detail: company.sector,
      kind: 'empresa',
      position: posicao,
      culture: classificarCultura(posicao),
      teamPosition:
        respostas.divergentAxes > 0
          ? calcularPosicaoCultural(respostas.team)
          : null,
      divergentAxes: respostas.divergentAxes
    };
  }, [state, empresa.id]);

  /*
   * A pessoa sai do índice: ele já devolve só quem respondeu o questionário,
   * e achar uma entre 268 é uma passada — a carteira de empresas é dez vezes
   * maior, e é por isso que só ela é montada à mão.
   */
  const pontoDaPessoa = useMemo(
    () =>
      getCultureMapPoints(state, 'talentos').find(
        (ponto) => ponto.id === pessoa.id
      ) ?? null,
    [state, pessoa.id]
  );

  const total = leitura?.aderencia.total ?? null;

  const falta = !pontoDaPessoa
    ? `${primeiroNome(pessoa.nome)} ainda não respondeu o questionário de cultura.`
    : !pontoDaEmpresa
      ? `A ${empresa.nome} ainda não fechou o perfil de cultura.`
      : !leitura
        ? 'Os dois responderam, mas nenhum tema em comum — não há o que comparar ainda.'
        : null;

  return (
    <>
      <ScrollArea className="min-h-0 flex-1">
        {/* `falta` já cobre os três casos sem leitura; o `!leitura` aqui é
            para o compilador estreitar o tipo dentro do outro ramo. */}
        {falta || !leitura || !pontoDaPessoa || !pontoDaEmpresa ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {falta}
          </p>
        ) : (
          <div className="flex flex-col">
            {/* O número primeiro: é o que a analista repete no telefone. */}
            <div className="flex flex-col gap-2 border-b p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm text-muted-foreground">Aderência</span>
                <span
                  className={cn(
                    'text-2xl font-semibold tabular-nums',
                    textoDaAderencia(total)
                  )}
                >
                  {formatAdherence(total)}
                </span>
              </div>
              <div
                aria-hidden="true"
                className={cn('h-1.5 w-full rounded-full', TRILHO.trilha)}
              >
                <div
                  className={cn('h-full rounded-full', barraDaAderencia(total))}
                  style={{ width: `${total ?? 0}%` }}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {total !== null ? (
                  <FaixaBadge faixa={faixaDeAderencia(total)} />
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {plural(
                    leitura.aderencia.coverage.answeredAxes,
                    'tema comparado',
                    'temas comparados'
                  )}
                  {leitura.divergentAxes > 0
                    ? ` · ${plural(leitura.divergentAxes, 'tema em que a equipe diverge', 'temas em que a equipe diverge')}`
                    : ''}
                </span>
              </div>
              {!temBaseParaRanquear(leitura.aderencia) ? (
                <p className="text-xs text-muted-foreground">
                  Poucos temas respondidos pelos dois lados: leia o percentual
                  como indício, não como medida.
                </p>
              ) : null}
            </div>

            {/*
             * O plano com os dois, em posição absoluta: a empresa é a
             * referência e a pessoa vem selecionada, o que faz o `PlanoCultural`
             * ligar uma à outra. A linha é a diferença que o percentual resume.
             */}
            <div className="flex flex-col gap-2 border-b p-4">
              <PlanoCultural
                points={[pontoDaEmpresa, pontoDaPessoa]}
                referenceId={pontoDaEmpresa.id}
                selectedId={pontoDaPessoa.id}
              />
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COR_DO_TALENTO }}
                  />
                  <span className="truncate">{pessoa.nome}</span>
                </span>
                <span className="flex min-w-0 items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: COR_DA_EMPRESA }}
                  />
                  <span className="truncate">{empresa.nome}</span>
                </span>
              </div>
            </div>

            {/*
             * Tema a tema: o percentual diz *quanto*, e só isto diz *em quê*.
             * É a mesma `leitura.axes` que o perfil abre. As duas respostas
             * ficam lado a lado porque é a frase que a analista lê no
             * telefone — "ela quer rodízio, vocês pedem rotina fixa" —, e o
             * ícone repete o que a cor diz, para a divergência não depender
             * de enxergar vermelho.
             */}
            {leitura.axes.length > 0 ? (
              <ul className="flex flex-col divide-y">
                {leitura.axes.map((eixo) => (
                  <li
                    key={eixo.axisId}
                    className="flex flex-col gap-1 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      {eixo.convergente ? (
                        <IconCheck
                          aria-hidden="true"
                          className={cn(
                            'size-3.5 shrink-0',
                            TEXTO_DE_ESTADO.combina
                          )}
                        />
                      ) : (
                        <IconAlertTriangle
                          aria-hidden="true"
                          className={cn(
                            'size-3.5 shrink-0',
                            TEXTO_DE_ESTADO.atencao
                          )}
                        />
                      )}
                      <span className="min-w-0 text-sm font-medium">
                        {eixo.axisLabel}
                      </span>
                      <span className="sr-only">
                        {eixo.convergente ? 'Combina' : 'Diverge'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 pl-5.5 text-xs">
                      <span className="text-muted-foreground">
                        <span className="text-foreground">
                          {primeiroNome(pessoa.nome)}:
                        </span>{' '}
                        {eixo.opcaoDoTalento}
                      </span>
                      <span className="text-muted-foreground">
                        <span className="text-foreground">{empresa.nome}:</span>{' '}
                        {eixo.opcaoDaEmpresa}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </ScrollArea>

      {/*
       * O rodapé fecha a leitura com o que se faz com ela: marcar a pessoa
       * para a vaga da empresa comparada, e só então abrir o perfil. É a
       * ordem do trabalho — a analista decide aqui e confere depois.
       */}
      <div className="flex flex-col gap-2 border-t p-3">
        <EncaminharPessoa
          talentId={pessoa.id}
          companyId={empresa.id}
          aoSair={aoSair}
        />
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Link
            href={routes.dashboard.iel.talents.byId(pessoa.id).index}
            onClick={aoSair}
          >
            Abrir a análise completa de {primeiroNome(pessoa.nome)}
          </Link>
        </Button>
      </div>
    </>
  );
}

/**
 * O mapa de cultura, pelo outro lado: a empresa e quem se encaixa nela.
 *
 * É a irmã de `CulturaSheet`, na direção inversa — lá a pergunta é "onde esta
 * pessoa cabe", aqui é "quem cabe nesta empresa". A medida é a mesma
 * `getCultureFit`, então os dois painéis nunca dão percentuais diferentes
 * para o mesmo par.
 *
 * O desenho é o mesmo `PlanoCultural` da aba da empresa, não uma segunda
 * versão dele: o gráfico é `aspect-square w-full` e se acomoda na largura da
 * aba sozinho. Embaixo dele vem o recorte das cinco primeiras, para quem
 * está ao telefone ler nomes em vez de pontos. O que a aba não traz é o
 * resto da tela da empresa — escopo por vaga, filtro por quadrante, detalhe
 * do ponto —, e é por isso que o rodapé leva para lá.
 */
function MapaSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state } = useIelDemo();
  const [empresa, setEmpresa] = useState<Alvo | null>(null);

  /*
   * Só as empresas com perfil fechado: são as que têm posição para ficar no
   * centro do plano. Oferecer as 2.500 da carteira mandaria a analista para
   * um aviso de que não há o que medir.
   */
  const empresas = useMemo(
    () => (open ? opcoesDosPontos(getCultureMapPoints(state, 'empresas')) : []),
    [open, state]
  );

  useEffect(() => {
    setEmpresa(open ? primeiraOpcao(empresas) : null);
    // A lista não muda com a aba aberta; depender dela aqui desfaria a
    // escolha da analista a cada mexida no estado da demonstração.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="text-base">Mapa de cultura</SheetTitle>
          <SheetDescription className="text-xs">
            Quem se candidatou às vagas abertas da empresa, pela aderência à
            cultura dela. Marque quem vai e envie em lote.
          </SheetDescription>
        </SheetHeader>

        {empresa ? (
          <>
            <div className="border-b p-2">
              <SeletorDeAlvo
                rotulo="Empresa"
                alvo={empresa}
                opcoes={empresas}
                dica="Buscar empresa pelo nome"
                vazio="Nenhuma empresa com esse nome fechou o perfil."
                aoEscolher={setEmpresa}
                className="text-sm font-medium"
              />
            </div>
            <EncaixesDaEmpresa
              alvo={empresa}
              aoSair={() => onOpenChange(false)}
            />
          </>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhuma empresa fechou o perfil de cultura ainda.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** As pessoas que se encaixam na empresa escolhida. */
function EncaixesDaEmpresa({
  alvo,
  aoSair
}: {
  alvo: Alvo;
  aoSair: () => void;
}) {
  const { state } = useIelDemo();
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [paraEnviar, setParaEnviar] = useState<Set<string>>(new Set());

  // Trocar de empresa não carrega a pessoa espetada na anterior, nem a
  // seleção montada para as vagas da outra.
  useEffect(() => {
    setSelecionado(null);
    setParaEnviar(new Set());
  }, [alvo.id]);

  /*
   * A empresa é montada aqui, como em `MapaDaEmpresa`, e não lida de
   * `getCultureMapPoints`: varrer as 2.500 da carteira para achar uma só
   * seria trabalho jogado fora a cada render. As pessoas, sim, vêm do índice
   * — ele já devolve só quem respondeu o questionário, que é exatamente quem
   * tem posição para desenhar.
   */
  const pontoDaEmpresa = useMemo((): CultureMapPoint | null => {
    const company = getCompany(alvo.id);
    if (!company) return null;
    const respostas = getCompanyCultureAnswers(state, alvo.id);
    const posicao = calcularPosicaoCultural(respostas.declared);
    if (!posicao) return null;
    return {
      id: company.id,
      name: company.name,
      detail: company.sector,
      kind: 'empresa',
      position: posicao,
      culture: classificarCultura(posicao),
      teamPosition:
        respostas.divergentAxes > 0
          ? calcularPosicaoCultural(respostas.team)
          : null,
      divergentAxes: respostas.divergentAxes
    };
  }, [state, alvo.id]);

  /**
   * Só quem se candidatou a uma vaga aberta desta empresa.
   *
   * O painel abria a base inteira — 268 pontos numa nuvem em que ninguém
   * achava ninguém, e sobre a qual não havia ação possível: encaminhar é
   * sempre para uma vaga. Com o recorte, cada ponto é um currículo que pode
   * ir hoje. Quem combina mas não se candidatou continua no mapa da empresa,
   * que é onde se procura gente para convidar.
   */
  const pessoas = useMemo(() => {
    const inscritos = new Set<string>();
    for (const vaga of getJobsByCompany(alvo.id)) {
      if (vaga.stage === 'encerrada') continue;
      for (const candidatura of getApplicationsByJob(state, vaga.id)) {
        inscritos.add(candidatura.talentId);
      }
    }
    return getCultureMapPoints(state, 'talentos').filter((pessoa) =>
      inscritos.has(pessoa.id)
    );
  }, [state, alvo.id]);

  /** A aderência de cada pessoa a esta empresa — a mesma conta do mapa. */
  const aderenciaPorPessoa = useMemo(() => {
    const mapa = new Map<string, AdherenceResult>();
    if (!pontoDaEmpresa) return mapa;
    for (const pessoa of pessoas) {
      const leitura = getCultureFit(state, pessoa.id, alvo.id);
      if (leitura?.aderencia) mapa.set(pessoa.id, leitura.aderencia);
    }
    return mapa;
  }, [state, pessoas, pontoDaEmpresa, alvo.id]);

  const encaixes = useMemo(() => {
    const lista: Encaixe[] = [];
    for (const pessoa of pessoas) {
      const aderencia = aderenciaPorPessoa.get(pessoa.id);
      if (!aderencia) continue;
      lista.push({
        id: pessoa.id,
        nome: pessoa.name,
        detalhe: pessoa.detail,
        aderencia,
        temBase: temBaseParaRanquear(aderencia)
      });
    }
    return ordenarEncaixes(lista).slice(0, LINHAS_NO_RESUMO);
  }, [pessoas, aderenciaPorPessoa]);

  /*
   * O desenho é o `PlanoCultural` da aba da empresa, sem cópia: mesma
   * projeção, mesmos balões, mesmo modo alvo — a empresa no centro e cada
   * pessoa no raio da própria aderência. O gráfico é `aspect-square w-full`,
   * então ele se acomoda na largura da aba sem medida especial.
   *
   * As cinco da lista vão em primeiro plano. Quem fica de fora continua
   * desenhado, só que discreto: o mapa não esconde ninguém, e é justamente
   * ver a nuvem inteira em volta que diz se as cinco são um destaque real ou
   * o topo de um empate.
   */
  const emFoco = useMemo(
    () => new Set(encaixes.map((encaixe) => encaixe.id)),
    [encaixes]
  );

  const pontos = useMemo(
    () => (pontoDaEmpresa ? [pontoDaEmpresa, ...pessoas] : []),
    [pontoDaEmpresa, pessoas]
  );

  return (
    <RankingDeEncaixes
      encaixes={encaixes}
      antes={
        pontoDaEmpresa ? (
          <div className="flex flex-col gap-2 border-b p-4">
            <PlanoCultural
              points={pontos}
              referenceId={pontoDaEmpresa.id}
              aderenciaPorTalento={aderenciaPorPessoa}
              focusIds={emFoco}
              selectedId={selecionado}
              onSelect={(id) =>
                setSelecionado((atual) => (atual === id ? null : id))
              }
              showProximityRings
            />
            {/*
             * A legenda fica sempre visível, como na aba da empresa: com duas
             * séries a identidade não pode depender de acertar a cor de
             * cabeça, e a forma repete o que a cor diz.
             */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: COR_DO_TALENTO }}
                />
                Pessoa
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: COR_DA_EMPRESA }}
                />
                <span className="truncate">{alvo.nome}</span>
              </span>
            </div>
          </div>
        ) : null
      }
      selecionados={paraEnviar}
      aoAlternar={(id) =>
        setParaEnviar((atual) => {
          const proxima = new Set(atual);
          if (proxima.has(id)) proxima.delete(id);
          else proxima.add(id);
          return proxima;
        })
      }
      vazio={
        !pontoDaEmpresa
          ? `A ${alvo.nome} ainda não fechou o perfil de cultura. Sem ele não há contra o que medir as pessoas.`
          : encaixes.length === 0
            ? 'Ninguém candidato às vagas abertas da empresa respondeu o questionário de cultura ainda.'
            : null
      }
      rodape={
        <div className="flex flex-col gap-2">
          {/* Marcadas na lista, vão juntas: é a remessa se montando sem sair
              da leitura que a decidiu. */}
          {paraEnviar.size > 0 ? (
            <EncaminharSelecionados
              talentIds={[...paraEnviar]}
              companyId={alvo.id}
              aoConcluir={() => setParaEnviar(new Set())}
            />
          ) : null}
          {/* Clicar num ponto do plano espeta a pessoa; é dela que o rodapé
              passa a falar, sem tirar a analista do mapa. */}
          {selecionado ? (
            <EncaminharPessoa
              talentId={selecionado}
              companyId={alvo.id}
              aoSair={aoSair}
            />
          ) : null}
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Link
              href={routes.dashboard.iel.companies.cultureMapById(alvo.id)}
              onClick={aoSair}
            >
              Abrir o mapa da {alvo.nome}
            </Link>
          </Button>
        </div>
      }
    />
  );
}
/**
 * A fila do dia numa aba lateral, alcançável de qualquer tela.
 *
 * É a mesma `montarPendencias` do Início e do sino — não uma segunda lista
 * com regra própria. O que muda é o alcance: a analista que está no meio de
 * uma vaga pode olhar o que falta sem perder a tela em que está, e só sai
 * dela quando escolhe o verbo. O filtro por prioridade acompanha o do Início
 * para quem chega aqui não reaprender a leitura.
 */
function FilaSheet({
  pendencias,
  open,
  onOpenChange
}: {
  pendencias: Pendencia[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [filtro, setFiltro] = useState<NivelDePrioridade | 'todas'>('todas');

  const contagem = useMemo(() => {
    const total: Record<NivelDePrioridade, number> = {
      alta: 0,
      media: 0,
      normal: 0
    };
    for (const pendencia of pendencias) total[pendencia.prioridade]++;
    return total;
  }, [pendencias]);

  const visiveis =
    filtro === 'todas'
      ? pendencias
      : pendencias.filter((pendencia) => pendencia.prioridade === filtro);

  const filtros: { id: NivelDePrioridade | 'todas'; rotulo: string }[] = [
    { id: 'todas', rotulo: `Todas (${pendencias.length})` },
    { id: 'alta', rotulo: `Alta (${contagem.alta})` },
    { id: 'media', rotulo: `Média (${contagem.media})` },
    { id: 'normal', rotulo: `Normal (${contagem.normal})` }
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="text-base">Precisa de você hoje</SheetTitle>
          <SheetDescription className="text-xs">
            {pendencias.length === 0
              ? 'Nada pendente agora.'
              : `${pendencias.length} ${pendencias.length === 1 ? 'pendência ordenada' : 'pendências ordenadas'} por impacto e prazo.`}
          </SheetDescription>
        </SheetHeader>

        {pendencias.length > 0 ? (
          <div
            role="group"
            aria-label="Filtrar por prioridade"
            className="flex flex-wrap gap-1.5 border-b p-3"
          >
            {filtros.map(({ id, rotulo }) => (
              <Button
                key={id}
                type="button"
                variant={filtro === id ? 'default' : 'outline'}
                size="xs"
                className="rounded-full"
                aria-pressed={filtro === id}
                onClick={() => setFiltro(id)}
              >
                {id !== 'todas' ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 rounded-full',
                      PONTO_DA_PRIORIDADE[id]
                    )}
                  />
                ) : null}
                {rotulo}
              </Button>
            ))}
          </div>
        ) : null}

        <ScrollArea className="min-h-0 flex-1">
          {visiveis.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              {pendencias.length === 0
                ? 'Nada pendente agora.'
                : 'Nada nesta prioridade.'}
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {visiveis.map((pendencia) => {
                const { Icone, tom } = ICONE_DO_TIPO[pendencia.tipo];
                return (
                  <li
                    key={pendencia.id}
                    className="flex flex-col gap-2 p-4"
                  >
                    <div className="flex items-start gap-2">
                      <Icone
                        aria-hidden="true"
                        className={cn('mt-0.5 size-4 shrink-0', tom)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">
                          {TIPO_DE_PENDENCIA_LABEL[pendencia.tipo]}
                        </span>
                        <span className="text-sm font-medium">
                          {pendencia.titulo}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pendencia.resumo}
                        </span>
                        <span
                          className={cn(
                            'text-xs',
                            classeDoPrazo(pendencia.statusPrazo)
                          )}
                        >
                          {pendencia.prazoLabel}
                        </span>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'size-1.5 rounded-full',
                            PONTO_DA_PRIORIDADE[pendencia.prioridade]
                          )}
                        />
                        {ROTULO_DA_PRIORIDADE[pendencia.prioridade]}
                      </span>
                    </div>
                    {/*
                     * O verbo fecha a aba: quem clicou escolheu sair da tela
                     * em que estava, e a aba aberta por cima da tela de
                     * destino seria um painel que ninguém pediu.
                     */}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="self-start"
                    >
                      <Link
                        href={pendencia.href}
                        onClick={() => onOpenChange(false)}
                      >
                        {pendencia.verbo}
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t p-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full"
          >
            <Link
              href={routes.dashboard.iel.index}
              onClick={() => onOpenChange(false)}
            >
              Ver a fila no Início
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
