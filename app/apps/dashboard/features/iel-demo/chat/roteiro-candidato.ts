/**
 * Roteiro da conversa do candidato (M3 + M7, em forma de conversa — C2).
 *
 * Diz o mesmo que o questionário em telas (`candidate/fit-questionnaire-screen`)
 * e grava a mesma coisa: as cinco perguntas são as de
 * `CANDIDATE_FIT_QUESTIONS`, o aceite é o de `CANDIDATE_CONSENT_TEXT`, e o
 * resultado sai pela mesma ação do reducer. Muda só a forma — uma fala por
 * vez, com botão de ouvir —, que é o que o público operacional pede (R10).
 *
 * O IEL fala em nome do Centro de Empregos, nunca da empresa (R5). A vaga é
 * descrita só pelo que `getCandidateJobView` devolve: atividade, cidade,
 * segmento e turno.
 */

import {
  CANDIDATE_CONSENT_TEXT,
  CANDIDATE_FIT_QUESTIONS
} from '../analysis/candidate-questionnaire';
import type { CultureOptionValue } from '../analysis/culture';
import { FIT_AXES, type FitAxisId } from '../analysis/fit-axes';
import type { CandidateJobView } from '../state/selectors';
import type { ConversaRoteiro, PassoRoteiro } from './motor';

export type VarianteCandidato =
  | 'invalido'
  | 'novo'
  | 'ja-respondeu'
  | 'expirado';

/** "18/09", do jeito que a mensagem diz. */
function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

function saudacao(vaga: CandidateJobView): PassoRoteiro[] {
  return [
    {
      tipo: 'mensagem',
      id: 'oi',
      texto: 'Oi! Aqui é o Centro de Empregos do IEL.'
    },
    {
      tipo: 'mensagem',
      id: 'vaga',
      texto: `Você se candidatou à vaga de ${vaga.activity}, em ${vaga.location}.`,
      apoio: `${vaga.sector} · ${vaga.shift}. O nome da empresa você conhece na entrevista.`
    }
  ];
}

export function montarRoteiroCandidato({
  variante,
  vaga,
  respondidoEm
}: {
  variante: VarianteCandidato;
  vaga: CandidateJobView | null;
  respondidoEm: string | null;
}): ConversaRoteiro {
  if (variante === 'invalido' || !vaga) {
    return {
      id: 'candidato-invalido',
      passos: [
        {
          tipo: 'fim',
          id: 'fim',
          textos: [
            'Este link não corresponde a nenhuma candidatura.',
            'Confira a mensagem que você recebeu do Centro de Empregos do IEL.'
          ],
          acoes: []
        }
      ]
    };
  }

  if (variante === 'ja-respondeu') {
    return {
      id: 'candidato-ja-respondeu',
      passos: [
        ...saudacao(vaga),
        {
          tipo: 'fim',
          id: 'fim',
          textos: [
            respondidoEm
              ? `Suas respostas desta vaga já estão com a gente desde ${diaMes(respondidoEm)}.`
              : 'Suas respostas desta vaga já estão com a gente.',
            'Você não precisa fazer mais nada. Se quiser mudar alguma, responda de novo: fica valendo a última.'
          ],
          acoes: ['responder-de-novo', 'ver-registro']
        }
      ]
    };
  }

  if (variante === 'expirado') {
    return {
      id: 'candidato-expirado',
      passos: [
        ...saudacao(vaga),
        {
          tipo: 'fim',
          id: 'fim',
          textos: [
            'O prazo para responder terminou: as perguntas ficavam abertas por 2 dias.',
            'O IEL continua com o seu currículo. Se a vaga voltar a precisar de respostas, você recebe um link novo.'
          ],
          acoes: ['responder-mesmo-assim']
        }
      ]
    };
  }

  return {
    id: 'candidato',
    passos: [
      ...saudacao(vaga),
      {
        tipo: 'mensagem',
        id: 'convite',
        texto:
          'São 5 perguntas sobre como você prefere trabalhar. Leva uns 5 minutos e não existe resposta certa.'
      },
      {
        tipo: 'mensagem',
        id: 'aceite-para-que',
        texto: CANDIDATE_CONSENT_TEXT.purpose
      },
      {
        tipo: 'mensagem',
        id: 'aceite-quem-ve',
        texto: CANDIDATE_CONSENT_TEXT.whoSees
      },
      {
        tipo: 'aceite',
        id: 'aceite',
        texto: 'Posso contar com o seu aceite para começar?',
        apoio: `Sem o aceite, as perguntas não abrem. Versão do texto: ${CANDIDATE_CONSENT_TEXT.version}.`,
        detalhes: [
          CANDIDATE_CONSENT_TEXT.collected,
          CANDIDATE_CONSENT_TEXT.retention,
          CANDIDATE_CONSENT_TEXT.rights
        ],
        recusa: [
          'Tudo bem. Nada foi registrado.',
          'Sem as respostas, a análise da vaga fica sem esse ponto. Se mudar de ideia, é só abrir este link de novo enquanto ele valer.'
        ]
      },
      {
        tipo: 'mensagem',
        id: 'combinado',
        texto: 'Combinado. Toque na opção que mais se parece com você.'
      },
      ...CANDIDATE_FIT_QUESTIONS.map(
        (pergunta): PassoRoteiro => ({
          tipo: 'pergunta',
          id: `p-${pergunta.axisId}`,
          chave: pergunta.axisId,
          texto: pergunta.prompt,
          apoio: pergunta.hint,
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
          'Pronto, recebemos as suas 5 respostas. Obrigado!',
          'Agora o IEL compara o que você respondeu com o jeito de trabalhar da empresa desta vaga. Se o seu currículo for enviado, a empresa vê o resultado por ponto, nunca as suas respostas uma a uma.',
          'Se a empresa quiser conversar, o contato vem por quem já fala com você. Você não precisa fazer mais nada agora.'
        ],
        acoes: ['ver-registro', 'responder-de-novo']
      }
    ]
  };
}

/**
 * As respostas da conversa no formato que `answer-fit-questionnaire` aceita,
 * ou `null` enquanto faltar alguma.
 *
 * Converte o id da alternativa escolhida no `value` ordinal da mesma
 * alternativa — é o mesmo número que o questionário em telas grava. Um id
 * desconhecido derruba a conversão inteira: melhor não gravar do que gravar
 * um eixo errado.
 */
export function respostasDoCandidato(
  respostas: Record<string, string>
): Record<FitAxisId, CultureOptionValue> | null {
  const resultado: Partial<Record<FitAxisId, CultureOptionValue>> = {};

  for (const eixo of FIT_AXES) {
    const pergunta = CANDIDATE_FIT_QUESTIONS.find(
      (entry) => entry.axisId === eixo.id
    );
    const opcao = pergunta?.options.find(
      (entry) => entry.id === respostas[eixo.id]
    );
    if (!opcao) return null;
    resultado[eixo.id] = opcao.value;
  }

  return respostasCompletasPorEixo(resultado);
}

/**
 * O objeto com os cinco eixos, ou `null` se faltar um. Os eixos são escritos
 * um a um para o TypeScript provar que as cinco chaves estão lá, sem
 * conversão de tipo escondendo uma resposta pela metade.
 */
export function respostasCompletasPorEixo<T>(
  parcial: Partial<Record<FitAxisId, T>>
): Record<FitAxisId, T> | null {
  const apoio = parcial['apoio-inicial'];
  const autonomia = parcial.autonomia;
  const comunicacao = parcial['comunicacao-prioridades'];
  const ritmo = parcial['ritmo-turno'];
  const aprendizado = parcial.aprendizado;
  if (
    apoio === undefined ||
    autonomia === undefined ||
    comunicacao === undefined ||
    ritmo === undefined ||
    aprendizado === undefined
  ) {
    return null;
  }
  return {
    'apoio-inicial': apoio,
    autonomia,
    'comunicacao-prioridades': comunicacao,
    'ritmo-turno': ritmo,
    aprendizado
  };
}
