import { AuthCardLayout, type AuthCardLayoutProps } from '@workspace/ui';

export function ChangeEmailExpiredCard({
  className,
  ...other
}: Omit<AuthCardLayoutProps, 'title' | 'description' | 'children' | 'footer'>) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Solicitação de alteração expirada"
      description="Sua solicitação de alteração de email já expirou. Solicite novamente a alteração de email."
      className={className}
      {...other}
    />
  );
}
