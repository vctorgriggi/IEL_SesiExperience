import Link from 'next/link';
import { Mail01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { routes } from '@workspace/routes';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  type CardProps
} from '@workspace/ui';

export type MagicLinkCheckEmailCardProps = CardProps;

export function MagicLinkCheckEmailCard({
  className,
  ...other
}: MagicLinkCheckEmailCardProps) {
  return (
    <Card
      className={cn(
        'w-full max-w-lg mx-auto px-8 py-10 border border-border shadow-md bg-background',
        className
      )}
      {...other}
    >
      <CardHeader className="text-center pb-8">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <HugeiconsIcon
            icon={Mail01Icon}
            size={24}
            className="text-primary"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          Verifique seu email
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-2">
          Enviamos um link de acesso para seu email. Clique no link para entrar
          na sua conta. O link expira em 24 horas.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-1 pb-6">
        <p className="text-sm text-muted-foreground text-center">
          Nao recebeu o email? Verifique sua caixa de spam ou tente novamente.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <Link
          href={routes.dashboard.auth.signIn}
          className="underline"
        >
          Voltar para o login
        </Link>
      </CardFooter>
    </Card>
  );
}
