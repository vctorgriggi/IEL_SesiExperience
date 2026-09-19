'use client';

import { useCaptureError } from '@workspace/monitoring/hooks/use-capture-error';
import { Button } from '@workspace/ui';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ProtectedError({ error, reset }: ErrorProps) {
  useCaptureError(error);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <h2 className="text-lg font-semibold text-foreground">Algo deu errado</h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        Ocorreu um erro ao carregar esta página. Tente novamente.
      </p>
      <Button
        onClick={reset}
        variant="outline"
      >
        Tentar novamente
      </Button>
    </div>
  );
}
