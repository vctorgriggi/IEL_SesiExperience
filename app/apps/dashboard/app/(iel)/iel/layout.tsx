import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { IelShell } from '@/components/iel-demo/layout/iel-shell';
import { IelDemoProvider } from '@/features/iel-demo/state/demo-provider';

import './iel-theme.css';

export const metadata: Metadata = {
  title: 'Central de Seleção IEL — demonstração',
  description:
    'Protótipo navegável: reúne dados de talentos, vagas e empresas para conduzir uma seleção fundamentada. Base fictícia.',
  robots: { index: false, follow: false }
};

/**
 * Área isolada do protótipo IEL: dados fictícios, estado local no navegador e
 * nenhum acesso às rotas autenticadas do produto.
 */
export default function IelDemoLayout({ children }: PropsWithChildren) {
  return (
    <IelDemoProvider>
      <IelShell>{children}</IelShell>
    </IelDemoProvider>
  );
}
