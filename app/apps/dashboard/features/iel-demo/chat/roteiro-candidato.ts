/**
 * Roteiro da conversa do candidato (M3 + M7, em forma de conversa — C2).
 *
 * Diz o mesmo que o questionário em telas (`candidate/fit-questionnaire-screen`)
 * e grava a mesma coisa: as 10 frases são as de `perguntasDoCandidato` (as
 * que a empresa da vaga escolheu), respondidas na escala de concordância; o
 * aceite é o de `CANDIDATE_CONSENT_TEXT`, e o
 * resultado sai pela mesma ação do reducer. Muda só a forma — uma fala por
 * vez, com botão de ouvir —, que é o que o público operacional pede (R10).
 *
 * O IEL fala em nome do Centro de Empregos, nunca da empresa (R5). A vaga é
 * descrita só pelo que `getCandidateJobView` devolve: atividade, cidade,
 * segmento e turno.
 */

import { CANDIDATE_CONSENT_TEXT } from '../analysis/candidate-questionnaire';
import {
  ESCALA_CONCORDANCIA,
  isValorDaEscala,
  type ValorDaEscala
} from '../analysis/instrumento';
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

/** Uma frase do questionário, como a conversa a mostra. */
export type FraseDoRoteiro = { itemId: string; texto: string };

/** Os 5 botões da escala, com o rótulo escrito, um por linha no celular. */
export function opcoesDaEscala(): { id: string; label: string }[] {
  return ESCALA_CONCORDANCIA.map((ponto) => ({
    id: String(ponto.valor),
    label: ponto.rotulo
  }));
}

/** As frases como passos de pergunta da conversa. */
export function passosDasFrases(
  frases: FraseDoRoteiro[],
  apoio?: string
): PassoRoteiro[] {
  return frases.map(
    (frase, index): PassoRoteiro => ({
      tipo: 'pergunta',
      id: `p-${frase.itemId}`,
      chave: frase.itemId,
      texto: frase.texto,
      apoio: apoio ?? `Frase ${index + 1} de ${frases.length}`,
      opcoes: opcoesDaEscala()
    })
  );
}

/**
 * As respostas da conversa no formato das ações do reducer (`itemId → 1..5`),
 * ou `null` enquanto faltar alguma frase. Um valor fora da escala derruba a
 * conversão inteira: melhor não gravar do que gravar uma frase errada.
 */
export function respostasDaEscala(
  respostas: Record<string, string>,
  itemIds: string[]
): Record<string, ValorDaEscala> | null {
  const resultado: Record<string, ValorDaEscala> = {};
  for (const itemId of itemIds) {
    const valor = Number(respostas[itemId]);
    if (!isValorDaEscala(valor)) return null;
    resultado[itemId] = valor;
  }
  return resultado;
}

export function montarRoteiroCandidato({
  variante,
  vaga,
  respondidoEm,
  frases
}: {
  variante: VarianteCandidato;
  vaga: CandidateJobView | null;
  respondidoEm: string | null;
  /** As 10 frases da vaga, já no texto simples. */
  frases: FraseDoRoteiro[];
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
          'São 10 frases sobre como você prefere trabalhar. Para cada uma, diga se concorda ou discorda. Leva uns 5 minutos e não existe resposta certa.'
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
        texto:
          'Combinado. Para cada frase, toque no quanto você concorda com ela.'
      },
      ...passosDasFrases(frases),
      {
        tipo: 'fim',
        id: 'fim',
        textos: [
          `Pronto, recebemos as suas ${frases.length} respostas. Obrigado!`,
          'Agora o IEL compara o que você respondeu com o jeito de trabalhar da empresa desta vaga. Se o seu currículo for enviado, a empresa vê o resultado por tema, nunca as suas respostas uma a uma.',
          'Se a empresa quiser conversar, o contato vem por quem já fala com você. Você não precisa fazer mais nada agora.'
        ],
        acoes: ['ver-registro', 'responder-de-novo']
      }
    ]
  };
}
