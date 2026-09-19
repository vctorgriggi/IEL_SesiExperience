import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { IelShell } from '@/components/iel-demo/layout/iel-shell';
import { IelDemoProvider } from '@/features/iel-demo/state/demo-provider';

import './iel-theme.css';

/**
 * Tipografia da Central.
 *
 * O dashboard sobrescreve o tema com Nunito, uma sem-serifa arredondada que
 * soa acolhedora e genérica — num produto institucional cheio de dados densos
 * ela trabalha contra a leitura e contra a credibilidade. O próprio design
 * system já declara Inter e Source Serif 4; aqui a Central passa a usar o que
 * o tema pede.
 *
 * Inter para a interface: boa em corpo pequeno e com algarismos tabulares,
 * que importam numa tela cheia de contagens. Source Serif 4 para títulos e
 * números de destaque: dá peso institucional e cria a diferença de voz que
 * faltava entre o que é título e o que é dado.
 */
const interSans = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--iel-font-sans',
  display: 'swap'
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  variable: '--iel-font-serif',
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
    <div className={`${interSans.variable} ${sourceSerif.variable}`}>
      <IelDemoProvider>
        <IelShell>{children}</IelShell>
      </IelDemoProvider>
    </div>
  );
}
