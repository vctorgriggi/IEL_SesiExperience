'use client';

import Link from 'next/link';
import { COPY } from '@/features/iel-demo/copy';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplicationsByTalent,
  getReferralListSelection,
  REFERRAL_LIMIT
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Application, Job, Talent } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import { toast } from '@workspace/ui';
import { Avatar, AvatarFallback } from '@workspace/ui/shadcn/avatar';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '@workspace/ui/shadcn/drawer';
import { useIsMobile } from '@workspace/ui/use-mobile';

import { SimularEnvioButton } from '../chat/simular-envio-dialog';
import { TalentFitView } from './talent-fit-view';

/** "Ana Ribeiro" vira "AR": duas letras bastam para o avatar. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima =
    partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return `${primeira}${ultima}`.toUpperCase();
}

/**
 * A pessoa em gaveta, sobre a lista da vaga.
 *
 * A decisão que a tela pede — marcar ou não para envio — é comparativa: quem
 * abre um perfil está escolhendo entre cinco. Navegar para outra página para
 * ler um perfil e voltar perdia a lista, a posição e a marcação em curso. A
 * gaveta mantém as duas coisas na mesma tela; no celular ela sobe de baixo,
 * porque 640px de lateral não cabem em 390.
 */
export function TalentDrawer({
  job,
  talent,
  application,
  open,
  onOpenChange
}: {
  job: Job;
  talent: Talent;
  application: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { state, dispatch } = useIelDemo();
  const isMobile = useIsMobile();
  const iel = routes.dashboard.iel;

  const referralList = getReferralListSelection(state, job.id);
  const naLista = referralList.includes(application.id);
  const listaCheia = referralList.length >= REFERRAL_LIMIT;
  const candidaturas = getApplicationsByTalent(state, talent.id).length;

  const marcar = () => {
    if (naLista) {
      dispatch({
        type: 'remove-from-referral-list',
        jobId: job.id,
        applicationId: application.id,
        at: nowIso()
      });
      return;
    }
    if (listaCheia) {
      toast.error(COPY.referral.limit);
      return;
    }
    dispatch({
      type: 'add-to-referral-list',
      jobId: job.id,
      applicationId: application.id,
      at: nowIso()
    });
    toast.success(`${talent.name} entrou na lista desta vaga.`);
  };

  return (
    <Drawer
      direction={isMobile ? 'bottom' : 'right'}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-[640px]">
        <DrawerHeader className="flex-row items-center gap-3 border-b text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <Avatar className="size-10">
            <AvatarFallback className="text-[13px] font-semibold">
              {iniciais(talent.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DrawerTitle className="text-lg tracking-tight">
              {talent.name}
            </DrawerTitle>
            <DrawerDescription className="text-[13px]">
              {talent.headline} · {talent.city} ·{' '}
              {plural(candidaturas, 'candidatura', 'candidaturas')}
            </DrawerDescription>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 text-sm">
          <TalentFitView
            job={job}
            talent={talent}
            application={application}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
          <Link
            href={iel.talents.byId(talent.id).inJob(job.id)}
            className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
          >
            Abrir perfil completo →
          </Link>
          <div className="flex flex-wrap gap-2">
            {/* A empresa fica de fora da mensagem de propósito (R5). */}
            <SimularEnvioButton
              destinatario="candidato"
              link={iel.applications.byId(application.id).conversation}
              contexto={{ atividade: job.title, cidade: job.location }}
            />
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={iel.applications.byId(application.id).fit}>
                {COPY.questions.ask}
              </Link>
            </Button>
            <Button
              size="sm"
              onClick={marcar}
            >
              {naLista ? 'Tirar da remessa' : 'Marcar para envio'}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
