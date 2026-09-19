'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { COPY } from '@/features/iel-demo/copy';
import { DEMO_PERSONAS } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getOpenClarifications,
  getRegisteredReferrals
} from '@/features/iel-demo/state/selectors';
import {
  Briefcase01Icon,
  Building01Icon,
  Database01Icon,
  Home01Icon,
  Message01Icon,
  SentIcon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import { Button, cn, Dialog, FilterNativeSelect, toast } from '@workspace/ui';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home01Icon;
  badge?: number;
};

function useNavItems(): NavItem[] {
  const { state, persona } = useIelDemo();
  const iel = routes.dashboard.iel;
  const openClarifications = getOpenClarifications(state).length;
  const referrals = getRegisteredReferrals(state).length;

  if (persona.kind === 'gestor' && persona.companyId) {
    return [
      { href: iel.index, label: 'Painel da empresa', icon: Home01Icon },
      {
        href: iel.jobs.index,
        label: 'Vagas da empresa',
        icon: Briefcase01Icon
      },
      {
        href: iel.referrals.index,
        label: 'Perfis encaminhados',
        icon: SentIcon,
        badge: referrals
      },
      {
        href: iel.clarifications.index,
        label: 'Perguntas do IEL',
        icon: Message01Icon
      },
      {
        href: iel.companies.byId(persona.companyId),
        label: 'Contexto da equipe',
        icon: Building01Icon
      }
    ];
  }

  return [
    { href: iel.index, label: 'Visão geral', icon: Home01Icon },
    { href: iel.jobs.index, label: 'Vagas', icon: Briefcase01Icon },
    { href: iel.talents.index, label: 'Talentos', icon: UserGroupIcon },
    { href: iel.companies.index, label: 'Empresas', icon: Building01Icon },
    {
      href: iel.clarifications.index,
      label: COPY.questions.label,
      icon: Message01Icon,
      badge: openClarifications
    },
    {
      href: iel.referrals.index,
      label: COPY.referral.label,
      icon: SentIcon,
      badge: referrals
    },
    { href: iel.dataSources, label: COPY.sources.label, icon: Database01Icon }
  ];
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href ||
    (href !== routes.dashboard.iel.index && pathname.startsWith(href));
}

/** Rótulo da seção aberta, para a barra dizer onde se está sem um breadcrumb. */
function useActiveSectionLabel(items: NavItem[]): string | null {
  const isActive = useIsActive();
  return items.find((item) => isActive(item.href))?.label ?? null;
}

/**
 * Faixa de controle da demonstração. Fica deliberadamente fora da navegação
 * do produto: é andaime de apresentação, não funcionalidade.
 */
function DemoBar() {
  const { state, dispatch, persona, resetDemo } = useIelDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [scriptMode, setScriptMode] = useState<'completo' | 'curto'>(
    'completo'
  );
  const iel = routes.dashboard.iel;

  return (
    <div className="border-b border-border bg-card/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-2">
        <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-warning"
          />
          <span className="font-medium text-foreground">Dados fictícios</span>
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label
            htmlFor="demo-persona"
            className="text-xs text-muted-foreground"
          >
            Ver como
          </label>
          <FilterNativeSelect
            id="demo-persona"
            className="h-7 w-56 text-xs"
            value={persona.id}
            onValueChange={(value) => {
              dispatch({ type: 'set-persona', personaId: value });
              toast.info(
                'Recorte de dados alterado. Isso é uma simulação de visão, não autenticação.'
              );
            }}
          >
            {DEMO_PERSONAS.map((option) => (
              <option
                key={option.id}
                value={option.id}
              >
                {option.label}
              </option>
            ))}
          </FilterNativeSelect>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-border sm:block"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            aria-label="Roteiro da demonstração"
            onClick={() => setShowScript(true)}
          >
            Roteiro
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            aria-label="Reiniciar demonstração"
            onClick={() => setConfirmReset(true)}
          >
            Reiniciar
          </Button>
        </div>
      </div>

      <Dialog
        visible={confirmReset}
        onHide={() => setConfirmReset(false)}
        header="Reiniciar a demonstração?"
        description="Todo o progresso local (esclarecimentos, listas e encaminhamentos) volta ao estado inicial da base fictícia."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmReset(false)}
            >
              Manter como está
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetDemo();
                setConfirmReset(false);
                toast.success('Demonstração reiniciada com a base inicial.');
              }}
            >
              Reiniciar agora
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          A base volta a ter 3 empresas, 3 vagas, 8 talentos, 10 candidaturas e
          2 solicitações de esclarecimento em aberto.
        </p>
      </Dialog>

      <Dialog
        visible={showScript}
        onHide={() => setShowScript(false)}
        size="lg"
        header="Roteiro da demonstração"
        description="A jornada completa, ou o recorte de três minutos para apresentar."
      >
        <div
          role="tablist"
          aria-label="Versão do roteiro"
          className="mb-4 flex gap-1 border-b border-border"
        >
          {(
            [
              ['completo', 'Completo — 7 passos'],
              ['curto', 'Curto — 3 minutos']
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={scriptMode === value}
              onClick={() => setScriptMode(value)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                scriptMode === value
                  ? 'border-primary font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {scriptMode === 'curto' ? (
          <ShortScript onNavigate={() => setShowScript(false)} />
        ) : (
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">
                1. Encontrar o processo que precisa de atenção.
              </span>{' '}
              <Link
                className="underline"
                href={iel.index}
                onClick={() => setShowScript(false)}
              >
                Visão geral
              </Link>{' '}
              → vaga Assistente de Logística.
            </li>
            <li>
              <span className="font-medium text-foreground">
                2. Ver a integração dos dados.
              </span>{' '}
              <Link
                className="underline"
                href={iel.jobs.byId('VAG-01').index}
                onClick={() => setShowScript(false)}
              >
                Mesa de seleção da vaga 1
              </Link>{' '}
              → abrir Ana Ribeiro e clicar numa conclusão para ver a evidência.
            </li>
            <li>
              <span className="font-medium text-foreground">3. Comparar.</span>{' '}
              Selecionar Ana e Bruno na matriz e abrir{' '}
              <Link
                className="underline"
                href={iel.jobs.byId('VAG-01').comparison}
                onClick={() => setShowScript(false)}
              >
                comparação
              </Link>
              .
            </li>
            <li>
              <span className="font-medium text-foreground">
                4. Esclarecer com a pessoa certa.
              </span>{' '}
              Criar a pergunta ao gestor sobre apoio inicial, abrir a
              experiência do destinatário em{' '}
              <Link
                className="underline"
                href={iel.clarifications.index}
                onClick={() => setShowScript(false)}
              >
                Perguntas pendentes
              </Link>{' '}
              e incorporar a resposta.
            </li>
            <li>
              <span className="font-medium text-foreground">
                5. Mesmo perfil, outra leitura.
              </span>{' '}
              Abrir{' '}
              <Link
                className="underline"
                href={iel.jobs.byId('VAG-02').index}
                onClick={() => setShowScript(false)}
              >
                a vaga 2
              </Link>{' '}
              e ver Ana com contexto organizacional diferente; esclarecer a
              disponibilidade pendente.
            </li>
            <li>
              <span className="font-medium text-foreground">
                6. Preparar e registrar o encaminhamento.
              </span>{' '}
              Adicionar Ana à lista da vaga 2 e registrar em{' '}
              <Link
                className="underline"
                href={iel.jobs.byId('VAG-02').referral}
                onClick={() => setShowScript(false)}
              >
                preparação do encaminhamento
              </Link>
              .
            </li>
            <li>
              <span className="font-medium text-foreground">
                7. Ver a resposta da empresa.
              </span>{' '}
              Trocar a persona para “Gestor — Horizonte Alimentos”, registrar
              “Quero entrevistar” e voltar como analista para ver o histórico.
            </li>
          </ol>
        )}

        <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
          Estado atual: {state.clarifications.length} solicitações registradas,{' '}
          {plural(state.referrals.length, 'encaminhamento', 'encaminhamentos')}.
        </p>
      </Dialog>
    </div>
  );
}

/**
 * Recorte de três minutos.
 *
 * O briefing pede uma versão curta para apresentar, e avisa que os passos
 * abreviados precisam ter estado válido — nada de pular validação para
 * encurtar. Por isso o caminho é o mesmo da jornada completa; o que muda é
 * quais paradas se mostra.
 */
function ShortScript({ onNavigate }: { onNavigate: () => void }) {
  const iel = routes.dashboard.iel;

  const steps: { text: ReactNode; href?: string }[] = [
    {
      text: 'Abrir a mesa de seleção da vaga com 90 candidaturas.',
      href: iel.jobs.byId('VAG-01').index
    },
    {
      text: 'Filtrar por “Requisito obrigatório sem informação”: a triagem que substitui abrir perfil por perfil.'
    },
    {
      text: 'Selecionar Ana e Bruno e abrir a comparação.',
      href: iel.jobs.byId('VAG-01').comparison
    },
    {
      text: 'Clicar numa conclusão e mostrar a evidência, com a fonte de onde veio.'
    },
    {
      text: 'Esclarecer o apoio inicial com o gestor e incorporar a resposta.',
      href: iel.clarifications.index
    },
    {
      text: 'Abrir Ana na vaga 2: mesmo perfil, contexto da empresa diferente, leitura diferente.',
      href: iel.jobs.byId('VAG-02').index
    },
    {
      text: 'Responder o fit como candidata (Ana, vaga 2): aceite, cinco perguntas no celular, sem login e sem o nome da empresa.',
      href: iel.applications.byId('CAND-05').fit
    },
    {
      text: 'Registrar o encaminhamento e ver a trajetória dela entre os dois processos.',
      href: iel.jobs.byId('VAG-02').referral
    }
  ];

  return (
    <ol className="space-y-2.5 text-sm text-muted-foreground">
      {steps.map((step, index) => (
        <li
          key={index}
          className="flex gap-2.5"
        >
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
          >
            {index + 1}
          </span>
          <span>
            {step.text}
            {step.href ? (
              <>
                {' '}
                <Link
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  href={step.href}
                  onClick={onNavigate}
                >
                  abrir
                </Link>
              </>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * O método, explicado uma vez para o produto inteiro.
 *
 * Antes, cada tela repetia suas ressalvas ("não é teste psicométrico", "o
 * perfil é média da amostra") em parágrafo inline, e o resultado era uma
 * tela que parecia um manual. As ressalvas continuam obrigatórias — são o
 * que impede alguém de ler o percentual como nota de pessoa —, só que agora
 * moram num lugar só, alcançável de qualquer tela.
 */
function ComoFuncionaGlobal() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
        onClick={() => setAberto(true)}
      >
        Como funciona
      </Button>

      <Dialog
        visible={aberto}
        onHide={() => setAberto(false)}
        size="lg"
        header="Como funciona"
        description="O método, em seis pontos."
        footer={
          <Button
            variant="ghost"
            onClick={() => setAberto(false)}
          >
            Fechar
          </Button>
        }
      >
        <div className="iel-prose space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">
              O percentual é sobre a empresa, não sobre a vaga.
            </p>
            <p>
              Ele compara o que a empresa pratica no dia a dia com o que a
              pessoa procura, em cinco pontos. Os requisitos técnicos da vaga
              são a outra coluna, e vêm prontos do sistema de vagas.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Como a empresa trabalha é a média de quem trabalha nela.
            </p>
            <p>
              Não é a resposta de uma pessoa do RH: é a média das respostas de
              colaboradores de áreas e níveis diferentes. Quando a equipe
              responde pouco, o ponto fica em aberto e não entra na conta.
              Quando gestão e equipe respondem diferente, a diferença aparece ao
              lado da média.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              O mínimo é 35%, e quem decide é uma pessoa.
            </p>
            <p>
              Abaixo disso a pessoa não é considerada compatível, mas continua
              visível e marcada: o corte é do IEL, serve para organizar a
              leitura e não descarta ninguém sozinho.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Não é teste psicológico e não produz nota.
            </p>
            <p>
              São cinco perguntas sobre preferências de trabalho no cotidiano.
              Nada de personalidade, saúde, família, religião ou opinião. O
              número não prevê desempenho nem qualifica ninguém.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              Os resumos são montados por regra fixa.
            </p>
            <p>
              Nenhuma etapa do caminho depende de serviço cobrado por candidato.
              Inteligência artificial paga existe como camada opcional,
              desligada por padrão, e nunca no caminho principal.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">
              O candidato não vê o nome da empresa.
            </p>
            <p>
              Antes da entrevista ele vê atividade, localidade, segmento e
              turno. O nome só aparece quando a empresa o chama.
            </p>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function BrandMark() {
  return (
    <Link
      href={routes.dashboard.iel.index}
      className="group flex shrink-0 items-center gap-3 focus-visible:outline-none"
    >
      <span
        aria-hidden="true"
        className="iel-display text-[1.35rem] leading-none tracking-tight text-sidebar-foreground"
      >
        IEL
      </span>
      <span className="h-7 w-px bg-sidebar-border" />
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-[13px] font-medium text-sidebar-foreground">
          Central de Seleção
        </span>
        <span className="block truncate text-[11px] text-sidebar-foreground/55">
          Centro de Empregabilidade
        </span>
      </span>
    </Link>
  );
}

function NavBadge({ value }: { value: number }) {
  return (
    <span className="min-w-[1.125rem] shrink-0 rounded-[var(--radius-pill)] bg-sidebar-primary px-1.5 text-center text-[10px] font-semibold leading-[1.125rem] tabular-nums text-sidebar-primary-foreground">
      {value}
    </span>
  );
}

/**
 * Navegação da Central.
 *
 * A barra lateral escura com conteúdo cinza ao lado é o desenho padrão de
 * qualquer ferramenta interna — e roubava a largura de que a mesa de seleção
 * precisa, já que a matriz é larga por natureza. A navegação subiu para uma
 * faixa em tinta, e o conteúdo ganhou a página inteira.
 */
function TopNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Navegação principal"
      className="overflow-x-auto"
    >
      <ul className="flex w-max items-stretch gap-0.5 lg:w-auto">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2 whitespace-nowrap px-3 py-3.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                  active
                    ? 'font-medium text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
                )}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={16}
                  aria-hidden="true"
                  className="shrink-0"
                />
                {item.label}
                {item.badge ? <NavBadge value={item.badge} /> : null}
                {/* Régua de seção ativa, rente à base da faixa. */}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 bottom-0 h-0.5 rounded-t bg-sidebar-primary"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Casca da Central IEL: faixa de demonstração, navegação e conteúdo. */
export function IelShell({ children }: { children: ReactNode }) {
  const navItems = useNavItems();
  const activeSection = useActiveSectionLabel(navItems);
  const { persona } = useIelDemo();

  return (
    <div
      data-iel-theme=""
      className="flex min-h-dvh flex-col bg-background text-foreground"
    >
      <header className="iel-ink sticky top-0 z-30 border-b border-sidebar-border shadow-[0_1px_0_0_hsl(var(--sidebar-border)),0_8px_24px_-20px_hsl(var(--iel-shadow-hue)/0.5)]">
        {/* Faixa de marca: 3px do gradiente, a única presença dele na casca. */}
        <div
          aria-hidden="true"
          className="h-[3px] w-full"
          style={{ background: 'var(--iel-gradient)' }}
        />
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-x-5 gap-y-2 px-6 pt-3.5 lg:flex-nowrap">
          <BrandMark />
          {activeSection ? (
            <>
              <span
                aria-hidden="true"
                className="hidden h-4 w-px bg-sidebar-border lg:block"
              />
              <span className="hidden truncate text-[13px] font-medium text-sidebar-foreground lg:block">
                {activeSection}
              </span>
            </>
          ) : null}
          <span className="ml-auto flex items-center gap-3">
            <span className="text-[11px] text-sidebar-foreground/50">
              {persona.label}
            </span>
            <ComoFuncionaGlobal />
          </span>
        </div>
        <div className="mx-auto w-full max-w-[1500px] px-4">
          <TopNav items={navItems} />
        </div>
      </header>

      <DemoBar />

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-6 py-8">
        {children}
      </main>

      <footer className="mt-auto border-t border-border px-6 py-5">
        <p className="mx-auto max-w-[1500px] text-[11px] leading-relaxed text-muted-foreground">
          Protótipo de demonstração do IEL. Empresas, pessoas e avaliações são
          fictícias. Integrações com sistemas de recrutamento e avaliação seriam
          conectadas depois: aqui elas aparecem como fontes simuladas.
        </p>
      </footer>
    </div>
  );
}
