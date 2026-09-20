import {
  COMO_ESTA_SENDO_LABEL,
  MARCOS_DO_ACOMPANHAMENTO,
  rotuloDoMarco,
  type CheckIn,
  type MarcoDoAcompanhamento,
  type SituacaoDeContratacao
} from '@/features/iel-demo/analysis/acompanhamento';
import { plural } from '@/features/iel-demo/format';

import type { EstadoDeCor } from '../metricas/cores';

/**
 * A leitura de uma contratação na voz da tela: o que a analista vê numa
 * linha da fila e o que ela lê ao telefone.
 *
 * Função pura, sem JSX, composta só do que `analysis/acompanhamento.ts` e os
 * seletores já exportam. O domínio diz *o que se sabe* (marcos, fontes,
 * divergência); aqui se decide *o que isso pede da analista* — ligar hoje ou
 * nada por enquanto — e com que palavras. A pessoa nunca vira nota: "como
 * está sendo" é o rótulo escrito do que ela disse.
 *
 * A tela faz duas perguntas, nesta ordem: "para quem eu ligo hoje?" e "como
 * estão os que a gente colocou?". Tudo aqui serve a uma das duas. O
 * vocabulário é o da analista, não o do domínio: "aos 30 dias", "ainda não
 * contou", "contou que saiu", "tudo certo" — nunca "marco", "janela" ou
 * "check-in" em texto de tela.
 */

/* ------------------------------------------------------------------ *
 * O estado da linha
 * ------------------------------------------------------------------ */

/**
 * O que a linha pede, do mais urgente para o menos. A ordem aqui é a mesma
 * da fila (`getAcompanhamento`): pendência primeiro, depois o que pede uma
 * ligação por causa de uma saída que só um lado contou, depois o resto.
 *
 * São sete estados internos, mas a tela mostra cinco palavras: as três
 * variações de saída ("só a pessoa avisou", "os dois lados diferem", "saiu")
 * viram o mesmo badge "Saiu", e a diferença entre elas fica na frase da
 * linha — que é onde a analista lê, não no badge.
 */
export type EstadoDaLinha =
  | 'ligar-hoje'
  | 'saiu-so-a-pessoa'
  | 'divergencia'
  | 'saiu'
  | 'sem-resposta'
  | 'em-dia'
  | 'antes-dos-30';

/** O badge da linha: uma palavra que a analista entende sem legenda. */
export const ESTADO_DA_LINHA_LABEL: Record<EstadoDaLinha, string> = {
  'ligar-hoje': 'Ligar hoje',
  'saiu-so-a-pessoa': 'Saiu',
  divergencia: 'Saiu',
  saiu: 'Saiu',
  'sem-resposta': 'Sem resposta',
  'em-dia': 'Tudo certo',
  'antes-dos-30': 'Antes dos 30 dias'
};

/**
 * Cor com significado (DESIGN.md §8): laranja pede uma ligação hoje,
 * vermelho é saída (de qualquer fonte — o indicador também assume a saída
 * quando os lados diferem), verde é quando a pessoa disse que está bem,
 * cinza é sem dado.
 */
export const TOM_DO_ESTADO: Record<EstadoDaLinha, EstadoDeCor> = {
  'ligar-hoje': 'atencao',
  'saiu-so-a-pessoa': 'difere',
  divergencia: 'difere',
  saiu: 'difere',
  'sem-resposta': 'neutro',
  'em-dia': 'combina',
  'antes-dos-30': 'neutro'
};

/**
 * O estado de uma linha, decidido na ordem em que a fila ordena.
 *
 * "Sem resposta" só quando o marco mais recente já alcançado fechou sem
 * resposta: quem respondeu aos 30 e perdeu os 60 não está "tudo certo", e a
 * tela não pode dizer que está.
 */
export function estadoDaLinha(situacao: SituacaoDeContratacao): EstadoDaLinha {
  if (situacao.pendentes.length > 0) return 'ligar-hoje';
  if (situacao.divergencia) return 'divergencia';
  if (situacao.porFonte.pessoa === 'saiu' && situacao.porFonte.empresa === null)
    return 'saiu-so-a-pessoa';
  if (situacao.permanencia.estado === 'saiu') return 'saiu';
  const ultimoPerdido = situacao.perdidos.at(-1) ?? 0;
  const ultimoRespondido = situacao.checkIns.at(-1)?.marco ?? 0;
  if (ultimoPerdido > ultimoRespondido) return 'sem-resposta';
  if (situacao.checkIns.length > 0 || situacao.porFonte.empresa === 'continua')
    return 'em-dia';
  return 'antes-dos-30';
}

/* ------------------------------------------------------------------ *
 * Para quem ligar hoje
 * ------------------------------------------------------------------ */

/**
 * Quem entra no bloco "Ligar hoje": os dois primeiros grupos da fila —
 * pergunta aberta sem resposta, e saída que só um lado contou (ou em que os
 * dois lados dizem coisas diferentes). É a mesma regra de ordenação de
 * `getAcompanhamento`, lida como pergunta: "isto pede uma ligação hoje?".
 */
export function pedeLigacaoHoje(situacao: SituacaoDeContratacao): boolean {
  const estado = estadoDaLinha(situacao);
  return (
    estado === 'ligar-hoje' ||
    estado === 'saiu-so-a-pessoa' ||
    estado === 'divergencia'
  );
}

/**
 * O motivo da ligação em uma frase, em minúscula, para caber depois do nome
 * ("Marcos · Horizonte Alimentos — está há 45 dias e ainda não contou como
 * está sendo"). É a única versão deste texto: o bloco "Ligar hoje" e o grupo
 * "Ligar para quem foi contratado" do Início leem daqui, para nunca dizerem
 * a mesma coisa de dois jeitos.
 *
 * `null` quando a linha não pede ligação hoje.
 */
export function motivoDaLigacao(
  situacao: SituacaoDeContratacao
): string | null {
  switch (estadoDaLinha(situacao)) {
    case 'ligar-hoje': {
      const ultimo = situacao.checkIns.at(-1);
      const ha = plural(situacao.diasNaEmpresa, 'dia', 'dias');
      // Quem já contou uma vez e parou de contar: a frase diz desde quando.
      return ultimo
        ? `está há ${ha} e não conta como está sendo desde os ${rotuloDoMarco(ultimo.marco)}`
        : `está há ${ha} e ainda não contou como está sendo`;
    }
    case 'saiu-so-a-pessoa':
      return 'contou que saiu; a empresa não avisou';
    case 'divergencia':
      return situacao.porFonte.pessoa === 'saiu'
        ? 'contou que saiu; a empresa diz que continua'
        : 'diz que continua; a empresa avisou que saiu';
    default:
      return null;
  }
}

/** "está há 45 dias…" → "Está há 45 dias…", para abrir uma linha. */
export function capitalizar(frase: string): string {
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

/* ------------------------------------------------------------------ *
 * Como está cada pessoa, em uma frase
 * ------------------------------------------------------------------ */

/** O lado da pessoa, em minúscula, para compor a frase da linha. */
function ladoDaPessoa(situacao: SituacaoDeContratacao): string {
  const ultimo = situacao.checkIns.at(-1);
  const saida = situacao.checkIns.find((checkIn) => !checkIn.continua);
  if (saida) return 'contou que saiu';
  if (ultimo) {
    const como = COMO_ESTA_SENDO_LABEL[ultimo.comoEstaSendo].toLowerCase();
    return `aos ${rotuloDoMarco(ultimo.marco)} contou que continua e que está sendo ${como}`;
  }
  return 'ainda não contou como está sendo';
}

/** O lado da empresa, em minúscula, para fechar a frase da linha. */
function ladoDaEmpresa(situacao: SituacaoDeContratacao): string {
  switch (situacao.porFonte.empresa) {
    case 'continua':
      return situacao.porFonte.pessoa === 'continua'
        ? 'a empresa também diz que continua'
        : 'a empresa diz que continua';
    case 'saiu':
      return situacao.porFonte.pessoa === 'saiu'
        ? 'a empresa também avisou'
        : 'a empresa avisou que saiu';
    default:
      return situacao.porFonte.pessoa === 'saiu'
        ? 'a empresa não avisou'
        : 'a empresa não informou';
  }
}

/**
 * A frase da linha: os dois lados numa sentença só, separados por " · ".
 * Substitui as colunas "o que a pessoa disse / o que a empresa disse" — a
 * analista não compara colunas, ela lê uma frase.
 *
 *   Marcos → "Está há 45 dias e ainda não contou como está sendo · a empresa não informou"
 *   Renata → "Contou que saiu · a empresa não avisou"
 *   Júlia  → "Aos 60 dias contou que continua e que está sendo muito bom · a empresa não informou"
 *
 * Os casos sem resposta e antes dos 30 dias dizem onde a pessoa está no
 * relógio, porque é o que explica por que ainda não se sabe nada.
 */
export function fraseDaLinha(situacao: SituacaoDeContratacao): string {
  const estado = estadoDaLinha(situacao);
  const empresa = ladoDaEmpresa(situacao);

  if (estado === 'ligar-hoje') {
    return `${capitalizar(motivoDaLigacao(situacao) ?? ladoDaPessoa(situacao))} · ${empresa}`;
  }

  if (estado === 'sem-resposta') {
    const perdido = situacao.perdidos.at(-1);
    const ultimo = situacao.checkIns.at(-1);
    const semResposta =
      perdido === undefined
        ? 'não respondeu'
        : `não respondeu aos ${rotuloDoMarco(perdido)}`;
    return ultimo
      ? `${capitalizar(ladoDaPessoa(situacao))}; ${semResposta} · ${empresa}`
      : `${capitalizar(semResposta)} · ${empresa}`;
  }

  if (estado === 'antes-dos-30') {
    return `Está há ${plural(situacao.diasNaEmpresa, 'dia', 'dias')}; a primeira pergunta chega aos 30 · ${empresa}`;
  }

  return `${capitalizar(ladoDaPessoa(situacao))} · ${empresa}`;
}

/* ------------------------------------------------------------------ *
 * O relógio dos 90 dias
 * ------------------------------------------------------------------ */

/**
 * Como cada um dos três marcos está para esta pessoa. `encerrado` é o marco
 * que não vai ser perguntado: a pessoa já contou que saiu antes dele.
 */
export type EstadoDoMarco =
  | 'respondido'
  | 'aberto'
  | 'perdido'
  | 'futuro'
  | 'encerrado';

export type MarcoNaLinhaDoTempo = {
  marco: MarcoDoAcompanhamento;
  estado: EstadoDoMarco;
  checkIn: CheckIn | null;
  /** Em quantos dias chega, quando é futuro; há quantos está aberto, quando aberto. */
  dias: number | null;
};

/**
 * Os três marcos com o estado de cada um, para a linha do tempo do detalhe
 * e para os três pontos da barra fina da lista.
 *
 * O domínio só lista o que foi respondido, o que está aberto e o que se
 * perdeu; o que sobra é futuro — ou encerrado, quando a pessoa já contou que
 * saiu: depois de um "saí" ninguém pergunta "continua?" de novo.
 */
export function linhaDoTempo(
  situacao: SituacaoDeContratacao
): MarcoNaLinhaDoTempo[] {
  const respondidos = new Map(situacao.checkIns.map((c) => [c.marco, c]));
  const saiu = situacao.permanencia.estado === 'saiu';
  return MARCOS_DO_ACOMPANHAMENTO.map((marco) => {
    const checkIn = respondidos.get(marco) ?? null;
    if (checkIn) return { marco, estado: 'respondido', checkIn, dias: null };
    if (situacao.pendentes.includes(marco))
      return {
        marco,
        estado: 'aberto',
        checkIn: null,
        dias: situacao.diasNaEmpresa - marco
      };
    if (situacao.perdidos.includes(marco))
      return { marco, estado: 'perdido', checkIn: null, dias: null };
    if (saiu || marco <= situacao.diasNaEmpresa)
      return { marco, estado: 'encerrado', checkIn: null, dias: null };
    return {
      marco,
      estado: 'futuro',
      checkIn: null,
      dias: marco - situacao.diasNaEmpresa
    };
  });
}

/** O último dos três marcos: a barra da lista vai até aqui. */
export const ULTIMO_MARCO: MarcoDoAcompanhamento = 90;

/**
 * "dia 45 de 90" — onde a pessoa está no relógio, em palavras. Passado o
 * dia 90 a barra já está cheia e a frase muda, porque "dia 95 de 90" não se
 * lê.
 */
export function diaDosNoventa(situacao: SituacaoDeContratacao): string {
  return situacao.diasNaEmpresa > ULTIMO_MARCO
    ? 'passou dos 90 dias'
    : `dia ${situacao.diasNaEmpresa} de ${ULTIMO_MARCO}`;
}

/** Quanto da barra dos 90 dias já passou, de 0 a 100. */
export function percentualDosNoventa(situacao: SituacaoDeContratacao): number {
  return Math.min(
    100,
    Math.round((situacao.diasNaEmpresa / ULTIMO_MARCO) * 100)
  );
}

/* ------------------------------------------------------------------ *
 * Indicadores
 * ------------------------------------------------------------------ */

export type IndicadoresDoAcompanhamento = {
  /** Todo mundo que a empresa disse ter contratado e o IEL acompanha. */
  contratados: number;
  /** Quem já passou dos 90 dias: só esses tiveram tempo de "ficar". */
  passaramDos90: number;
  /** Dos que passaram dos 90, quantos continuam pelo que se sabe. */
  ficaram: number;
  /** Saídas antes dos 90, de qualquer fonte. */
  sairam: number;
  /** Das saídas, quantas só a pessoa contou. */
  sairamSoPelaPessoa: number;
};

/**
 * Uma passada só sobre a fila: os três cartões do topo.
 *
 * "Ficaram" só conta quem já passou dos 90 dias: dizer "2 de 3 ficaram"
 * quando ninguém chegou aos 90 seria inventar um resultado. "Saíram" conta
 * qualquer saída — e o rodapé diz quantas a empresa nunca avisou, que é o
 * dado que a segunda fonte trouxe.
 */
export function indicadores(
  fila: SituacaoDeContratacao[]
): IndicadoresDoAcompanhamento {
  const totais: IndicadoresDoAcompanhamento = {
    contratados: fila.length,
    passaramDos90: 0,
    ficaram: 0,
    sairam: 0,
    sairamSoPelaPessoa: 0
  };
  for (const situacao of fila) {
    if (situacao.permanencia.estado === 'saiu') {
      totais.sairam += 1;
      if (situacao.porFonte.empresa === null) totais.sairamSoPelaPessoa += 1;
      continue;
    }
    if (situacao.diasNaEmpresa >= ULTIMO_MARCO) {
      totais.passaramDos90 += 1;
      if (situacao.permanencia.estado === 'continua') totais.ficaram += 1;
    }
  }
  return totais;
}

/* ------------------------------------------------------------------ *
 * Roteiro da ligação
 * ------------------------------------------------------------------ */

export type RoteiroDaLigacao = {
  /** As falas, na ordem, para a analista ler ao telefone. */
  falas: string[];
  /** O lembrete que fica para a analista, não para ler. */
  lembrete: string;
};

/**
 * O roteiro curto da ligação, montado do contexto: a pessoa, o marco e o
 * que ela já respondeu. Mesma forma do roteiro da empresa (cinco perguntas
 * fixas em `companies-screens.tsx`), só que aqui a fala muda com a situação
 * — ligar para quem não respondeu não é a mesma conversa que ligar para quem
 * contou que saiu.
 *
 * A última fala é sempre a mesma: o que a pessoa contar fica no IEL. É a
 * condição para ela contar a verdade.
 */
export function roteiroDaLigacao(entrada: {
  situacao: SituacaoDeContratacao;
  primeiroNome: string;
  empresa: string;
  vaga: string;
}): RoteiroDaLigacao {
  const { situacao, primeiroNome, empresa, vaga } = entrada;
  const estado = estadoDaLinha(situacao);
  const ultimo = situacao.checkIns.at(-1);
  const falas: string[] = [
    `Oi, ${primeiroNome}, aqui é do IEL. Faz ${plural(situacao.diasNaEmpresa, 'dia', 'dias')} que você começou como ${vaga.toLowerCase()} na ${empresa}, e eu queria saber como está sendo.`
  ];

  switch (estado) {
    case 'ligar-hoje': {
      const marco = situacao.pendentes[0] ?? situacao.marcoAtual ?? 30;
      falas.push(
        `Mandamos uma pergunta rápida pelo celular aos ${rotuloDoMarco(marco)} e não chegou resposta — tudo bem, é só me contar agora: você continua na empresa? Como está sendo?`
      );
      break;
    }
    case 'saiu-so-a-pessoa':
    case 'saiu':
      falas.push(
        ultimo?.comentario
          ? `Você contou que saiu e escreveu: “${ultimo.comentario}”. Queria entender melhor o que aconteceu.`
          : 'Você contou que saiu. Queria entender melhor o que aconteceu.'
      );
      falas.push(
        'O IEL continua com você: se quiser, já olho outras vagas na sua cidade.'
      );
      break;
    case 'divergencia':
      falas.push(
        situacao.porFonte.pessoa === 'saiu'
          ? 'Você contou que saiu, e a empresa registrou que você continua. Queria só confirmar com você como está.'
          : 'A empresa registrou que você saiu, e você contou que continua. Queria só confirmar com você como está.'
      );
      break;
    case 'sem-resposta':
      falas.push(
        'As perguntas do IEL passaram e não chegou resposta — sem problema. Me conta agora: você continua na empresa? Como está sendo?'
      );
      break;
    default:
      falas.push(
        ultimo
          ? `Da última vez você disse que estava ${COMO_ESTA_SENDO_LABEL[ultimo.comoEstaSendo].toLowerCase()}. Continua assim?`
          : 'Você continua na empresa? Como está sendo?'
      );
  }

  falas.push(
    'O que você me contar fica só com o IEL. A empresa não vê o que você responde.'
  );

  return {
    falas,
    lembrete:
      'O que a pessoa disser fica registrado aqui, para o IEL. Nada disso vai para a empresa, nem por telefone.'
  };
}
