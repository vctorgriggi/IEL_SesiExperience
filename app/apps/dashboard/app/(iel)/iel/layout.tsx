import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { IelShell } from '@/components/iel-demo/layout/iel-shell';
import { IelDemoProvider } from '@/features/iel-demo/state/demo-provider';

import './iel-theme.css';

/**
 * Tipografia da Central: Geist, a família que o shadcn usa nos blocks. O
 * dashboard sobrescreve o tema com Nunito; aqui a diretriz aprovada é a
 * aparência de fábrica, e a hierarquia vem de peso e espaçamento.
 */
const geistSans = Geist({
  subsets: ['latin', 'latin-ext'],
  variable: '--iel-font-sans',
  display: 'swap'
});

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
    <div className={geistSans.variable}>
      <IelDemoProvider>
        <IelShell>{children}</IelShell>
      </IelDemoProvider>
    </div>
  );
}
