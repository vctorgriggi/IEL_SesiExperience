'use client';

import Link from 'next/link';

import { routes } from '@workspace/routes';
import { Alert, Button, Card } from '@workspace/ui';

export default function IelDemoError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="gap-3">
      <h1 className="text-lg font-semibold text-foreground">
        Algo falhou nesta tela da demonstração
      </h1>
      <Alert variant="destructive">
        {error.message || 'Erro inesperado no protótipo.'}
      </Alert>
      <p className="text-sm text-muted-foreground">
        Os dados locais da demonstração foram preservados. Você pode tentar
        novamente ou voltar para a visão geral.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={reset}>Tentar novamente</Button>
        <Link href={routes.dashboard.iel.index}>
          <Button variant="outline">Voltar para a visão geral</Button>
        </Link>
      </div>
    </Card>
  );
}
