/**
 * Mind: o assistente da analista, em respostas montadas por regra fixa.
 *
 * O Mind não inventa frase nem produz nota. Cada resposta sai dos mesmos
 * seletores que as telas usam — ranking da vaga, aderência por ponto, perfil
 * da empresa, fila do dia —, só que contada em duas ou três frases. É por
 * isso que ele funciona sem modelo de linguagem e sem custo por pergunta
 * (R7): a pergunta é um botão, e a resposta é uma leitura do estado.
 *
 * Três limites valem para todas as respostas:
 *
 * - **Nunca recomenda contratar.** Quem contrata é a empresa, e quem escolhe
 *   quem vai é a analista. O texto termina devolvendo a decisão.
 * - **Nunca cria número.** Só repete o % que a tela já mostra.
 * - **Nome sai mascarado** ("Helena C.") e contato não sai nunca: a conversa
 *   é um lugar onde o texto se copia fácil, e o contato tem ação própria,
 *   registrada, na tabela da vaga (PRODUTO.md §5).
 */

import { ADHERENCE_THRESHOLD } from '../analysis/adherence';
import {
  getAderenciaVsPermanencia,
  getOndeOCandidatoPara,
  MIN_RECORTE,
  PERIODO_LABEL
} from '../analysis/analytics';
import { getCandidateFitOptionLabel } from '../analysis/candidate-questionnaire';
import { getCultureQuestion, MIN_TEAM_RESPONSES } from '../analysis/culture';
import { FIT_AXES, getFitAxis, type FitAxisId } from '../analysis/fit-axes';
import { AXIS_LABEL } from '../copy';
import { plural } from '../format';
import {
  getAdherence,
  getCompany,
  getCompanyCultureProfile,
  getCultureSampleProgress,
  getJob,
  getJobRanking,
  getJobsByCompany,
  REFERRAL_LIMIT,
  type JobRankingEntry
} from '../state/selectors';
import type { DemoState } from '../types';

export type MindContextoTipo =
  | 'hoje'
  | 'vaga'
  | 'empresa'
  | 'candidatos'
  | 'bi';

export type MindContexto = {
  tipo: MindContextoTipo;
  /** Id da vaga (`vaga`) ou da empresa (`empresa`). */
  id?: string;
};

/** Quem montou a resposta: a regra fixa ou um modelo, pelo nome. */
export type MindOrigem = { tipo: 'regra' } | { tipo: 'modelo'; nome: string };

export type MindResposta = {
  paragrafos: string[];
  /** Lista curta (até 5), quando a resposta é uma lista de pessoas ou itens. */
  itens?: string[];
  /** De onde vieram os dados: nome da vaga, empresa, "90 candidaturas". */
  fontes: string[];
  origem: MindOrigem;
  /** Frase que devolve a decisão à analista, quando cabe. */
  fecho?: string;
};

/**
 * A fila do dia, como o Mind a recebe.
 *
 * A fila é montada em `components/iel-demo/overview/pendencias.ts` (a mesma
 * da tela Hoje e do contador da barra lateral). O Mind recebe o resultado em
 * vez de importar o módulo, para `features/` não depender de `components/`.
 */
export type MindPendencia = {
  /** O tipo da fila (`envio`, `cultura`…), como em `pendencias.ts`. */
  tipo: string;
  titulo: string;
  resumo: string;
  verbo: string;
};

export type MindExtras = {
  pendencias?: MindPendencia[];
};

export type MindPergunta = {
  id: string;
  texto: string;
};

const DECISAO = 'A decisão é sua.';

const REGRA: MindOrigem = { tipo: 'regra' };

/* ------------------------------------------------------------------ *
 * Texto
 * ------------------------------------------------------------------ */

/** "Helena Castro" → "Helena C.": o suficiente para a analista reconhecer. */
export function nomeMascarado(nome: string | null | undefined): string {
  if (!nome) return 'Pessoa sem nome';
  const partes = nome.trim().split(/\s+/);
  const primeiro = partes[0] ?? nome;
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : null;
  return ultimo ? `${primeiro} ${ultimo.charAt(0)}.` : primeiro;
}

function pct(valor: number | null): string {
  return valor === null ? 'sem resposta' : `${Math.round(valor)}%`;
}

/** Minúsculas e sem acento, para casar palavra-chave com o que foi digitado. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const PALAVRAS_DE_CONTATO = [
  'telefone',
  'fone',
  'celular',
  'whatsapp',
  'zap',
  'email',
  'e-mail',
  'contato',
  'endereco',
  'cpf',
  'numero dela',
  'numero dele',
  'ligar para'
];

/**
 * A pergunta pede contato de alguém?
 *
 * Detecção por palavra, sem acento e sem caixa. É deliberadamente larga: uma
 * recusa a mais custa uma frase; um contato vazado não se desfaz.
 */
export function pedeContato(texto: string): boolean {
  const limpo = normalizar(texto);
  return PALAVRAS_DE_CONTATO.some((palavra) => limpo.includes(palavra));
}

export const RECUSA_DE_CONTATO =
  'Por padrão eu não mostro contato aqui na conversa. Se precisar, use a ação na tabela da vaga: o acesso fica registrado no seu nome.';

export const SEM_MODELO =
  'Sem modelo de linguagem ligado, respondo pelas perguntas sugeridas.';

/* ------------------------------------------------------------------ *
 * Rota → contexto
 * ------------------------------------------------------------------ */

/**
 * Qual contexto o Mind usa em cada tela do analista.
 *
 * `/iel/bi` ainda não existe em `@workspace/routes`; quando entrar, é só
 * trocar a string pela rota do pacote.
 */
export function contextoDaRota(pathname: string): MindContexto {
  const partes = pathname.split('?')[0]!.split('/').filter(Boolean);
  const indice = partes.indexOf('iel');
  const [secao, id] = indice >= 0 ? partes.slice(indice + 1) : [];

  if (secao === 'vagas' && id) {
    return { tipo: 'vaga', id: decodeURIComponent(id) };
  }
  if (secao === 'empresas' && id) {
    return { tipo: 'empresa', id: decodeURIComponent(id) };
  }
  if (secao === 'talentos') return { tipo: 'candidatos' };
  if (secao === 'bi') return { tipo: 'bi' };
  return { tipo: 'hoje' };
}

/* ------------------------------------------------------------------ *
 * Saudação e perguntas sugeridas
 * ------------------------------------------------------------------ */

function rankingDaVaga(state: DemoState, jobId: string) {
  const ranking = getJobRanking(state, jobId);
  const compativeis = ranking.filter(
    (entry) => entry.adherence.compatible === true
  );
  // Quem ficou abaixo do corte e tem o melhor requisito: é o caso que a
  // analista mais estranha ("mas ela é boa!") e o que o Mind precisa explicar.
  const abaixo = ranking
    .filter((entry) => entry.belowThreshold)
    .sort((a, b) => (b.technicalMatch ?? -1) - (a.technicalMatch ?? -1));
  return { ranking, compativeis, abaixoDestaque: abaixo[0] ?? null };
}

export function saudacaoDoMind(contexto: MindContexto): string {
  if (contexto.tipo === 'vaga' && contexto.id) {
    const job = getJob(contexto.id);
    const empresa = job ? getCompany(job.companyId) : null;
    if (job) {
      return `Oi! Estou com a vaga ${job.title}${empresa ? `, da ${empresa.name}` : ''} aberta aqui.`;
    }
  }
  if (contexto.tipo === 'empresa' && contexto.id) {
    const empresa = getCompany(contexto.id);
    if (empresa) return `Oi! Estou olhando a ${empresa.name} com você.`;
  }
  if (contexto.tipo === 'candidatos') {
    return 'Oi! Posso contar por onde passam os candidatos.';
  }
  if (contexto.tipo === 'bi') {
    return 'Oi! Posso ler os indicadores com você.';
  }
  return 'Oi! Posso te ajudar a começar o dia.';
}

/** Até 3 perguntas por contexto (DESIGN.md §2: até 3 chips). */
export function perguntasSugeridas(
  state: DemoState,
  contexto: MindContexto
): MindPergunta[] {
  if (contexto.tipo === 'vaga' && contexto.id) {
    const job = getJob(contexto.id);
    if (!job) return [];
    const empresa = getCompany(job.companyId);
    const { compativeis, abaixoDestaque } = rankingDaVaga(state, job.id);
    const perguntas: MindPergunta[] = [
      {
        id: 'vaga-quem-mando',
        texto: `Quem eu mando para ${empresa ? `a ${empresa.name}` : 'a empresa'}?`
      }
    ];
    if (abaixoDestaque) {
      perguntas.push({
        id: 'vaga-abaixo',
        texto: `Por que ${nomeMascarado(abaixoDestaque.talent?.name)} ficou abaixo de ${ADHERENCE_THRESHOLD}%?`
      });
    }
    const primeiro = compativeis[0];
    if (primeiro) {
      perguntas.push({
        id: 'vaga-resumo',
        texto: `Resume ${nomeMascarado(primeiro.talent?.name)} pra mim`
      });
    }
    return perguntas;
  }

  if (contexto.tipo === 'empresa' && contexto.id) {
    const empresa = getCompany(contexto.id);
    if (!empresa) return [];
    return [
      {
        id: 'empresa-em-aberto',
        texto: `Quais pontos da ${empresa.name} estão em aberto?`
      },
      {
        id: 'empresa-quem-respondeu',
        texto: 'Quantas pessoas já responderam?'
      },
      {
        id: 'empresa-diferente',
        texto: 'Onde gestão e equipe respondem diferente?'
      }
    ];
  }

  if (contexto.tipo === 'candidatos') {
    return [{ id: 'candidatos-onde-para', texto: 'Onde o candidato para?' }];
  }

  if (contexto.tipo === 'bi') {
    return [{ id: 'bi-fit-funciona', texto: 'O fit está funcionando?' }];
  }

  return [
    { id: 'hoje-o-que', texto: 'O que precisa de mim hoje?' },
    { id: 'hoje-envio', texto: 'Qual vaga já pode enviar currículos?' },
    { id: 'hoje-empresas', texto: 'Quais empresas estão com perfil aberto?' }
  ];
}

/* ------------------------------------------------------------------ *
 * Respostas
 * ------------------------------------------------------------------ */

function fontesDaVaga(state: DemoState, jobId: string): string[] {
  const job = getJob(jobId);
  if (!job) return [];
  const empresa = getCompany(job.companyId);
  const total = getJobRanking(state, jobId).length;
  return [
    job.title,
    ...(empresa ? [empresa.name] : []),
    plural(total, 'candidatura', 'candidaturas')
  ];
}

/** A alternativa da empresa mais próxima da média: "o que a empresa pratica". */
function praticaDaEmpresa(axisId: FitAxisId, media: number): string | null {
  const pergunta = getCultureQuestion(axisId);
  if (!pergunta) return null;
  const maisPerto = pergunta.options.reduce((melhor, opcao) =>
    Math.abs(opcao.value - media) < Math.abs(melhor.value - media)
      ? opcao
      : melhor
  );
  return maisPerto.label;
}

function linhaDePessoa(entry: JobRankingEntry): string {
  const requisitos =
    entry.technicalMatch === null
      ? 'requisitos sem dado'
      : `requisitos ${entry.technicalMatch}%`;
  return `${nomeMascarado(entry.talent?.name)} — ${pct(entry.adherence.total)} combina com a empresa · ${requisitos}`;
}

function responderVaga(
  state: DemoState,
  jobId: string,
  perguntaId: string
): MindResposta {
  const job = getJob(jobId);
  const fontes = fontesDaVaga(state, jobId);
  if (!job) {
    return {
      paragrafos: ['Não achei esta vaga na base.'],
      fontes,
      origem: REGRA
    };
  }
  const empresa = getCompany(job.companyId);
  const { compativeis, abaixoDestaque } = rankingDaVaga(state, jobId);

  if (perguntaId === 'vaga-quem-mando') {
    if (compativeis.length === 0) {
      return {
        paragrafos: [
          `Ninguém nesta vaga passou de ${ADHERENCE_THRESHOLD}% ainda. Pode ser que faltem respostas, da empresa ou dos candidatos.`
        ],
        fontes,
        origem: REGRA,
        fecho: DECISAO
      };
    }
    const cinco = compativeis.slice(0, REFERRAL_LIMIT);
    return {
      paragrafos: [
        `${plural(compativeis.length, 'pessoa passa', 'pessoas passam')} de ${ADHERENCE_THRESHOLD}%. Estas são as ${cinco.length} primeiras, na ordem da tela:`
      ],
      itens: cinco.map(linhaDePessoa),
      fontes,
      origem: REGRA,
      fecho: `A ordem é por quanto combina com ${empresa ? `a ${empresa.name}` : 'a empresa'}; os requisitos ficam ao lado para você cruzar. Quem vai, você escolhe.`
    };
  }

  if (perguntaId === 'vaga-abaixo') {
    if (!abaixoDestaque) {
      return {
        paragrafos: [
          `Ninguém nesta vaga ficou abaixo de ${ADHERENCE_THRESHOLD}%.`
        ],
        fontes,
        origem: REGRA
      };
    }
    const nome = nomeMascarado(abaixoDestaque.talent?.name);
    const adesao = getAdherence(state, abaixoDestaque.application.id);
    const diferencas = (adesao?.byAxis ?? [])
      .filter(
        (axis) =>
          axis.gap !== null &&
          axis.gap > 0 &&
          axis.companyMean !== null &&
          axis.candidateValue !== null
      )
      .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0))
      .slice(0, 3)
      .map((axis) => {
        const empresaFaz = praticaDaEmpresa(axis.axisId, axis.companyMean!);
        const pessoaPrefere = getCandidateFitOptionLabel(
          axis.axisId,
          axis.candidateValue!
        );
        return `${AXIS_LABEL[axis.axisId]}: a empresa pratica “${empresaFaz ?? 'sem resposta'}”; ${nome} prefere “${pessoaPrefere}”.`;
      });

    return {
      paragrafos: [
        `${nome} tem o melhor requisito entre quem ficou abaixo do corte (${abaixoDestaque.technicalMatch ?? '—'}%), mas combina ${pct(abaixoDestaque.adherence.total)} com a empresa.`,
        diferencas.length > 0
          ? 'Os pontos do dia a dia em que mais difere:'
          : 'Não há um ponto que se destaque: a diferença está espalhada.'
      ],
      itens: diferencas,
      fontes,
      origem: REGRA,
      fecho:
        'Ficar abaixo do mínimo não tira ninguém da vaga. Se esses pontos têm acordo possível, vale uma conversa. A decisão é sua.'
    };
  }

  // vaga-resumo
  const primeiro = compativeis[0];
  if (!primeiro) {
    return {
      paragrafos: [
        `Ninguém passou de ${ADHERENCE_THRESHOLD}% ainda, então não tenho quem resumir.`
      ],
      fontes,
      origem: REGRA
    };
  }
  const nome = nomeMascarado(primeiro.talent?.name);
  const eixos = getAdherence(state, primeiro.application.id)?.byAxis ?? [];
  const combina = eixos
    .filter((axis) => axis.adherence !== null && axis.adherence >= 75)
    .map((axis) => AXIS_LABEL[axis.axisId].toLowerCase());
  const conversar = eixos
    .filter((axis) => axis.adherence === null || axis.adherence < 75)
    .sort((a, b) => (a.adherence ?? -1) - (b.adherence ?? -1));
  const pontoDaConversa = conversar[0] ?? null;
  const pergunta = pontoDaConversa
    ? getFitAxis(pontoDaConversa.axisId).talentQuestion
    : (FIT_AXES[0]?.talentQuestion ?? '');

  return {
    paragrafos: [
      `${nome} é a primeira da vaga: ${pct(primeiro.adherence.total)} combina com a empresa, requisitos ${primeiro.technicalMatch ?? '—'}%.`,
      combina.length > 0
        ? `Combina em ${combina.join(', ')}.`
        : 'Não há ponto em que combine com folga.',
      conversar.length > 0
        ? `Vale uma conversa sobre ${conversar
            .slice(0, 2)
            .map((axis) => AXIS_LABEL[axis.axisId].toLowerCase())
            .join(' e ')}.`
        : 'Não sobrou ponto que peça conversa.',
      `Uma pergunta para a entrevista: “${pergunta}”`
    ],
    fontes,
    origem: REGRA,
    fecho: DECISAO
  };
}

function responderEmpresa(
  state: DemoState,
  companyId: string,
  perguntaId: string
): MindResposta {
  const empresa = getCompany(companyId);
  const amostra = getCultureSampleProgress(state, companyId);
  const perfil = getCompanyCultureProfile(state, companyId);
  const vagas = getJobsByCompany(companyId).length;
  const fontes = [
    ...(empresa ? [empresa.name] : []),
    plural(amostra.total, 'convite', 'convites'),
    plural(vagas, 'vaga', 'vagas')
  ];

  if (!empresa) {
    return {
      paragrafos: ['Não achei esta empresa na base.'],
      fontes,
      origem: REGRA
    };
  }

  if (perguntaId === 'empresa-quem-respondeu') {
    if (amostra.total === 0) {
      return {
        paragrafos: [
          `Ninguém da ${empresa.name} foi convidado ainda. O convite sai pela aba Colaboradores.`
        ],
        fontes,
        origem: REGRA
      };
    }
    const { equipe, gestao, rh } = amostra.byRole;
    return {
      paragrafos: [
        `${amostra.answered} de ${amostra.total} responderam.`,
        amostra.ready
          ? `A equipe já passou do mínimo de ${MIN_TEAM_RESPONSES}: o perfil fecha.`
          : `Da equipe, ${equipe.answered} de ${equipe.total}. O perfil só fecha com ${MIN_TEAM_RESPONSES} respostas da equipe.`
      ],
      itens: [
        `Gestão: ${gestao.answered} de ${gestao.total}`,
        `RH: ${rh.answered} de ${rh.total}`,
        `Equipe: ${equipe.answered} de ${equipe.total}`
      ],
      fontes,
      origem: REGRA,
      fecho: 'Eu mostro só a contagem: quem respondeu o quê não fica guardado.'
    };
  }

  if (perguntaId === 'empresa-diferente') {
    const divergentes = perfil.filter(
      (axis) => axis.dispersion === 'divergente'
    );
    return {
      paragrafos: [
        divergentes.length > 0
          ? `Gestão e equipe respondem diferente em ${plural(divergentes.length, 'ponto', 'pontos')}:`
          : 'Gestão e equipe respondem parecido em tudo o que já tem resposta.'
      ],
      itens: divergentes.map((axis) => AXIS_LABEL[axis.axisId]),
      fontes,
      origem: REGRA,
      fecho:
        divergentes.length > 0
          ? 'Vale levar esses pontos para a próxima ligação com a empresa.'
          : undefined
    };
  }

  // empresa-em-aberto
  const abertos = perfil.filter((axis) => !axis.ready);
  const prazo =
    amostra.deadline && amostra.total > amostra.answered
      ? ` O prazo dos convites em aberto vai até ${amostra.deadline.slice(8, 10)}/${amostra.deadline.slice(5, 7)}.`
      : '';
  return {
    paragrafos: [
      abertos.length === 0
        ? `Os 5 pontos do dia a dia da ${empresa.name} já têm resposta suficiente.`
        : `${plural(abertos.length, 'ponto está', 'pontos estão')} em aberto: cada ponto precisa de pelo menos ${MIN_TEAM_RESPONSES} respostas da equipe.${prazo}`
    ],
    itens: abertos.map((axis) => AXIS_LABEL[axis.axisId]),
    fontes,
    origem: REGRA,
    fecho:
      abertos.length > 0
        ? 'Enquanto não fecha, esses pontos não entram no % de ninguém.'
        : undefined
  };
}

function responderHoje(
  perguntaId: string,
  pendencias: MindPendencia[]
): MindResposta {
  const fontes = [
    'Tela Hoje',
    plural(pendencias.length, 'pendência', 'pendências')
  ];

  const filtro =
    perguntaId === 'hoje-envio'
      ? 'envio'
      : perguntaId === 'hoje-empresas'
        ? 'cultura'
        : null;
  const lista = filtro
    ? pendencias.filter((pendencia) => pendencia.tipo === filtro)
    : pendencias;

  if (lista.length === 0) {
    return {
      paragrafos: [
        filtro
          ? 'Nada nesse grupo agora.'
          : 'Nada esperando por você agora. Boa hora para importar a próxima planilha.'
      ],
      fontes,
      origem: REGRA
    };
  }

  const cinco = lista.slice(0, 5);
  const abertura =
    perguntaId === 'hoje-envio'
      ? `${plural(lista.length, 'vaga já tem', 'vagas já têm')} gente compatível e nenhum currículo enviado.`
      : perguntaId === 'hoje-empresas'
        ? `${plural(lista.length, 'empresa ainda não fechou', 'empresas ainda não fecharam')} o perfil.`
        : `${plural(lista.length, 'coisa espera', 'coisas esperam')} por você. As ${cinco.length} primeiras, na ordem da tela Hoje:`;

  return {
    paragrafos: [abertura],
    itens: cinco.map((pendencia) => `${pendencia.titulo}: ${pendencia.resumo}`),
    fontes,
    origem: REGRA,
    fecho:
      lista.length > cinco.length
        ? `O resto está na tela Hoje (${lista.length - cinco.length} a mais).`
        : undefined
  };
}

/**
 * Onde o candidato para, no último trimestre (mesma conta do painel).
 * Recorte com menos de 5 aberturas vem oculto, e o Mind diz isso.
 */
function responderCandidatos(state: DemoState): MindResposta {
  const onde = getOndeOCandidatoPara(state, 'trimestre');
  const fontes = [
    PERIODO_LABEL.trimestre,
    plural(onde.abertos, 'convite aberto', 'convites abertos')
  ];
  if (onde.oculto) {
    return {
      paragrafos: [
        `Menos de ${MIN_RECORTE} candidatos abriram o convite no período. Com tão pouca gente, eu não mostro onde cada um parou.`
      ],
      fontes,
      origem: REGRA
    };
  }
  const pontos = onde.pontos
    .filter((ponto) => ponto.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 3);
  return {
    paragrafos: [
      pontos.length === 0
        ? `Dos ${onde.abertos} que abriram o convite, ninguém parou no meio.`
        : `Dos ${onde.abertos} que abriram o convite, onde mais gente parou:`
    ],
    itens: pontos.map(
      (ponto) =>
        `${ponto.rotulo}: ${plural(ponto.n, 'pessoa', 'pessoas')}${ponto.pct === null ? '' : ` (${ponto.pct}%)`}`
    ),
    fontes,
    origem: REGRA,
    fecho:
      pontos.length > 0
        ? 'Quem ainda está no prazo não conta como parada.'
        : undefined
  };
}

/**
 * "O fit está funcionando?": permanência aos 90 dias por faixa de quanto a
 * pessoa combinava com a empresa na entrada. Faixa com menos de 5 fica oculta.
 */
function responderBi(): MindResposta {
  const faixas = getAderenciaVsPermanencia('trimestre');
  const visiveis = faixas.filter(
    (faixa) => !faixa.oculto && faixa.permanencia90Pct !== null
  );
  const apurados = faixas.reduce((soma, faixa) => soma + faixa.apurados, 0);
  const fontes = [
    PERIODO_LABEL.trimestre,
    plural(apurados, 'contratado apurado', 'contratados apurados')
  ];
  if (visiveis.length < 2) {
    return {
      paragrafos: [
        'Ainda não há contratados suficientes com 90 dias apurados para comparar as faixas. Volto a isso quando houver.'
      ],
      fontes,
      origem: REGRA
    };
  }
  const baixa = visiveis[0]!;
  const alta = visiveis[visiveis.length - 1]!;
  const sobe = (alta.permanencia90Pct ?? 0) > (baixa.permanencia90Pct ?? 0);
  return {
    paragrafos: [
      sobe
        ? 'Parece que sim: quem entrou combinando mais com a empresa fica mais.'
        : 'Ainda não dá para dizer que sim: a permanência não sobe junto com o quanto a pessoa combinava.',
      'Quem continua na empresa aos 90 dias, por faixa na entrada:'
    ],
    itens: faixas.map((faixa) =>
      faixa.oculto || faixa.permanencia90Pct === null
        ? `${faixa.rotulo}%: menos de ${MIN_RECORTE} pessoas, não mostro`
        : `${faixa.rotulo}%: ${faixa.permanencia90Pct}% ficaram (${faixa.ficaram} de ${faixa.apurados})`
    ),
    fontes,
    origem: REGRA,
    fecho:
      'Isso mostra uma tendência, não causa. Vale olhar junto com o retorno das empresas.'
  };
}

/** Resposta a uma pergunta sugerida. */
export function responderMind(
  state: DemoState,
  contexto: MindContexto,
  perguntaId: string,
  extras: MindExtras = {}
): MindResposta {
  if (contexto.tipo === 'vaga' && contexto.id) {
    return responderVaga(state, contexto.id, perguntaId);
  }
  if (contexto.tipo === 'empresa' && contexto.id) {
    return responderEmpresa(state, contexto.id, perguntaId);
  }
  if (contexto.tipo === 'candidatos') return responderCandidatos(state);
  if (contexto.tipo === 'bi') return responderBi();
  return responderHoje(perguntaId, extras.pendencias ?? []);
}

/**
 * Para a pergunta livre: qual das três leituras da API ela pede.
 * "compar…" → comparar; "falta", "perguntar", "lacuna" → o que falta
 * perguntar; o resto → resumo.
 */
export function tipoDaPerguntaLivre(
  texto: string
): 'resumir-selecao' | 'comparar-selecionados' | 'mostrar-lacunas' {
  const limpo = normalizar(texto);
  if (limpo.includes('compar')) return 'comparar-selecionados';
  if (
    limpo.includes('falta') ||
    limpo.includes('pergunt') ||
    limpo.includes('lacuna')
  ) {
    return 'mostrar-lacunas';
  }
  return 'resumir-selecao';
}

/** A vaga que a pergunta livre usa: a do contexto ou a primeira da empresa. */
export function vagaDoContexto(contexto: MindContexto): string | null {
  if (contexto.tipo === 'vaga' && contexto.id) return contexto.id;
  if (contexto.tipo === 'empresa' && contexto.id) {
    return getJobsByCompany(contexto.id)[0]?.id ?? null;
  }
  return null;
}

/** Até 3 candidaturas compatíveis da vaga, para o pedido da API. */
export function candidaturasParaPergunta(
  state: DemoState,
  jobId: string
): string[] {
  return rankingDaVaga(state, jobId)
    .compativeis.slice(0, 3)
    .map((entry) => entry.application.id);
}
