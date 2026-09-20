/**
 * Roteiro da conversa do colaborador: "Como é trabalhar aqui?" (M2 + M7).
 *
 * As mesmas frases do bloco daquele convite (`blocoDoConvite`, cerca de 15
 * das 52 do instrumento), com a frase do cliente sem edição, mesmo aceite (`CULTURE_CONSENT_TEXT`,
 * resumido em três falas e inteiro em "Quero saber mais") e mesma ação do
 * reducer (`answer-culture-invite`) que a tela em passos de
 * `companies/culture-invite-screen`. A régua é a do colaborador:
 * ele descreve o ambiente ("É bem assim aqui"), não a si. O link é de uso único e vale 3 dias
 * (PRODUTO.md §5.4): convite respondido ou vencido vira uma mensagem final,
 * sem nenhuma pergunta.
 *
 * Não há nome de pessoa em lugar nenhum. O convite se apresenta pela empresa,
 * que é o que quem recebeu precisa para reconhecer o link.
 */

import {
  CULTURE_CONSENT_RESUMO,
  CULTURE_CONSENT_TEXT
} from '../analysis/culture-invites';
import type { ValorDaEscala } from '../analysis/instrumento';
import type { CultureInviteView } from '../state/selectors';
import type { ConversaRoteiro, PassoRoteiro } from './motor';
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
      'A resposta deste link já foi registrada. Obrigado, você não precisa fazer mais nada.',
      'Ela entra numa média com a da equipe: ninguém vê a sua sozinha.'
    ]);
  }

  if (convite.status === 'expirado') {
    return soFim('colaborador-expirado', [
      'Oi! Aqui é o Centro de Empregos do IEL.',
      `Este link venceu: o prazo para responder terminou em ${diaMes(convite.expiresAt)}.`,
      'Se ainda quiser responder, peça um link novo a quem mandou o convite.'
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
        texto: `A equipe do IEL que atende a ${convite.companyName} quer a opinião de quem vive o dia a dia daí. Não existe resposta certa.`,
        apoio: `São ${convite.bloco.length} frases, uns 5 minutos. O link vale até ${diaMes(convite.expiresAt)}.`
      },
      // O aceite em três falas; o texto inteiro em "Quero saber mais".
      ...CULTURE_CONSENT_RESUMO.map(
        (texto, index): PassoRoteiro => ({
          tipo: 'mensagem',
          id: `aceite-linha-${index}`,
          texto
        })
      ),
      {
        tipo: 'aceite',
        id: 'aceite',
        texto: 'Posso contar com o seu aceite para começar?',
        detalhes: [
          CULTURE_CONSENT_TEXT.purpose,
          CULTURE_CONSENT_TEXT.collected,
          CULTURE_CONSENT_TEXT.whoSees,
          CULTURE_CONSENT_TEXT.retention
        ],
        recusa: [
          'Tudo bem. Nada foi registrado.',
          'Se mudar de ideia, é só abrir este link outra vez enquanto ele valer.'
        ]
      },
      {
        tipo: 'mensagem',
        id: 'combinado',
        texto:
          'Combinado. Vou mandar situações do dia a dia. Para cada uma, toque no quanto ela é assim aí no seu setor.'
      },
      ...passosDasFrases(
        convite.bloco.map((item) => ({ itemId: item.id, texto: item.texto })),
        'colaborador'
      ),
      {
        tipo: 'fim',
        id: 'fim',
        textos: [
          'Obrigado! Sua resposta foi registrada.',
          'Ela entra numa média com a da equipe. Você não precisa fazer mais nada.'
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
