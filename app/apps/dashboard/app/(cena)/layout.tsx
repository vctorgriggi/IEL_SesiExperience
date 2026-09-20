import type { PropsWithChildren } from 'react';
import type { Metadata, Viewport } from 'next';
import { Red_Hat_Display } from 'next/font/google';
import {
  estadoCompartilhadoLigado,
  SALA_PADRAO
} from '@/features/iel-demo/state/config';
import { IelDemoProvider } from '@/features/iel-demo/state/demo-provider';
import { lerSala } from '@/features/iel-demo/state/servidor';

import '../(iel)/iel-theme.css';

/*
 * A mesma tipografia da marca que a área do Mind RH usa: o questionário que
 * abre dentro do celular é o componente real, e ele conta com a variável
 * `--iel-font-sans` no ancestral.
 */
const redHatDisplay = Red_Hat_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--iel-font-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  title: { default: 'Mind RH', template: '%s · Mind RH' },
  robots: { index: false, follow: false },
  icons: { icon: '/marca/simbolo.png' }
};

/*
 * A cena é desenhada para o telão e não rola: a cor da barra do navegador
 * no celular acompanha o azul-noite do palco.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12182B'
};

/**
 * Grupo do palco: as cenas de apresentação, sem barra lateral e sem a porta
 * da analista.
 *
 * Fica fora de `(iel)` de propósito. Aquele layout põe a casca do produto e
 * exige a sessão da analista em tudo que não chega por link; a cena é tela
 * cheia e conta uma história para quem assiste — não tem menu nem senha,
 * como as telas do candidato. O que ela compartilha com o produto é só o
 * que precisa: o tema, a fonte e o estado da sala, porque o questionário que
 * abre no terceiro ato é o mesmo que o candidato responde, gravando no mesmo
 * lugar que a mesa da analista lê.
 */
export default async function CenaLayout({ children }: PropsWithChildren) {
  const compartilhado = estadoCompartilhadoLigado();
  let estadoInicial: Awaited<ReturnType<typeof lerSala>> | null = null;
  if (compartilhado) {
    try {
      estadoInicial = await lerSala(SALA_PADRAO);
    } catch (erro) {
      console.warn('[iel] estado compartilhado indisponível; modo local', erro);
    }
  }

  return (
    <div className={redHatDisplay.variable}>
      <IelDemoProvider
        compartilhado={compartilhado && estadoInicial !== null}
        estadoInicial={estadoInicial}
      >
        {children}
      </IelDemoProvider>
    </div>
  );
}
