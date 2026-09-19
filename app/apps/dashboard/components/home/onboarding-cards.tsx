import Link from 'next/link';
import {
  getCreateEventPath,
  getEventsIndexPath
} from '@/features/events/routing/event-navigation';
import type { Permissions } from '@/features/members/permissions';
import {
  Add01Icon,
  Calendar01Icon,
  UserAdd01Icon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui';

export type HomeOnboardingCardsProps = {
  orgSlug?: string | null;
  permissions: Permissions;
};

export function HomeOnboardingCards({
  orgSlug,
  permissions
}: HomeOnboardingCardsProps) {
  return (
    <div>
      <div className="rounded-xl border border-border/80 bg-muted/30 px-6 py-8 md:px-8 md:py-10 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Comece a usar seu dashboard
        </h2>
        <p className="mt-3 text-base text-muted-foreground max-w-xl leading-relaxed">
          Crie seu primeiro evento, convide participantes e acompanhe as
          métricas aqui.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href={getCreateEventPath(orgSlug)}
          className={cn(
            'group flex flex-col rounded-xl border-2 border-primary/20 bg-card p-6',
            'transition-all duration-200 hover:border-primary/40 hover:bg-primary/5',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center text-primary">
              <HugeiconsIcon
                icon={Add01Icon}
                size={26}
              />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Criar primeiro evento
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Crie um evento, defina data e local e publique para começar.
          </p>
          <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity group-hover:opacity-90">
            <HugeiconsIcon
              icon={Add01Icon}
              size={16}
            />
            Criar evento
          </span>
        </Link>
        {permissions.inviteMembers && (
          <Link
            href={
              orgSlug
                ? routes.dashboard.org(orgSlug).settings.members
                : routes.dashboard.onboarding.index
            }
            className={cn(
              'group flex flex-col rounded-xl border bg-card p-6',
              'transition-all duration-200 hover:border-primary/30 hover:bg-muted/50',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            )}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center text-primary">
                <HugeiconsIcon
                  icon={UserAdd01Icon}
                  size={26}
                />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Convidar membros
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Convide sua equipe para a organização e gerencie acessos.
            </p>
            <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted hover:text-foreground">
              <HugeiconsIcon
                icon={UserAdd01Icon}
                size={16}
              />
              Convidar
            </span>
          </Link>
        )}
        <Link
          href={getEventsIndexPath(orgSlug)}
          className={cn(
            'group flex flex-col rounded-xl border bg-card p-6',
            'transition-all duration-200 hover:border-primary/30 hover:bg-muted/50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center text-primary">
              <HugeiconsIcon
                icon={Calendar01Icon}
                size={26}
              />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              Ver eventos
            </h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Acesse a lista de eventos e acompanhe os que já existem.
          </p>
          <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted hover:text-foreground">
            <HugeiconsIcon
              icon={Calendar01Icon}
              size={16}
            />
            Ver lista
          </span>
        </Link>
      </div>
    </div>
  );
}
