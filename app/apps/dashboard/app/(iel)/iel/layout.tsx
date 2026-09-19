import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Red_Hat_Display } from 'next/font/google';
import { IelShell } from '@/components/iel-demo/layout/iel-shell';
import { IelDemoProvider } from '@/features/iel-demo/state/demo-provider';

import './iel-theme.css';

/**
 * Tipografia do manual de marca (docs/marca): Red Hat Display, 500 para
 * interface e 700 para títulos. O dashboard sobrescreve o tema com Nunito;
 * aqui a fonte entra pela variável que o tema escopado consome.
 */
const redHatDisplay = Red_Hat_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--iel-font-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Mind RH — Central de Seleção IEL',
  description:
    'Protótipo navegável: reúne dados de talentos, vagas e empresas para conduzir uma seleção fundamentada. Base fictícia.',
  robots: { index: false, follow: false },
  icons: { icon: '/marca/simbolo.png' }
};

/**
 * Área isolada do protótipo IEL: dados fictícios, estado local no navegador e
 * nenhum acesso às rotas autenticadas do produto.
 */
export default function IelDemoLayout({ children }: PropsWithChildren) {
  return (
    <div className={redHatDisplay.variable}>
      <IelDemoProvider>
        <IelShell>{children}</IelShell>
      </IelDemoProvider>
    </div>
  );
}
