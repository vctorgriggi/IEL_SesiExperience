import {
  COMO_ESTA_SENDO_LABEL,
  JANELA_DO_MARCO_DIAS,
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
 * divergência); aqui se decide *o que isso pede da analista* — ligar hoje,
 * ligar para a empresa, nada por enquanto — e com que palavras. A pessoa
 * nunca vira nota: "como está sendo" é o rótulo escrito do que ela disse.
 */

/* ------------------------------------------------------------------ *
 * O estado da linha
 * ------------------------------------------------------------------ */

/**
 * O que a linha pede, do mais urgente para o menos. A ordem aqui é a mesma
 * da fila (`getAcompanhamento`): pendência primeiro, depois o que pede uma
 * ligação para a empresa, depois o resto.
 */
export type EstadoDaLinha =
  | 'ligar-hoje'
  | 'saiu-so-a-pessoa'
  | 'divergencia'
  | 'saiu'
  | 'sem-resposta'
  | 'em-dia'
  | 'antes-dos-30';

export const ESTADO_DA_LINHA_LABEL: Record<EstadoDaLinha, string> = {
  'ligar-hoje': 'Ligar hoje',
  'saiu-so-a-pessoa': 'Saiu — só a pessoa avisou',
  divergencia: 'Empresa e pessoa dizem coisas diferentes',
  saiu: 'Saiu',
  'sem-resposta': 'Sem resposta',
  'em-dia': 'Em dia',
  'antes-dos-30': 'Antes dos 30 dias'
};

/**
 * Cor com significado (DESIGN.md §8): laranja pede uma ação hoje, vermelho
 * é quando os dois lados diferem — ou quando só um deles falou de uma saída
 * —, verde é quando a pessoa disse que está bem, cinza é sem dado.
 */
export const TOM_DO_ESTADO: Record<EstadoDaLinha, EstadoDeCor> = {
  'ligar-hoje': 'atencao',
  'saiu-so-a-pessoa': 'difere',
  divergencia: 'difere',
  saiu: 'neutro',
  'sem-resposta': 'neutro',
  'em-dia': 'combina',
  'antes-dos-30': 'neutro'
};

/**
 * O estado de uma linha, decidido na ordem em que a fila ordena.
 *
 * "Sem resposta" só quando o marco mais recente já alcançado fechou sem
 * resposta: quem respondeu aos 30 e perdeu os 60 não está "em dia", e a
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
 * Os três marcos com o estado de cada um, para a linha do tempo do detalhe.
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

/**
 * "aos 30 dias · aberto há 15" — a segunda linha da coluna de tempo. Diz em
 * que ponto do relógio a pessoa está e o que isso pede.
 */
export function relogioDaLinha(situacao: SituacaoDeContratacao): string {
  const pendente = situacao.pendentes[0];
  if (pendente !== undefined) {
    const aberto = situacao.diasNaEmpresa - pendente;
    return aberto === 0
      ? `aos ${rotuloDoMarco(pendente)} · abriu hoje`
      : `aos ${rotuloDoMarco(pendente)} · aberto há ${plural(aberto, 'dia', 'dias')}`;
  }
  if (situacao.permanencia.estado === 'saiu') return 'acompanhamento encerrado';
  const ultimoPerdido = situacao.perdidos.at(-1);
  const ultimoRespondido = situacao.checkIns.at(-1)?.marco ?? 0;
  if (ultimoPerdido !== undefined && ultimoPerdido > ultimoRespondido)
    return `aos ${rotuloDoMarco(ultimoPerdido)} · sem resposta em ${JANELA_DO_MARCO_DIAS} dias`;
  if (situacao.proximoMarco !== null) {
    const faltam = situacao.proximoMarco - situacao.diasNaEmpresa;
    return `próxima pergunta aos ${rotuloDoMarco(situacao.proximoMarco)}, em ${plural(faltam, 'dia', 'dias')}`;
  }
  return 'passou dos 90 dias';
}

/* ------------------------------------------------------------------ *
 * O que cada lado disse
 * ------------------------------------------------------------------ */

export type LeituraDaPessoa = {
  /** "Continua" / "Saiu" / "Ainda não respondeu". */
  titulo: string;
  /** "Muito bom · aos 60 dias", com o rótulo escrito, nunca o número. */
  detalhe: string | null;
  comentario: string | null;
};

/** A última resposta da pessoa, em palavras. Nunca o número da escala. */
export function leituraDaPessoa(
  situacao: SituacaoDeContratacao
): LeituraDaPessoa {
  const ultimo = situacao.checkIns.at(-1);
  if (!ultimo)
    return { titulo: 'Ainda não respondeu', detalhe: null, comentario: null };
  return {
    titulo: ultimo.continua ? 'Continua' : 'Saiu',
    detalhe: `${COMO_ESTA_SENDO_LABEL[ultimo.comoEstaSendo]} · aos ${rotuloDoMarco(ultimo.marco)}`,
    comentario: ultimo.comentario ?? null
  };
}

/**
 * O que a empresa disse depois do "contratei". Quando não disse nada, a
 * frase é "não informou" — nunca que a pessoa "denunciou" alguma coisa.
 */
export function leituraDaEmpresa(situacao: SituacaoDeContratacao): string {
  switch (situacao.porFonte.empresa) {
    case 'continua':
      return 'Continua';
    case 'saiu':
      return 'Saiu';
    default:
      return 'Não informou';
  }
}

/* ------------------------------------------------------------------ *
 * Indicadores e abas
 * ------------------------------------------------------------------ */

export type IndicadoresDoAcompanhamento = {
  emAcompanhamento: number;
  paraLigarHoje: number;
  continuam: number;
  sairam: number;
  /** Das saídas, quantas só a pessoa contou. */
  sairamSoPelaPessoa: number;
  empresaNaoInformou: number;
};

/** Uma passada só sobre a fila: os quatro cartões do topo. */
export function indicadores(
  fila: SituacaoDeContratacao[]
): IndicadoresDoAcompanhamento {
  const totais: IndicadoresDoAcompanhamento = {
    emAcompanhamento: fila.length,
    paraLigarHoje: 0,
    continuam: 0,
    sairam: 0,
    sairamSoPelaPessoa: 0,
    empresaNaoInformou: 0
  };
  for (const situacao of fila) {
    if (situacao.pendentes.length > 0) totais.paraLigarHoje += 1;
    if (situacao.permanencia.estado === 'continua') totais.continuam += 1;
    if (situacao.permanencia.estado === 'saiu') {
      totais.sairam += 1;
      if (situacao.porFonte.empresa === null) totais.sairamSoPelaPessoa += 1;
    }
    if (situacao.porFonte.empresa === null) totais.empresaNaoInformou += 1;
  }
  return totais;
}

export const ABAS_DO_ACOMPANHAMENTO = [
  'todos',
  'ligar-hoje',
  'sairam',
  'em-dia'
] as const;
export type AbaDoAcompanhamento = (typeof ABAS_DO_ACOMPANHAMENTO)[number];

export const ABA_LABEL: Record<AbaDoAcompanhamento, string> = {
  todos: 'Todos',
  'ligar-hoje': 'Ligar hoje',
  sairam: 'Saíram',
  'em-dia': 'Em dia'
};

/** A aba filtra pelo estado da linha, que já está calculado uma vez por linha. */
export function pertenceAAba(
  aba: AbaDoAcompanhamento,
  situacao: SituacaoDeContratacao,
  estado: EstadoDaLinha
): boolean {
  switch (aba) {
    case 'todos':
      return true;
    case 'ligar-hoje':
      return estado === 'ligar-hoje';
    case 'sairam':
      return situacao.permanencia.estado === 'saiu';
    case 'em-dia':
      return estado === 'em-dia';
  }
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
