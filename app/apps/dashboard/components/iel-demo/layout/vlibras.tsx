'use client';

import Script from 'next/script';

/**
 * VLibras: tradução do conteúdo da tela para Libras, por um avatar.
 *
 * É o widget oficial do Governo Federal (vlibras.gov.br), gratuito — não
 * quebra o custo marginal zero (R7). Entra em todas as telas do /iel, mas é
 * no link do candidato e do colaborador que ele mais importa: o público
 * operacional tem baixo letramento digital (R10), e parte dele é surda.
 *
 * Privacidade: o avatar só é baixado quando a pessoa aperta o botão, e só o
 * trecho que ela escolhe traduzir vai ao serviço do governo. Nada sai sem
 * ação de quem está usando.
 *
 * A versão atual do plugin (7.x) desenha o próprio botão, num shadow DOM
 * fixo no meio da lateral direita — não precisa do markup `vw` das versões
 * antigas, e não disputa o canto de baixo com o "Pergunte ao Mind".
 */
const VLIBRAS_APP = 'https://vlibras.gov.br/app';

type VLibrasWindow = Window & {
  VLibras?: { Widget: new (rootPath: string) => unknown };
};

export function VLibras() {
  return (
    <Script
      src={`${VLIBRAS_APP}/vlibras-plugin.js`}
      strategy="lazyOnload"
      onReady={() => {
        // O plugin guarda o próprio estado e ignora chamadas repetidas, então
        // navegar entre telas do /iel não duplica o botão.
        const janela = window as VLibrasWindow;
        if (janela.VLibras) new janela.VLibras.Widget(VLIBRAS_APP);
      }}
    />
  );
}
