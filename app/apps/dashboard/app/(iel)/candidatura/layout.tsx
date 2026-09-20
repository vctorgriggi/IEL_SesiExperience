import type { PropsWithChildren } from 'react';
import { Atkinson_Hyperlegible } from 'next/font/google';

/*
 * A exceção justificada da tipografia: as telas do candidato.
 *
 * Atkinson Hyperlegible foi desenhada pelo Braille Institute para baixa
 * visão, com os caracteres deliberadamente diferentes entre si — o `1`, o
 * `l` e o `I` não se confundem, nem o `0` e o `O`. O público que responde o
 * questionário tem baixo letramento digital (R10) e responde pelo celular,
 * muitas vezes no sol; aqui a escolha de fonte é decisão de acessibilidade,
 * com autor e propósito, não preferência.
 *
 * O escopo é este layout e só ele: `data-iel-acessivel` troca `--font-sans`
 * por Atkinson e põe o piso de 16px (ver `iel-theme.css`). Assim o
 * questionário, a conversa e "Minha candidatura" herdam a fonte e a escala
 * sem que nenhum componente precise saber disso — é o mesmo "componente de
 * fábrica" do resto do tema. As telas da analista continuam em Inter.
 *
 * Só 400 e 700: a fonte não é variável, e dois pesos é o que a escala do
 * candidato usa (pergunta em 700, o resto em 400).
 */
const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '700'],
  variable: '--iel-font-acess',
  display: 'swap'
});

export default function CandidaturaLayout({ children }: PropsWithChildren) {
  return (
    <div
      data-iel-acessivel=""
      className={atkinson.variable}
    >
      {children}
    </div>
  );
}
