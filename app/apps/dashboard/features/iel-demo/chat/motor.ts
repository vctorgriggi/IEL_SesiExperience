/**
 * Motor da conversa guiada (C2 do MoSCoW).
 *
 * Na reunião de 19/09 a equipe propôs "uma IA interativa em que a pessoa vai
 * clicando e ela preenche o currículo ali", e o IEL achou boa ideia. O mesmo
 * IEL disse que entrevista por IA "não é um plus" para o público operacional
 * (R10) e que nada no caminho crítico pode custar por candidato (R7). Daí a
 * forma: tem cara de conversa, mas é um roteiro fixo, declarativo e
 * determinístico. Nenhum modelo de linguagem é consultado, nenhuma frase é
 * inventada na hora e a pessoa só responde tocando em botões.
 *
 * O motor é puro: recebe um roteiro e um estado, devolve o próximo estado.
 * Quem cuida de ritmo (o "digitando…"), áudio e foco é a interface; quem
 * decide o que vira dado é o conversor de cada roteiro.
 */

export type ChatOpcao = {
  id: string;
  label: string;
};

/** Uma fala do IEL que não pede resposta. */
export type PassoMensagem = {
  tipo: 'mensagem';
  id: string;
  texto: string;
  /** Linha de apoio, menor, dentro da mesma bolha. */
  apoio?: string;
};

/** Uma pergunta com alternativas clicáveis; a resposta vira dado. */
export type PassoPergunta = {
  tipo: 'pergunta';
  id: string;
  /** Chave em `respostas` — no questionário, o id do eixo. */
  chave: string;
  texto: string;
  apoio?: string;
  opcoes: ChatOpcao[];
};

/**
 * O aceite (LGPD, art. 7º, I). Nasce sem resposta e sem ele nenhuma pergunta
 * aparece. "Quero saber mais" mostra o resto do texto e volta aos botões;
 * "Agora não" encerra sem coletar nada — consentimento só é livre se dá para
 * dizer não.
 */
export type PassoAceite = {
  tipo: 'aceite';
  id: string;
  texto: string;
  apoio?: string;
  /** O resto do texto de aceite, mostrado em "Quero saber mais". */
  detalhes: string[];
  /** Falas do IEL quando a pessoa não aceita. */
  recusa: string[];
};

/** O fechamento: o que acontece depois, e as ações que sobram na tela. */
export type PassoFim = {
  tipo: 'fim';
  id: string;
  textos: string[];
  /** Ações que a interface oferece depois do fim; cada roteiro diz quais. */
  acoes: AcaoFinal[];
};

export type AcaoFinal =
  | 'responder-de-novo'
  | 'responder-mesmo-assim'
  /** Leva para "Minha candidatura", a casa do candidato no produto. */
  | 'ver-candidatura';

export type PassoRoteiro =
  | PassoMensagem
  | PassoPergunta
  | PassoAceite
  | PassoFim;

export type ConversaRoteiro = {
  id: string;
  passos: PassoRoteiro[];
};

export type MensagemConversa = {
  id: string;
  autor: 'iel' | 'pessoa';
  texto: string;
  apoio?: string;
  /** O que o botão "Ouvir" lê: numa pergunta, inclui as alternativas. */
  fala: string;
  /** Passo que originou a mensagem. */
  passoId: string;
  /** Carimbo ISO, do relógio único da demonstração. */
  em: string;
};

export type EstadoConversa = {
  /** Índice do passo que espera resposta (ou do fim). */
  passoAtual: number;
  respostas: Record<string, string>;
  historico: MensagemConversa[];
  aceite: 'pendente' | 'aceito' | 'recusado';
  detalhesMostrados: boolean;
  encerrada: boolean;
  /** Ações que sobraram depois do fim. */
  acoesFinais: AcaoFinal[];
};

/* ------------------------------------------------------------------ *
 * Botões do aceite
 * ------------------------------------------------------------------ */

export const OPCAO_ACEITO: ChatOpcao = { id: 'aceito', label: 'Aceito' };
export const OPCAO_SABER_MAIS: ChatOpcao = {
  id: 'saber-mais',
  label: 'Quero saber mais'
};
export const OPCAO_RECUSAR: ChatOpcao = { id: 'recusar', label: 'Agora não' };

/* ------------------------------------------------------------------ *
 * Montagem de mensagens
 * ------------------------------------------------------------------ */

function falaDaPergunta(passo: PassoPergunta): string {
  const opcoes = passo.opcoes
    .map((opcao, index) => `Opção ${index + 1}: ${opcao.label}.`)
    .join(' ');
  return [passo.texto, passo.apoio, opcoes].filter(Boolean).join(' ');
}

function mensagemIel(
  passoId: string,
  sufixo: string,
  texto: string,
  em: string,
  apoio?: string,
  fala?: string
): MensagemConversa {
  return {
    id: `${passoId}:${sufixo}`,
    autor: 'iel',
    texto,
    apoio,
    fala: fala ?? [texto, apoio].filter(Boolean).join(' '),
    passoId,
    em
  };
}

function mensagemPessoa(
  passoId: string,
  sufixo: string,
  texto: string,
  em: string
): MensagemConversa {
  return {
    id: `${passoId}:pessoa:${sufixo}`,
    autor: 'pessoa',
    texto,
    fala: texto,
    passoId,
    em
  };
}

/**
 * Anda pelo roteiro a partir de `indice`, pondo no histórico as falas do IEL,
 * até parar num passo que pede resposta ou no fim.
 */
function avancar(
  roteiro: ConversaRoteiro,
  estado: EstadoConversa,
  indice: number,
  em: string
): EstadoConversa {
  const historico = [...estado.historico];
  let atual = indice;

  while (atual < roteiro.passos.length) {
    const passo = roteiro.passos[atual];
    if (!passo) break;

    if (passo.tipo === 'mensagem') {
      historico.push(mensagemIel(passo.id, 'm', passo.texto, em, passo.apoio));
      atual += 1;
      continue;
    }

    if (passo.tipo === 'pergunta') {
      historico.push(
        mensagemIel(
          passo.id,
          'q',
          passo.texto,
          em,
          passo.apoio,
          falaDaPergunta(passo)
        )
      );
      return { ...estado, historico, passoAtual: atual };
    }

    if (passo.tipo === 'aceite') {
      historico.push(mensagemIel(passo.id, 'q', passo.texto, em, passo.apoio));
      return { ...estado, historico, passoAtual: atual };
    }

    passo.textos.forEach((texto, index) => {
      historico.push(mensagemIel(passo.id, `f${index}`, texto, em));
    });
    return {
      ...estado,
      historico,
      passoAtual: atual,
      encerrada: true,
      acoesFinais: passo.acoes
    };
  }

  return { ...estado, historico, passoAtual: atual, encerrada: true };
}

/* ------------------------------------------------------------------ *
 * API do motor
 * ------------------------------------------------------------------ */

export function iniciarConversa(
  roteiro: ConversaRoteiro,
  em: string
): EstadoConversa {
  return avancar(
    roteiro,
    {
      passoAtual: 0,
      respostas: {},
      historico: [],
      aceite: 'pendente',
      detalhesMostrados: false,
      encerrada: false,
      acoesFinais: []
    },
    0,
    em
  );
}

/** O passo que espera resposta agora, ou `null` quando a conversa acabou. */
export function passoEmEspera(
  roteiro: ConversaRoteiro,
  estado: EstadoConversa
): PassoPergunta | PassoAceite | null {
  if (estado.encerrada) return null;
  const passo = roteiro.passos[estado.passoAtual];
  if (!passo || (passo.tipo !== 'pergunta' && passo.tipo !== 'aceite')) {
    return null;
  }
  return passo;
}

/** Os botões do passo em espera, na ordem em que aparecem. */
export function opcoesEmEspera(
  roteiro: ConversaRoteiro,
  estado: EstadoConversa
): ChatOpcao[] {
  const passo = passoEmEspera(roteiro, estado);
  if (!passo) return [];
  if (passo.tipo === 'pergunta') return passo.opcoes;
  // Depois de ler o resto do texto, "Quero saber mais" não tem mais o que
  // mostrar e sai da tela.
  return estado.detalhesMostrados
    ? [OPCAO_ACEITO, OPCAO_RECUSAR]
    : [OPCAO_ACEITO, OPCAO_SABER_MAIS, OPCAO_RECUSAR];
}

/**
 * A pessoa tocou num botão. Devolve o próximo estado; um toque fora de hora
 * (opção que não é do passo em espera) devolve o mesmo estado.
 */
export function responder(
  roteiro: ConversaRoteiro,
  estado: EstadoConversa,
  opcaoId: string,
  em: string
): EstadoConversa {
  const passo = passoEmEspera(roteiro, estado);
  if (!passo) return estado;

  const opcao = opcoesEmEspera(roteiro, estado).find(
    (entry) => entry.id === opcaoId
  );
  if (!opcao) return estado;

  const resposta = mensagemPessoa(
    passo.id,
    `${estado.historico.length}`,
    opcao.label,
    em
  );

  if (passo.tipo === 'pergunta') {
    return avancar(
      roteiro,
      {
        ...estado,
        respostas: { ...estado.respostas, [passo.chave]: opcao.id },
        historico: [...estado.historico, resposta]
      },
      estado.passoAtual + 1,
      em
    );
  }

  if (opcao.id === OPCAO_SABER_MAIS.id) {
    return {
      ...estado,
      detalhesMostrados: true,
      historico: [
        ...estado.historico,
        resposta,
        ...passo.detalhes.map((texto, index) =>
          mensagemIel(passo.id, `d${index}`, texto, em)
        ),
        mensagemIel(passo.id, 'q2', 'Posso contar com o seu aceite?', em)
      ]
    };
  }

  if (opcao.id === OPCAO_RECUSAR.id) {
    return {
      ...estado,
      aceite: 'recusado',
      encerrada: true,
      acoesFinais: [],
      historico: [
        ...estado.historico,
        resposta,
        ...passo.recusa.map((texto, index) =>
          mensagemIel(passo.id, `r${index}`, texto, em)
        )
      ]
    };
  }

  return avancar(
    roteiro,
    {
      ...estado,
      aceite: 'aceito',
      historico: [...estado.historico, resposta]
    },
    estado.passoAtual + 1,
    em
  );
}

/**
 * A última resposta a uma pergunta, se ainda dá para mudá-la.
 *
 * Só antes do fim: depois do fim a resposta já foi registrada, e o caminho é
 * responder de novo (candidato) ou nenhum (colaborador, link de uso único).
 */
export function ultimaRespostaMutavel(
  roteiro: ConversaRoteiro,
  estado: EstadoConversa
): MensagemConversa | null {
  if (estado.encerrada) return null;
  for (let index = estado.historico.length - 1; index >= 0; index -= 1) {
    const mensagem = estado.historico[index];
    if (!mensagem || mensagem.autor !== 'pessoa') continue;
    const passo = roteiro.passos.find((entry) => entry.id === mensagem.passoId);
    return passo?.tipo === 'pergunta' ? mensagem : null;
  }
  return null;
}

/**
 * "Mudar minha resposta": desfaz a última pergunta respondida.
 *
 * Corta o histórico logo antes da resposta — a pergunta continua lá, os
 * botões voltam — e apaga a resposta gravada. Nada é reescrito: o que a pessoa
 * vê é a conversa como estava um toque atrás.
 */
export function voltar(
  roteiro: ConversaRoteiro,
  estado: EstadoConversa
): EstadoConversa {
  const ultima = ultimaRespostaMutavel(roteiro, estado);
  if (!ultima) return estado;

  const indicePasso = roteiro.passos.findIndex(
    (entry) => entry.id === ultima.passoId
  );
  const passo = roteiro.passos[indicePasso];
  if (!passo || passo.tipo !== 'pergunta') return estado;

  const corte = estado.historico.findIndex((entry) => entry.id === ultima.id);
  const respostas = { ...estado.respostas };
  delete respostas[passo.chave];

  return {
    ...estado,
    passoAtual: indicePasso,
    respostas,
    historico: estado.historico.slice(0, corte),
    encerrada: false,
    acoesFinais: []
  };
}

/** Perguntas do roteiro e em qual a pessoa está, para o "Pergunta N de 5". */
export function progressoDaConversa(
  roteiro: ConversaRoteiro,
  estado: EstadoConversa
): { atual: number; total: number; fase: 'antes' | 'perguntas' | 'fim' } {
  const perguntas = roteiro.passos.filter((passo) => passo.tipo === 'pergunta');
  const total = perguntas.length;
  const respondidas = perguntas.filter(
    (passo) => estado.respostas[passo.chave] !== undefined
  ).length;

  if (estado.encerrada) {
    return { atual: respondidas, total, fase: 'fim' };
  }
  const passo = roteiro.passos[estado.passoAtual];
  if (passo?.tipo === 'pergunta') {
    return { atual: respondidas + 1, total, fase: 'perguntas' };
  }
  return { atual: 0, total, fase: 'antes' };
}
