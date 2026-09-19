'use client';

import { useRouter } from 'next/navigation';
import {
  resendInvitation,
  revokeInvitation,
  updateInvitationRole
} from '@/features/invitations/actions';
import type { Invitation } from '@/features/invitations/types';
import { runSafeAction } from '@/lib/run-safe-action';

import { Button, toast } from '@workspace/ui';

type InvitationsListProps = {
  canManage: boolean;
  initialInvitations: Invitation[];
};

export function InvitationsList({
  canManage,
  initialInvitations
}: InvitationsListProps) {
  const router = useRouter();

  const forbiddenMessage = 'Sem permissão para gerenciar convites.';
  const toErrorMessage = (err: unknown, fallback: string): string => {
    const msg = err instanceof Error ? err.message : fallback;
    return /forbidden|insufficient permissions/i.test(msg)
      ? forbiddenMessage
      : msg;
  };

  const handleResend = async (invitationId: string) => {
    try {
      await runSafeAction(
        resendInvitation({
          invitationId
        })
      );
      toast.success('Convite reenviado');
      router.refresh();
    } catch (err) {
      toast.error(toErrorMessage(err, 'Erro ao reenviar'));
    }
  };

  const handleRevoke = async (invitationId: string) => {
    try {
      await runSafeAction(
        revokeInvitation({
          invitationId
        })
      );
      toast.success('Convite revogado');
      router.refresh();
    } catch (err) {
      toast.error(toErrorMessage(err, 'Erro ao revogar'));
    }
  };

  const handleChangeRole = async (
    invitationId: string,
    role: 'member' | 'admin'
  ) => {
    try {
      await runSafeAction(
        updateInvitationRole({
          invitationId,
          role
        })
      );
      toast.success('Função atualizada');
      router.refresh();
    } catch (err) {
      toast.error(toErrorMessage(err, 'Erro ao atualizar'));
    }
  };

  const invitations = initialInvitations;

  return (
    <>
      <h3 className="font-bold text-muted-foreground">Convites pendentes</h3>
      <p className="text-sm text-muted-foreground">
        Convites aguardando aceite. Reenvie ou revogue quando quiser.
      </p>
      {invitations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
          <svg
            className="h-10 w-10 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <p className="text-sm text-muted-foreground">
            Nenhum convite pendente.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/80">
          {invitations.map((invitation) => (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"
            >
              <div>
                <div className="font-medium text-foreground">
                  {invitation.email}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  {invitation.role === 'admin' ? (
                    <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Admin
                    </span>
                  ) : (
                    <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Membro
                    </span>
                  )}
                  {invitation.lastSentAt && (
                    <span className="text-xs text-muted-foreground">
                      Enviado em{' '}
                      {new Date(invitation.lastSentAt).toLocaleDateString(
                        'pt-BR'
                      )}
                    </span>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex flex-wrap items-center gap-2">
                  {invitation.role === 'admin' ? (
                    <Button
                      severity="info"
                      outlined
                      onClick={() =>
                        void handleChangeRole(invitation.id, 'member')
                      }
                    >
                      Rebaixar
                    </Button>
                  ) : (
                    <Button
                      severity="info"
                      onClick={() =>
                        void handleChangeRole(invitation.id, 'admin')
                      }
                    >
                      Tornar admin
                    </Button>
                  )}
                  <Button
                    severity="secondary"
                    outlined
                    onClick={() => void handleResend(invitation.id)}
                  >
                    Reenviar
                  </Button>
                  <Button
                    severity="secondary"
                    outlined
                    onClick={() => void handleRevoke(invitation.id)}
                  >
                    Revogar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
