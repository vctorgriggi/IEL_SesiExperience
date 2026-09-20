import type { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Archivo, Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { IelShell } from '@/components/iel-demo/layout/iel-shell';
import { VLibras } from '@/components/iel-demo/layout/vlibras';
import {
  acessoExigeSenha,
  temSessaoDaAnalista
} from '@/features/iel-demo/acesso/sessao';
import {
  estadoCompartilhadoLigado,
  SALA_PADRAO
} from '@/features/iel-demo/state/config';
import { IelDemoProvider } from '@/features/iel-demo/state/demo-provider';
import { lerSala } from '@/features/iel-demo/state/servidor';

import { routes } from '@workspace/routes';

import './iel-theme.css';

/*
 * Tipografia do produto: duas famílias, papéis separados.
 *
 * Archivo nos títulos e nos números de destaque. É grotesca de origem
 * editorial, desenhada para título e para tabela, e tem eixo de largura
 * variável: o título sai levemente expandido (`font-stretch: 112%`, no
 * `iel-theme.css`) e ganha presença sem trocar de família. Algarismo
 * tabular nativo, que é o que a coluna de percentual exige.
 *
 * Inter na interface, no corpo, na tabela e no formulário. Altura de x alta
 * e formas abertas entre 12 e 14px — o tamanho em que a analista passa o dia
 * —, e nenhuma personalidade para cansar a tela.
 *
 * Red Hat Display sai do CSS e continua só na marca: a logo e a assinatura
 * são imagem (`public/marca/`), não texto, então não há fonte a carregar
 * por elas. O Atkinson Hyperlegible do questionário é carregado no layout
 * de `candidatura/`, onde é a única tela que o usa.
 *
 * Pelo `next/font` e não pelo `<link>` do Google: a fonte é servida do
 * próprio domínio, sem requisição a terceiro (privacidade) e sem salto de
 * layout. `display: swap` e a pilha de reserva ficam mantidos — em máquina
 * sem a fonte e sem rede, o produto cai em Segoe UI e continua legível.
 */
const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  // Variável: o eixo `wdth` só existe assim, e é ele que dá o título em 112%.
  axes: ['wdth'],
  variable: '--iel-font-display',
  display: 'swap'
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--iel-font-sans',
  display: 'swap'
});

export const metadata: Metadata = {
  // Cada página diz a tarefa no título da aba ("Questionário da vaga · Mind
  // RH"): é a primeira coisa que o leitor de tela anuncia ao abrir o link.
  title: {
    default: 'Mind RH — Central de Seleção IEL',
    template: '%s · Mind RH'
  },
  description:
    'Central de Seleção do IEL: reúne dados de talentos, vagas e empresas para conduzir uma seleção fundamentada.',
  robots: { index: false, follow: false },
  icons: { icon: '/marca/simbolo.png' }
};

/**
 * Área do Mind RH, que serve a raiz do app: dados fictícios, estado local no
 * navegador e nenhum acesso às rotas autenticadas do kit.
 */
/*
 * Rotas abertas: quem entra por link não tem senha nem cadastro (R9, R10).
 * O candidato responde o questionário, o colaborador responde a consulta da
 * empresa e o RH abre o relatório da remessa. Todo o resto é da analista.
 */
const SENTINELA = '__id__';

function prefixo(caminho: string): string {
  return caminho.slice(0, caminho.indexOf(SENTINELA));
}

/*
 * Prefixos das telas por link. Cada um termina na barra antes do
 * identificador ("/candidatura/"), então nunca é só "/": com o produto na
 * raiz, um prefixo vazio deixaria o portão aberto para tudo.
 */
const PREFIXOS_ABERTOS = [
  /*
   * A candidatura inteira: "Minha candidatura", o questionário e a conversa.
   * O prefixo para antes do identificador, então as três telas entram juntas
   * — e é assim que precisa ser: a pessoa que respondeu por link tem de poder
   * voltar pelo mesmo link para saber em que pé está.
   */
  prefixo(routes.dashboard.iel.applications.byId(SENTINELA).index),
  prefixo(routes.dashboard.iel.cultureInvite.byToken(SENTINELA)),
  prefixo(routes.dashboard.iel.report.byToken(SENTINELA))
];

function ehRotaAberta(pathname: string): boolean {
  // A porta compara exato: é uma tela só, sem filhas.
  if (pathname === routes.dashboard.iel.signIn) return true;
  return PREFIXOS_ABERTOS.some((rota) => pathname.startsWith(rota));
}

export default async function IelDemoLayout({ children }: PropsWithChildren) {
  // O middleware carimba o caminho no cabeçalho: é como um layout de
  // servidor sabe em qual rota está sem virar componente de cliente.
  const pathname = (await headers()).get('x-pathname') ?? '';
  if (!ehRotaAberta(pathname) && !(await temSessaoDaAnalista())) {
    redirect(routes.dashboard.iel.signIn);
  }

  /*
   * Com banco e `IEL_ESTADO_COMPARTILHADO=1`, o estado da demonstração mora
   * no servidor e é o mesmo em todos os aparelhos: a resposta dada no celular
   * do candidato aparece no notebook da analista. Sem isso, fica no navegador,
   * como sempre foi. Se o banco falhar na leitura, a página não cai — a demo
   * segue no modo local, e o aviso fica no log do servidor.
   */
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
    /*
     * As duas variáveis, mais a `className` da Inter e a utilitária
     * `font-sans`.
     *
     * A `className` não é redundante com a variável, e foi o `011783f` que
     * mostrou por quê: só a variável deixava a família chegar pelo token, e o
     * token é lido por uma regra de CSS que ainda não valeu antes da
     * hidratação. Nesse intervalo a cascata caía no `ui-sans-serif`. A
     * `className` põe `font-family` no próprio elemento, então a família vale
     * na árvore inteira desde a primeira pintura.
     *
     * Inter é a que entra na `className` porque é a família da interface — a
     * base da cascata. Archivo só aparece onde a escala pede (título, número,
     * rótulo), e chega lá pelo token `--font-display`.
     */
    <div
      className={`${archivo.variable} ${inter.variable} ${inter.className} font-sans`}
    >
      <IelDemoProvider
        compartilhado={compartilhado && estadoInicial !== null}
        estadoInicial={estadoInicial}
      >
        <IelShell podeSair={acessoExigeSenha()}>{children}</IelShell>
      </IelDemoProvider>
      <VLibras />
    </div>
  );
}
