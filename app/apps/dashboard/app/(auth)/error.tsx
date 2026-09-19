'use client';

import Link from 'next/link';

import { useCaptureError } from '@workspace/monitoring/hooks/use-capture-error';
import { routes } from '@workspace/routes';
import { Button } from '@workspace/ui';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AuthError({ error, reset }: ErrorProps) {
  useCaptureError(error);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold text-foreground">
        Erro na página de autenticação
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Algo deu errado. Tente novamente ou volte ao início.
      </p>
      <div className="flex gap-2">
        <Button
          onClick={reset}
          severity="secondary"
          outlined
        >
          Tentar novamente
        </Button>
        <Link href={routes.dashboard.auth.signIn}>Entrar</Link>
      </div>
    </div>
  );
}
