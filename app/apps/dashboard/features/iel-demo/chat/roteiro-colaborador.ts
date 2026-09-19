/**
 * Roteiro da conversa do colaborador: "Como é trabalhar aqui?" (M2 + M7).
 *
 * Mesmas cinco perguntas de `CULTURE_QUESTIONS`, mesmo aceite e mesma ação do
 * reducer (`answer-culture-invite`) que a tela em passos de
 * `companies/culture-invite-screen`. O link é de uso único e vale 3 dias
 * (PRODUTO.md §5.4): convite respondido ou vencido vira uma mensagem final,
 * sem nenhuma pergunta.
 *
 * Não há nome de pessoa em lugar nenhum. O convite se apresenta pela empresa,
 * que é o que quem recebeu precisa para reconhecer o link.
 */

import { CULTURE_QUESTIONS, type CultureOptionId } from '../analysis/culture';
import { CULTURE_CONSENT_VERSION } from '../analysis/culture-invites';
import { FIT_AXES, type FitAxisId } from '../analysis/fit-axes';
import type { CultureInviteView } from '../state/selectors';
import type { ConversaRoteiro, PassoRoteiro } from './motor';
import { respostasCompletasPorEixo } from './roteiro-candidato';

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
        apoio: `São 5 perguntas, até 5 minutos. O link vale até ${diaMes(convite.expiresAt)}.`
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
          'O que é coletado: só a alternativa que você escolher em cada pergunta. Nada sobre a sua vida fora do trabalho.',
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
          'Combinado. Responda pelo que acontece de verdade no seu setor, não pelo que deveria acontecer.'
      },
      ...CULTURE_QUESTIONS.map(
        (pergunta): PassoRoteiro => ({
          tipo: 'pergunta',
          id: `p-${pergunta.axisId}`,
          chave: pergunta.axisId,
          texto: pergunta.prompt,
          opcoes: pergunta.options.map((opcao) => ({
            id: opcao.id,
            label: opcao.label
          }))
        })
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
 * As respostas no formato de `answer-culture-invite`: o id da alternativa por
 * eixo. Um id que não pertence à pergunta derruba a conversão inteira.
 */
export function respostasDoColaborador(
  respostas: Record<string, string>
): Record<FitAxisId, CultureOptionId> | null {
  const resultado: Partial<Record<FitAxisId, CultureOptionId>> = {};

  for (const eixo of FIT_AXES) {
    const pergunta = CULTURE_QUESTIONS.find(
      (entry) => entry.axisId === eixo.id
    );
    const opcao = pergunta?.options.find(
      (entry) => entry.id === respostas[eixo.id]
    );
    if (!opcao) return null;
    resultado[eixo.id] = opcao.id;
  }

  return respostasCompletasPorEixo(resultado);
}
