'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
      label: 'Pendências',
      icon: Message01Icon,
      badge: openClarifications
    },
    {
      href: iel.referrals.index,
      label: 'Encaminhamentos',
      icon: SentIcon,
      badge: referrals
    },
    { href: iel.dataSources, label: 'Fontes de dados', icon: Database01Icon }
  ];
}

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    pathname === href ||
    (href !== routes.dashboard.iel.index && pathname.startsWith(href));
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
    <div className="border-b border-border bg-foreground/[0.03]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-2">
        <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-warning"
          />
          <span className="font-medium text-foreground">
            Dados fictícios — demonstração.
          </span>
          <span className="hidden truncate sm:inline">
            Nenhuma mensagem é enviada e nenhum sistema externo é alterado.
          </span>
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label
            htmlFor="demo-persona"
            className="text-xs text-muted-foreground"
          >
            Visualizar como
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
                Pendências
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

function BrandMark() {
  return (
    <Link
      href={routes.dashboard.iel.index}
      className="flex items-center gap-2.5 rounded-[var(--control-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-[var(--control-radius)] bg-sidebar-primary text-[13px] font-bold tracking-tight text-sidebar-primary-foreground"
      >
        IEL
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight text-sidebar-foreground">
          Central de Seleção
        </span>
        <span className="block truncate text-[11px] leading-tight text-sidebar-foreground/60">
          Centro de Empregabilidade
        </span>
      </span>
    </Link>
  );
}

function NavBadge({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <span
      className={cn(
        'ml-auto min-w-5 shrink-0 rounded-[var(--radius-pill)] px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums',
        muted
          ? 'bg-sidebar-foreground/15 text-sidebar-foreground'
          : 'bg-sidebar-primary text-sidebar-primary-foreground'
      )}
    >
      {value}
    </span>
  );
}

function Sidebar({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  const { persona } = useIelDemo();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="px-4 py-4">
        <BrandMark />
      </div>

      <nav
        aria-label="Navegação principal"
        className="flex-1 overflow-y-auto px-3 pb-4"
      >
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-[var(--control-radius)] px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                    active
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={17}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge ? (
                    <NavBadge
                      value={item.badge}
                      muted={active}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        className="border-t border-sidebar-border px-4 py-3"
        title={persona.description}
      >
        <p className="text-[11px] font-medium text-sidebar-foreground/80">
          {persona.label}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-sidebar-foreground/50">
          {persona.description}
        </p>
      </div>
    </aside>
  );
}

function MobileNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();

  return (
    <div className="border-b border-sidebar-border bg-sidebar lg:hidden">
      <div className="px-4 py-3">
        <BrandMark />
      </div>
      <nav
        aria-label="Navegação principal"
        className="overflow-x-auto px-2 pb-2"
      >
        <ul className="flex w-max gap-1">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-[var(--control-radius)] px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/75'
                  )}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={16}
                    aria-hidden="true"
                  />
                  {item.label}
                  {item.badge ? (
                    <NavBadge
                      value={item.badge}
                      muted={active}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Casca da Central IEL: faixa de demonstração, navegação e conteúdo. */
export function IelShell({ children }: { children: ReactNode }) {
  const navItems = useNavItems();

  return (
    <div
      data-iel-theme=""
      className="min-h-dvh bg-background text-foreground"
    >
      <MobileNav items={navItems} />
      <div className="flex">
        <Sidebar items={navItems} />
        <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
          <DemoBar />
          <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-6">
            {children}
          </main>
          <footer className="mt-auto border-t border-border px-5 py-4">
            <p className="mx-auto max-w-[1600px] text-[11px] leading-relaxed text-muted-foreground">
              Protótipo de demonstração do IEL. Empresas, pessoas e avaliações
              são fictícias. Integrações com sistemas de recrutamento e
              avaliação seriam conectadas depois: aqui elas aparecem como fontes
              simuladas.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
