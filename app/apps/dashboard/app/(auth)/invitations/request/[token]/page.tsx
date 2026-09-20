import Link from 'next/link';
import { validateInvitationToken } from '@/features/invitations/data/validate-invitation-token';

import { dedupedAuth } from '@workspace/auth';
import { routes } from '@workspace/routes';
import { AuthCardLayout, cn, linkClass } from '@workspace/ui';

import { AcceptInvitationButton } from './accept-invitation-button';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  member: 'Membro',
  ADMIN: 'Administrador',
  MEMBER: 'Membro'
};

export default async function InvitationRequestPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const session = await dedupedAuth();
  const validation = await validateInvitationToken(token);

  const invitationCallbackUrl = routes.dashboard.invitations.request(token);
  const signUpHref =
    `${routes.dashboard.auth.signUp}?callbackUrl=${encodeURIComponent(invitationCallbackUrl)}` +
    (validation.valid && validation.email
      ? `&email=${encodeURIComponent(validation.email)}`
      : '');

  if (!session) {
    return (
      <AuthCardLayout
        variant="centered"
        title="Convite para organização"
        description="Você precisa estar conectado para aceitar este convite."
        footer={
          <>
            <span className="pr-2">Já tem uma conta?</span>
            <Link
              href={`${routes.dashboard.auth.signIn}?callbackUrl=${encodeURIComponent(invitationCallbackUrl)}`}
              className={linkClass}
            >
              Fazer login
            </Link>
          </>
        }
      >
        <Link
          href={signUpHref}
          className={cn({ size: 'small' }, 'w-full')}
        >
          Criar conta
        </Link>
      </AuthCardLayout>
    );
  }

  if (!validation.valid) {
    return (
      <AuthCardLayout
        variant="centered"
        title="Convite inválido"
        description="Este convite expirou ou não existe mais."
      >
        <Link
          href={routes.dashboard.painel}
          className="w-full"
        >
          Ir para organizações
        </Link>
      </AuthCardLayout>
    );
  }

  const roleLabel = ROLE_LABELS[validation.role] ?? validation.role;

  return (
    <AuthCardLayout
      variant="centered"
      title="Convite para organização"
      description={
        <>
          Você foi convidado para <strong>{validation.organizationName}</strong>{' '}
          como <strong>{roleLabel}</strong>. Aceitar o convite?
        </>
      }
      footer={
        <Link
          href={routes.dashboard.painel}
          className={linkClass}
        >
          Recusar e voltar
        </Link>
      }
    >
      <div className="flex flex-col gap-3">
        {error === 'email_mismatch' && (
          <p className="text-sm text-destructive">
            O e-mail da sua conta não corresponde ao e-mail convidado.
          </p>
        )}
        {error === 'member_limit' && (
          <p className="text-sm text-destructive">
            Esta organização atingiu o limite de membros do plano. Peça ao
            administrador para fazer upgrade.
          </p>
        )}
        {error === 'invalid' && (
          <p className="text-sm text-destructive">
            Não foi possível aceitar o convite. Tente novamente.
          </p>
        )}
        <AcceptInvitationButton token={token} />
      </div>
    </AuthCardLayout>
  );
}
