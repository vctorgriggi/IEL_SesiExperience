import Link from 'next/link';

import { routes } from '@workspace/routes';
import { AuthCardLayout, linkClass } from '@workspace/ui';

import { AUTH_CARD_CLASS, AuthShell } from '~/components/auth/auth-shell';

export const metadata = { title: 'Link enviado' };

type Props = { searchParams: Promise<{ email?: string }> };

export default async function ForgotPasswordSuccessPage({
  searchParams
}: Props) {
  const { email } = await searchParams;

  return (
    <AuthShell>
      <AuthCardLayout
        className={AUTH_CARD_CLASS}
        variant="centered"
        title="Verifique seu email"
        description={
          email
            ? `Se existir uma conta para ${email}, o link de redefinição chegou lá.`
            : 'Se existir uma conta para esse email, o link de redefinição chegou lá.'
        }
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href={routes.aiChat.signIn}
              className={linkClass}
            >
              Voltar para o login
            </Link>
          </p>
        }
      >
        <p className="text-sm text-muted-foreground">
          O link vale por algumas horas. Não achou? Confira o spam.
        </p>
      </AuthCardLayout>
    </AuthShell>
  );
}
