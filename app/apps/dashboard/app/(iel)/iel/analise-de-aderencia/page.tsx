import { Suspense } from 'react';
import type { Metadata } from 'next';
import { TelaDeAderencia } from '@/components/iel-demo/aderencia/tela-de-aderencia';

import { Skeleton } from '@workspace/ui';

export const metadata: Metadata = { title: 'Análise de aderência' };

export default function IelAnaliseDeAderenciaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TelaDeAderencia />
    </Suspense>
  );
}
