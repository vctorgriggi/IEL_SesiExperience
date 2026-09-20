'use client';

import {
  IconPlayerPlayFilled,
  IconPlayerStopFilled
} from '@tabler/icons-react';

import { Button } from '@workspace/ui/shadcn/button';

import { useMontado, useVoz } from './use-voz';

/**
 * "Ouvir a pergunta": o questionário lido em voz alta, para quem não lê.
 *
 * ## Por que isto existe
 *
 * O público do IEL é operacional, e parte dele não lê — ou lê com esforço
 * suficiente para desistir no meio de dez frases. Um instrumento que só
 * existe escrito exclui essa pessoa da vaga antes de ela responder qualquer
 * coisa. O botão lê a frase e, em seguida, os cinco degraus numerados: "para
 * responder, toque no número. Um: nada a ver comigo. Dois: pouco…".
 *
 * O número é a ponte. Ele é ditado e está escrito no degrau, então quem
 * ouviu "três" acha o três na tela sem precisar ler "mais ou menos".
 *
 * ## Por que o botão aparece para todo mundo
 *
 * Não há modo de acessibilidade a ligar. Quem tem baixo letramento digital
 * não encontra um botão escondido em configuração — e encontrá-lo exigiria
 * ler. O botão fica na tela, do mesmo tamanho dos outros alvos, para
 * qualquer candidato: quem lê ignora, quem não lê usa, e ninguém precisa se
 * declarar analfabeto para responder um questionário de vaga.
 *
 * ## O que o aparelho faz com isso
 *
 * `window.speechSynthesis`, pelo `useVoz` — o mesmo da conversa guiada.
 * Nenhum serviço cobrado por uso (R7), nada sai do aparelho, nada é gravado.
 * É só leitura: a tela não escuta a pessoa, porque gravar voz seria coletar
 * um dado que a finalidade não pede (LGPD, art. 6º, III).
 *
 * Sem sintetizador no aparelho o botão não aparece: um "Ouvir" que não toca
 * nada é pior do que nenhum. O `useMontado` segura a primeira pintura até a
 * hidratação, senão o servidor renderiza um botão que o navegador pode não
 * sustentar.
 */
export function OuvirAFrase({
  id,
  texto,
  className
}: {
  /** Identifica a fala: muda a cada frase, para o botão saber se é a dele. */
  id: string;
  /** O que será lido, já na ordem em que se ouve. */
  texto: string;
  className?: string;
}) {
  const montado = useMontado();
  const { disponivel, falandoId, falar, parar } = useVoz();

  if (!montado || !disponivel) return null;

  const falando = falandoId === id;

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className={className}
      // O estado é dito por palavra, e não só pelo ícone: quem usa o botão é
      // justamente quem não lê ícone como convenção.
      onClick={() => (falando ? parar() : falar(id, texto))}
    >
      {falando ? (
        <IconPlayerStopFilled aria-hidden="true" />
      ) : (
        <IconPlayerPlayFilled aria-hidden="true" />
      )}
      {falando ? 'Parar' : 'Ouvir a pergunta'}
    </Button>
  );
}

/**
 * O texto que o botão lê numa frase do instrumento.
 *
 * Monta pergunta e degraus na ordem em que se ouve, com pausa de ponto entre
 * eles — o sintetizador respeita pontuação, e sem ela os cinco rótulos saem
 * numa tirada só, impossível de acompanhar.
 */
export function falaDaFrase({
  cena,
  rotulos
}: {
  cena: string;
  rotulos: { valor: number; rotulo: string }[];
}): string {
  const degraus = rotulos
    .map((degrau) => `${degrau.valor}: ${degrau.rotulo}.`)
    .join(' ');

  return [
    cena,
    'O quanto isso é você? Não existe resposta certa.',
    'Para responder, toque no número.',
    degraus
  ].join(' ');
}
