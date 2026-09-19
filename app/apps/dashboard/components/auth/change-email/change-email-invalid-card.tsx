import { AuthCardLayout, type AuthCardLayoutProps } from '@workspace/ui';

export function ChangeEmailInvalidCard({
  className,
  ...other
}: Omit<AuthCardLayoutProps, 'title' | 'description' | 'children' | 'footer'>) {
  return (
    <AuthCardLayout
      variant="centered"
      title="Solicitação de alteração inválida"
      description="Sua solicitação de alteração de email não é válida. Isso pode ocorrer se você enviou várias solicitações (cada uma invalida as anteriores) ou se você já alterou seu email."
      className={className}
      {...other}
    />
  );
}
