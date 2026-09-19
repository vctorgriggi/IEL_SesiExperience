'use client';

import { useState } from 'react';
import { sair } from '@/app/(iel)/iel/entrar/actions';
import { DEMO_PERSONAS } from '@/features/iel-demo/fixtures';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { LogOut, MoreVertical, RotateCcw, UserCog } from 'lucide-react';

import { toast } from '@workspace/ui';
import { Avatar, AvatarFallback } from '@workspace/ui/shadcn/avatar';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/shadcn/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@workspace/ui/shadcn/sidebar';

/** Iniciais do nome da persona, para o avatar. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima =
    partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return `${primeira}${ultima}`.toUpperCase();
}

/**
 * O rodapé da barra é quem opera a demonstração.
 *
 * A faixa amarela de andaime sumiu: trocar o recorte de dados e reiniciar a
 * base são ações de quem apresenta, e cabem onde um produto de verdade
 * guarda as ações da conta.
 */
export function NavUser({ podeSair }: { podeSair: boolean }) {
  const { state, dispatch, persona, resetDemo } = useIelDemo();
  const { isMobile } = useSidebar();
  const [confirmarReset, setConfirmarReset] = useState(false);

  const nome = persona.label;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {iniciais(nome)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{nome}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {persona.kind} · demonstração
                </span>
              </div>
              <MoreVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
              <UserCog className="size-3.5" />
              Ver como
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={persona.id}
              onValueChange={(value) => {
                dispatch({ type: 'set-persona', personaId: value });
                toast.info(
                  'Recorte de dados alterado. Isso é uma simulação de visão, não autenticação.'
                );
              }}
            >
              {DEMO_PERSONAS.map((option) => (
                <DropdownMenuRadioItem
                  key={option.id}
                  value={option.id}
                >
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />
            {podeSair ? (
              <DropdownMenuItem
                onSelect={() => {
                  void sair();
                }}
              >
                <LogOut />
                Sair da Central
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={() => setConfirmarReset(true)}>
              <RotateCcw />
              Reiniciar demonstração
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog
        open={confirmarReset}
        onOpenChange={setConfirmarReset}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reiniciar a demonstração?</DialogTitle>
            <DialogDescription>
              Todo o progresso local (esclarecimentos, listas e encaminhamentos)
              volta ao estado inicial da base fictícia.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            A base volta a ter 3 empresas, 3 vagas, 8 talentos, 10 candidaturas
            e 2 solicitações de esclarecimento em aberto. Agora há{' '}
            {state.clarifications.length} solicitações registradas.
          </p>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmarReset(false)}
            >
              Manter como está
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                resetDemo();
                setConfirmarReset(false);
                toast.success('Demonstração reiniciada com a base inicial.');
              }}
            >
              Reiniciar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  );
}
