import { Suspense } from 'react';
import type { Metadata } from 'next';
import { CandidatosScreen } from '@/components/iel-demo/metricas/candidatos-screen';

import { Skeleton } from '@workspace/ui';

export const metadata: Metadata = { title: 'Questionários' };

/**
 * A tela lê `?aba=` para abrir direto na aba pedida (Simples ou Análise),
 * então precisa do limite de suspensão que o `useSearchParams` exige.
 */
export default function IelCandidatosPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CandidatosScreen />
    </Suspense>
  );
}
