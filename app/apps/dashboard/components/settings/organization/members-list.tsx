'use client';

import { useRouter } from 'next/navigation';
import { removeMember, updateMemberRole } from '@/features/members/actions';
import type { Member } from '@/features/members/types';
import { runSafeAction } from '@/lib/run-safe-action';

import { Button, toast } from '@workspace/ui';

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

type MembersListProps = {
  initialMembers: Member[];
  currentUserId: string;
};

export function MembersList({
  initialMembers,
  currentUserId
}: MembersListProps) {
  const router = useRouter();
  const members = initialMembers;

  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const isAdmin =
    currentUserMember?.role === 'admin' || currentUserMember?.isOwner;

  const handleChangeRole = async (
    memberId: string,
    role: 'member' | 'admin'
  ) => {
    try {
      await runSafeAction(
        updateMemberRole({
          memberId,
          role
        })
      );
      toast.success('Função atualizada');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await runSafeAction(
        removeMember({
          memberId
        })
      );
      toast.success('Membro removido');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover');
    }
  };

  return (
    <>
      <h3 className="font-bold text-muted-foreground">Membros da equipe</h3>
      <p className="text-sm text-muted-foreground">
        Quem tem acesso à organização.
      </p>
      <ul className="divide-y divide-border/80">
        {members.map((member) => (
          <li
            key={member.id}
            className="flex items-center justify-between gap-3 py-4 first:pt-0"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
                aria-hidden
              >
                {getInitials(member.name)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  {member.name}
                  {member.userId === currentUserId && (
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      você
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {member.email}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {member.isOwner ? (
                <span className="rounded-md border border-primary px-2 py-0.5 text-xs font-medium text-primary">
                  Proprietário
                </span>
              ) : member.role === 'admin' ? (
                <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Admin
                </span>
              ) : (
                <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Membro
                </span>
              )}
              {isAdmin &&
                !member.isOwner &&
                member.userId !== currentUserId && (
                  <>
                    {member.role === 'admin' ? (
                      <Button
                        severity="secondary"
                        onClick={() =>
                          void handleChangeRole(member.userId, 'member')
                        }
                      >
                        Rebaixar
                      </Button>
                    ) : (
                      <Button
                        outlined
                        onClick={() =>
                          void handleChangeRole(member.userId, 'admin')
                        }
                      >
                        Tornar admin
                      </Button>
                    )}
                    <Button
                      severity="danger"
                      onClick={() => void handleRemove(member.userId)}
                    >
                      Remover
                    </Button>
                  </>
                )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
