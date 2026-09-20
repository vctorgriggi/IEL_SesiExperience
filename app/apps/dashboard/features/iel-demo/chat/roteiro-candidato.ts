/**
 * Roteiro da conversa do candidato (M3 + M7, em forma de conversa — C2).
 *
 * Diz o mesmo que o questionário em telas (`candidate/fit-questionnaire-screen`)
 * e grava a mesma coisa: as frases são as que faltam para a vaga, respondidas
 * na escala de concordância; o aceite é o de `CANDIDATE_CONSENT_TEXT` —
 * as três linhas do resumo em falas, o texto inteiro em "Quero saber mais"
 * — e o resultado sai pela mesma ação do reducer. Muda só a forma — uma fala
 * por vez, com botão de ouvir —, que é o que o público operacional pede (R10).
 *
 * Poucas palavras e nenhum bastidor: nada de versão do texto, de frase
 * original, de "responder de novo". A resposta é uma só e vale 12 meses.
 *
 * O IEL fala em nome do Centro de Empregos, nunca da empresa (R5). A vaga é
 * descrita só pelo que `getCandidateJobView` devolve: atividade, cidade,
 * segmento e turno.
 */

import {
  CANDIDATE_CONSENT_RESUMO,
  CANDIDATE_CONSENT_TEXT
} from '../analysis/candidate-questionnaire';
import {
  isValorDaEscala,
  ROTULOS_DA_REGUA,
  type RotuloDaRegua,
  type ValorDaEscala
} from '../analysis/instrumento';
import type { CandidateJobView } from '../state/selectors';
import type { ConversaRoteiro, PassoRoteiro } from './motor';

export type VarianteCandidato =
  | 'invalido'
  | 'novo'
  /**
   * Nada a perguntar: as respostas que a pessoa já deu cobrem esta vaga e
   * continuam dentro dos 12 meses. A conversa pede só a confirmação — usar em
   * silêncio seria decidir por ela.
   */
  | 'reaproveita'
  | 'ja-respondeu'
  | 'expirado';

/** "18/09", do jeito que a mensagem diz. */
function diaMes(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/** O texto inteiro do aceite, o que "Quero saber mais" mostra. */
const TEXTO_COMPLETO_DO_ACEITE = [
  CANDIDATE_CONSENT_TEXT.purpose,
  CANDIDATE_CONSENT_TEXT.collected,
  CANDIDATE_CONSENT_TEXT.whoSees,
  CANDIDATE_CONSENT_TEXT.retention,
  CANDIDATE_CONSENT_TEXT.rights
];

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
      apoio: `${vaga.sector} · ${vaga.shift}`
    }
  ];
}

/** Uma frase do questionário, como a conversa a mostra: a frase do cliente no balão. */
export type FraseDoRoteiro = { itemId: string; texto: string };

/** Quem responde, e portanto que palavras a régua mostra. */
export type PapelDoRoteiro = 'candidato' | 'colaborador';

/**
 * As opções da escala com os rótulos da régua: os ids são os valores
 * (`'1'`…`'5'`), então a resposta gravada é a mesma de sempre. São o que o
 * "Ouvir" lê depois da frase e o que a bolha da pessoa repete.
 */
export function opcoesDaEscala(
  rotulos: RotuloDaRegua[]
): { id: string; label: string }[] {
  return rotulos.map((degrau) => ({
    id: String(degrau.valor),
    label: degrau.rotulo
  }));
}

/** A pergunta de apoio de cada papel: sobre si, ou sobre o ambiente. */
const PERGUNTA_DE_APOIO: Record<PapelDoRoteiro, string> = {
  candidato: 'O quanto isso é você?',
  colaborador: 'O quanto isso é assim aí?'
};

/** As frases como passos de pergunta da conversa, com a régua. */
export function passosDasFrases(
  frases: FraseDoRoteiro[],
  papel: PapelDoRoteiro
): PassoRoteiro[] {
  const rotulos = ROTULOS_DA_REGUA[papel];
  return frases.map(
    (frase): PassoRoteiro => ({
      tipo: 'pergunta',
      id: `p-${frase.itemId}`,
      chave: frase.itemId,
      texto: frase.texto,
      // Só a pergunta de apoio: "N de M" já está na barra do cabeçalho.
      apoio: PERGUNTA_DE_APOIO[papel],
      opcoes: opcoesDaEscala(rotulos),
      // O colaborador descreve a empresa: o degrau preenche em azul, que é
      // o lado da empresa na leitura de cor (DESIGN.md §8).
      regua: { rotulos, tom: papel === 'candidato' ? 'pessoa' : 'empresa' }
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

/** O que a conversa precisa saber sobre reaproveitamento. */
export type ReusoDoRoteiro = {
  /** Quantas frases esta empresa pergunta. */
  perguntadas: number;
  /** Quantas já vieram de resposta anterior da própria pessoa. */
  reaproveitadas: number;
  /** Quantas respostas anteriores venceram os 12 meses. */
  vencidas: number;
  /** Data da resposta reaproveitada mais antiga (ISO), ou `null`. */
  desde: string | null;
};

export function montarRoteiroCandidato({
  variante,
  vaga,
  respondidoEm,
  frases,
  reuso
}: {
  variante: VarianteCandidato;
  vaga: CandidateJobView | null;
  respondidoEm: string | null;
  /** As frases que ainda faltam perguntar, como cena. */
  frases: FraseDoRoteiro[];
  /** O reaproveitamento desta candidatura, quando há o que dizer. */
  reuso?: ReusoDoRoteiro | null;
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
            'Você não precisa fazer mais nada.'
          ],
          acoes: ['ver-candidatura']
        }
      ]
    };
  }

  if (variante === 'reaproveita' && reuso) {
    return {
      id: 'candidato-reaproveita',
      passos: [
        ...saudacao(vaga),
        {
          tipo: 'mensagem',
          id: 'reuso',
          texto: reuso.desde
            ? `Boa notícia: não tem frase nova. As ${reuso.perguntadas} que esta empresa pergunta são as mesmas que você respondeu em ${diaMes(reuso.desde)}.`
            : `Boa notícia: não tem frase nova. As ${reuso.perguntadas} que esta empresa pergunta são as mesmas que você já respondeu.`
        },
        ...CANDIDATE_CONSENT_RESUMO.slice(1).map(
          (texto, index): PassoRoteiro => ({
            tipo: 'mensagem',
            id: `aceite-linha-${index}`,
            texto
          })
        ),
        {
          // A confirmação é dela: reaproveitar calado seria decidir por ela.
          tipo: 'aceite',
          id: 'aceite',
          texto: 'Posso usar as suas respostas nesta vaga?',
          apoio: 'Nenhuma frase nova é perguntada.',
          detalhes: TEXTO_COMPLETO_DO_ACEITE,
          recusa: [
            'Tudo bem, nada foi usado nesta vaga.',
            'Se mudar de ideia, é só abrir este link outra vez.'
          ]
        },
        {
          tipo: 'fim',
          id: 'fim',
          textos: [
            'Combinado, obrigado! Esta vaga já está com as suas respostas.',
            'O IEL compara com o jeito da empresa desta vaga. Se ela quiser conversar, quem avisa você é o IEL.'
          ],
          acoes: ['ver-candidatura']
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
            'O prazo para responder terminou: as frases ficavam abertas por 2 dias.',
            'O IEL continua com o seu currículo.'
          ],
          acoes: ['responder-mesmo-assim', 'ver-candidatura']
        }
      ]
    };
  }

  return {
    id: 'candidato',
    passos: [
      ...saudacao(vaga),
      /*
       * O aceite em três falas — o que responde e para quê, quem vê, por
       * quanto tempo —, na palavra do resumo versionado. O texto inteiro
       * fica em "Quero saber mais". Antes delas, uma linha sobre o
       * reaproveitamento, quando houver: reuso calado não é reuso informado.
       */
      ...(reuso && reuso.reaproveitadas > 0
        ? [
            {
              tipo: 'mensagem' as const,
              id: 'reuso-parcial',
              texto: `${reuso.reaproveitadas} frases já valem de uma vaga anterior; faltam ${frases.length}. Leva uns 5 minutos e não existe resposta certa.`
            }
          ]
        : [
            {
              tipo: 'mensagem' as const,
              id: 'convite',
              texto: `São ${frases.length} frases, uns 5 minutos. Não existe resposta certa.`
            }
          ]),
      ...CANDIDATE_CONSENT_RESUMO.map(
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
        detalhes: TEXTO_COMPLETO_DO_ACEITE,
        recusa: [
          'Tudo bem. Nada foi registrado.',
          'Se mudar de ideia, é só abrir este link outra vez enquanto ele valer.'
        ]
      },
      {
        tipo: 'mensagem',
        id: 'combinado',
        texto:
          'Combinado. Vou mandar situações do dia a dia. Para cada uma, toque no quanto ela é você.'
      },
      ...passosDasFrases(frases, 'candidato'),
      {
        tipo: 'fim',
        id: 'fim',
        textos: [
          `Pronto, recebemos as suas ${frases.length} respostas. Obrigado!`,
          'O IEL compara com o jeito da empresa desta vaga. Se o seu currículo for enviado, a empresa vê só o quanto vocês combinam.'
        ],
        acoes: ['ver-candidatura']
      }
    ]
  };
}
