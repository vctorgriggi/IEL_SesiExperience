'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DEMO_PERSONAS } from '@/features/iel-demo/fixtures';
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

import { DemoDataBadge } from '../shared/ui';

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

function DemoBar() {
  const { state, dispatch, persona, resetDemo } = useIelDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const iel = routes.dashboard.iel;

  return (
    <div className="border-b border-dashed border-border bg-muted/60">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-2 px-4 py-2 text-xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <DemoDataBadge />
          <span className="text-muted-foreground">
            Ambiente de demonstração: nenhuma mensagem é enviada e nenhum
            sistema externo é alterado.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label
            htmlFor="demo-persona"
            className="font-medium text-foreground"
          >
            Visualizar como — demonstração
          </label>
          <FilterNativeSelect
            id="demo-persona"
            className="h-8 w-60 text-xs"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowScript(true)}
          >
            Roteiro da demonstração
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmReset(true)}
          >
            Reiniciar demonstração
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
        header="Roteiro principal"
        description="Sete passos para percorrer a jornada completa."
      >
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
            Criar a pergunta ao gestor sobre apoio inicial, abrir a experiência
            do destinatário em{' '}
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
        <p className="mt-4 text-xs text-muted-foreground">
          Estado atual: {state.clarifications.length} solicitações registradas,{' '}
          {state.referrals.length} encaminhamento(s).
        </p>
      </Dialog>
    </div>
  );
}

/** Casca da Central IEL: barra de demonstração, navegação e conteúdo. */
export function IelShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navItems = useNavItems();
  const { persona } = useIelDemo();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DemoBar />
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Central de Seleção e Compatibilidade IEL
            </p>
            <p className="text-xs text-muted-foreground">
              {persona.kind === 'analista'
                ? 'Reúne dados de talentos, vagas e empresas para conduzir uma seleção fundamentada.'
                : persona.description}
            </p>
          </div>
          <nav aria-label="Navegação principal">
            <ul className="flex flex-wrap gap-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== routes.dashboard.iel.index &&
                    pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-[var(--control-radius)] px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                        isActive
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        size={16}
                        aria-hidden="true"
                      />
                      {item.label}
                      {item.badge ? (
                        <span className="rounded-[var(--radius-pill)] bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-border bg-card px-4 py-3">
        <p className="mx-auto max-w-[1600px] text-[11px] text-muted-foreground">
          Protótipo de demonstração do IEL. Empresas, pessoas e avaliações são
          fictícias. Integrações com sistemas de recrutamento e avaliação seriam
          conectadas depois: aqui elas aparecem como fontes simuladas.
        </p>
      </footer>
    </div>
  );
}
