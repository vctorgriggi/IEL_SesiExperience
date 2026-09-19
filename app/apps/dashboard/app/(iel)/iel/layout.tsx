import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { IelShell } from '@/components/iel-demo/layout/iel-shell';
import { IelDemoProvider } from '@/features/iel-demo/state/demo-provider';

import './iel-theme.css';

/**
 * Tipografia da Central: Inter em tudo. O dashboard sobrescreve o tema com
 * Nunito; o design system declara Inter, e é o que a categoria de produto
 * usa. A hierarquia vem de peso e espaçamento, não de troca de família.
 */
const interSans = Inter({
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
    <div className={interSans.variable}>
      <IelDemoProvider>
        <IelShell>{children}</IelShell>
      </IelDemoProvider>
    </div>
  );
}
