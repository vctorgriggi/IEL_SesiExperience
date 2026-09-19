/**
 * Roteiro da conversa do colaborador: "Como é trabalhar aqui?" (M2 + M7).
 *
 * As mesmas frases do bloco daquele convite (`blocoDoConvite`, cerca de 15
 * das 52 do instrumento), no texto original, mesmo aceite e mesma ação do
 * reducer (`answer-culture-invite`) que a tela em passos de
 * `companies/culture-invite-screen`. O link é de uso único e vale 3 dias
 * (PRODUTO.md §5.4): convite respondido ou vencido vira uma mensagem final,
 * sem nenhuma pergunta.
 *
 * Não há nome de pessoa em lugar nenhum. O convite se apresenta pela empresa,
 * que é o que quem recebeu precisa para reconhecer o link.
 */

import { CULTURE_CONSENT_VERSION } from '../analysis/culture-invites';
import type { ValorDaEscala } from '../analysis/instrumento';
import type { CultureInviteView } from '../state/selectors';
import type { ConversaRoteiro } from './motor';
import { passosDasFrases, respostasDaEscala } from './roteiro-candidato';

/** "15/09": o prazo como a mensagem o diz. */
function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function soFim(id: string, textos: string[]): ConversaRoteiro {
  return { id, passos: [{ tipo: 'fim', id: 'fim', textos, acoes: [] }] };
}

export function montarRoteiroColaborador(
  convite: CultureInviteView | null
): ConversaRoteiro {
  if (!convite) {
    return soFim('colaborador-invalido', [
      'Este link não corresponde a nenhuma consulta.',
      'Confira o link que você recebeu por e-mail.'
    ]);
  }

  if (convite.status === 'respondido') {
    return soFim('colaborador-respondido', [
      'Oi! Aqui é o Centro de Empregos do IEL.',
      'A resposta deste link já foi registrada. Você não precisa fazer mais nada, obrigado.',
      'Ela entra só na média da empresa: ninguém vê o que você respondeu, nem a sua gestão.'
    ]);
  }

  if (convite.status === 'expirado') {
    return soFim('colaborador-expirado', [
      'Oi! Aqui é o Centro de Empregos do IEL.',
      'Este link venceu: o prazo para responder era de 3 dias e já passou.',
      'Peça um link novo a quem enviou o convite.'
    ]);
  }

  return {
    id: 'colaborador',
    passos: [
      {
        tipo: 'mensagem',
        id: 'oi',
        texto: 'Oi! Aqui é o Centro de Empregos do IEL.'
      },
      {
        tipo: 'mensagem',
        id: 'convite',
        texto: `A empresa ${convite.companyName} quer saber como é trabalhar aí, contado por quem vive o dia a dia.`,
        apoio: `São ${convite.bloco.length} frases, uns 5 minutos. O link vale até ${diaMes(convite.expiresAt)}.`
      },
      {
        tipo: 'mensagem',
        id: 'aceite-para-que',
        texto:
          'Suas respostas entram na média que descreve como se trabalha na empresa. Essa média é comparada com o que cada candidato procura.'
      },
      {
        tipo: 'mensagem',
        id: 'aceite-quem-ve',
        texto:
          'A empresa vê só a média de todo mundo. Ninguém vê a sua resposta, nem a sua gestão.'
      },
      {
        tipo: 'aceite',
        id: 'aceite',
        texto: 'Posso contar com o seu aceite para começar?',
        apoio: `Sem o aceite, as perguntas não abrem. Versão do aceite: ${CULTURE_CONSENT_VERSION}.`,
        detalhes: [
          'O que é coletado: só o quanto você concorda com cada frase. Nada sobre a sua vida fora do trabalho.',
          'Por quanto tempo: o link vale 3 dias e serve uma vez só. Depois de enviada, a resposta não fica ligada a você.'
        ],
        recusa: [
          'Tudo bem. Nada foi registrado.',
          'Se mudar de ideia, é só abrir este link de novo enquanto ele valer.'
        ]
      },
      {
        tipo: 'mensagem',
        id: 'combinado',
        texto:
          'Combinado. Para cada frase, diga o quanto ela vale para você no dia a dia do seu setor.'
      },
      ...passosDasFrases(
        convite.bloco.map((item) => ({ itemId: item.id, texto: item.texto }))
      ),
      {
        tipo: 'fim',
        id: 'fim',
        textos: [
          'Pronto, obrigado! Sua resposta foi registrada.',
          'Ela entra só na média da empresa. Ninguém vê o que você respondeu, nem a sua gestão.',
          'Você não precisa fazer mais nada. Este link já foi usado e não abre de novo.'
        ],
        acoes: []
      }
    ]
  };
}

/**
 * As respostas no formato de `answer-culture-invite`: concordância por frase
 * do bloco. Falta de frase ou valor fora da escala derruba a conversão.
 */
export function respostasDoColaborador(
  respostas: Record<string, string>,
  convite: CultureInviteView
): Record<string, ValorDaEscala> | null {
  return respostasDaEscala(
    respostas,
    convite.bloco.map((item) => item.id)
  );
}
