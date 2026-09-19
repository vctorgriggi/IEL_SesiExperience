import { ALL_COMPANIES, ALL_TALENTS } from '../fixtures';
import { getCompany, getJob } from '../state/selectors';
import type { AssistantRequest } from './types';

/**
 * Pseudonimização do que sai para um provedor de IA externo.
 *
 * Um modelo de terceiro (DeepSeek, Anthropic) processa o texto fora do
 * Brasil: é transferência internacional (LGPD, art. 33). Por isso nada que
 * identifique pessoa sai do servidor (PRODUTO.md §5, "IA de terceiros"):
 *
 * - nome de candidato vira "Pessoa A", "Pessoa B"… (nome completo, primeiro
 *   nome, sobrenome e a forma mascarada "Helena C.");
 * - nome de outra pessoa da base vira "outra pessoa";
 * - nome da empresa vira "a empresa"; o contato dela vira "o contato da
 *   empresa"; outra empresa da base vira "outra empresa";
 * - e-mail, telefone, CPF, data (nascimento incluso) e cidade são removidos;
 * - id de candidatura vira o rótulo da pessoa, e id de registro vira "R1",
 *   "R2"… (os ids da base carregam o primeiro nome: `EVD-ANA-01`).
 *
 * O mapa de volta vive só neste objeto, em memória, durante a requisição.
 * Nada dele é gravado nem sai do servidor; na resposta, `reverter` troca os
 * rótulos pelo nome mascarado antes de chegar à tela.
 */
export type Pseudonimo = {
  /** Limpa um texto que vai sair do servidor. */
  limpar(texto: string): string;
  /** Limpa, em profundidade, todo texto de um objeto que vai sair. */
  limparTudo<T>(valor: T): T;
  /** "Pessoa A" para a candidatura, ou `null` se ela não está no pedido. */
  rotuloDaCandidatura(applicationId: string): string | null;
  /** "R1" para o registro (evidência). */
  rotuloDoRegistro(evidenceId: string): string;
  /** O id original de um "R1", ou `null` se o modelo inventou o rótulo. */
  registroOriginal(rotulo: string): string | null;
  /** Troca os rótulos "Pessoa A" pelo nome como a tela o mostra. */
  reverter(texto: string): string;
};

const UFS =
  'AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO';

/**
 * Rodam antes dos nomes. Ordem importa: CPF antes de telefone, que também é
 * uma fila de dígitos.
 */
const PADROES: Array<[RegExp, string]> = [
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, '[e-mail removido]'],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF removido]'],
  [
    /(?:\+?55[\s-]?)?\(?\b\d{2}\)?[\s-]?9?\d{4}[\s-]?\d{4}\b/g,
    '[telefone removido]'
  ],
  [/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, '[data removida]'],
  [
    /\b\d{1,2}º?\s+de\s+(?:janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+\d{4})?\b/gi,
    '[data removida]'
  ],
  [
    new RegExp(
      `\\p{Lu}[\\p{L}'-]+(?:\\s(?:d[aeo]s?\\s)?\\p{Lu}[\\p{L}'-]+)*\\s?[,/-]\\s?(?:${UFS})\\b`,
      'gu'
    ),
    '[cidade removida]'
  ]
];

const PREPOSICAO_DA_EMPRESA: Record<string, string> = {
  da: 'da',
  de: 'da',
  do: 'da',
  na: 'na',
  no: 'na',
  em: 'na',
  à: 'à',
  a: 'a',
  pela: 'pela',
  pelo: 'pela'
};

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Casa a palavra inteira, sem caixa, respeitando acento na fronteira. */
function palavra(texto: string): RegExp {
  return new RegExp(
    `(?<![\\p{L}\\p{N}])${escapar(texto)}(?![\\p{L}\\p{N}])`,
    'giu'
  );
}

/** "Helena Castro" → "Helena C.": como a tela e o Mind mostram o nome. */
export function mascararNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeiro = partes[0] ?? nome;
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : null;
  return ultimo ? `${primeiro} ${ultimo.charAt(0)}.` : primeiro;
}

/** Nome completo, forma mascarada e cada parte com 3+ letras, maior primeiro. */
function formasDoNome(nome: string): string[] {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length >= 3 && !/^d[aeo]s?$/i.test(parte));
  const formas = new Set([nome.trim(), mascararNome(nome), ...partes]);
  return [...formas].filter(Boolean).sort((a, b) => b.length - a.length);
}

function letra(indice: number): string {
  const base = String.fromCharCode(65 + (indice % 26));
  return indice < 26 ? base : `${base}${Math.floor(indice / 26) + 1}`;
}

type Troca = { regex: RegExp; por: string | ((trecho: string) => string) };

export function criarPseudonimo(request: AssistantRequest): Pseudonimo {
  const talentoPorCandidatura = new Map(
    request.applications.map((application) => [
      application.id,
      application.talentId
    ])
  );
  const doContexto = new Map(
    (request.contexto?.candidatos ?? []).map((candidato) => [
      candidato.applicationId,
      candidato
    ])
  );

  // A ordem dos rótulos segue a do pedido: primeiro as selecionadas, depois
  // as demais pessoas do contexto.
  const ordem = [
    ...request.applicationIds,
    ...(request.contexto?.candidatos ?? []).map((c) => c.applicationId)
  ].filter((id, indice, todos) => todos.indexOf(id) === indice);

  const rotulos = new Map<string, string>();
  const nomeNaTela = new Map<string, string>();
  const trocas: Troca[] = [];
  const cidades = new Set<string>();

  ordem.forEach((applicationId, indice) => {
    const rotulo = `Pessoa ${letra(indice)}`;
    rotulos.set(applicationId, rotulo);

    const talentId =
      talentoPorCandidatura.get(applicationId) ??
      doContexto.get(applicationId)?.talentId;
    const talento = talentId
      ? ALL_TALENTS.find((entry) => entry.id === talentId)
      : undefined;
    const candidato = doContexto.get(applicationId);
    const nomes = [talento?.name, candidato?.nome].filter(
      (nome): nome is string => Boolean(nome?.trim())
    );

    const principal = nomes[0];
    nomeNaTela.set(rotulo, principal ? mascararNome(principal) : rotulo);

    for (const nome of nomes) {
      for (const forma of formasDoNome(nome)) {
        trocas.push({ regex: palavra(forma), por: rotulo });
      }
    }
    if (talento?.city) cidades.add(talento.city);
    if (candidato?.cidade) cidades.add(candidato.cidade);
  });

  // Empresa da vaga e o contato dela.
  const job = getJob(request.jobId);
  const empresa = job ? getCompany(job.companyId) : null;
  const nomesDaEmpresa = [empresa?.name, request.contexto?.empresa].filter(
    (nome): nome is string => Boolean(nome?.trim())
  );
  for (const nome of nomesDaEmpresa) {
    const prep = Object.keys(PREPOSICAO_DA_EMPRESA).join('|');
    trocas.push({
      regex: new RegExp(
        `(?<![\\p{L}])(?:(${prep})\\s+)?${escapar(nome.trim())}(?![\\p{L}\\p{N}])`,
        'giu'
      ),
      por: (trecho) => {
        const inicio = trecho.split(/\s+/)[0]?.toLowerCase() ?? '';
        const troca = PREPOSICAO_DA_EMPRESA[inicio];
        return troca ? `${troca} empresa` : 'a empresa';
      }
    });
  }
  if (empresa?.contactName) {
    trocas.push({
      regex: palavra(empresa.contactName),
      por: 'o contato da empresa'
    });
  }
  if (empresa?.location) cidades.add(empresa.location);
  if (job?.location) cidades.add(job.location);

  for (const cidade of cidades) {
    trocas.push({ regex: palavra(cidade), por: '[cidade removida]' });
    const soACidade = cidade.split(/[,/-]/)[0]?.trim();
    if (soACidade && soACidade.length >= 3) {
      trocas.push({ regex: palavra(soACidade), por: '[cidade removida]' });
    }
  }

  // Qualquer outro nome da base que apareça num texto livre.
  const outrosTalentos = ALL_TALENTS.map((talento) => talento.name).filter(
    (nome) => nome.trim().length > 0
  );
  const outrasEmpresas = ALL_COMPANIES.filter(
    (company) => company.id !== empresa?.id
  );

  const registros = new Map<string, string>();
  const registrosDeVolta = new Map<string, string>();

  const limpar = (texto: string): string => {
    // Padrões primeiro: um nome trocado no meio de um e-mail
    // ("ana.ribeiro@…") quebraria o casamento do e-mail.
    let saida = PADROES.reduce(
      (atual, [regex, por]) => atual.replace(regex, por),
      texto
    );
    for (const troca of trocas) {
      saida =
        typeof troca.por === 'string'
          ? saida.replace(troca.regex, troca.por)
          : saida.replace(troca.regex, troca.por);
    }
    for (const nome of outrosTalentos) {
      if (saida.includes(nome)) saida = saida.split(nome).join('outra pessoa');
    }
    for (const company of outrasEmpresas) {
      if (saida.includes(company.name)) {
        saida = saida.split(company.name).join('outra empresa');
      }
      if (company.contactName && saida.includes(company.contactName)) {
        saida = saida.split(company.contactName).join('outra pessoa');
      }
    }
    return saida;
  };

  const limparTudo = <T>(valor: T): T => {
    if (typeof valor === 'string') return limpar(valor) as T;
    if (Array.isArray(valor)) return valor.map((item) => limparTudo(item)) as T;
    if (valor && typeof valor === 'object') {
      return Object.fromEntries(
        Object.entries(valor).map(([chave, item]) => [chave, limparTudo(item)])
      ) as T;
    }
    return valor;
  };

  return {
    limpar,
    limparTudo,
    rotuloDaCandidatura: (applicationId) => rotulos.get(applicationId) ?? null,
    rotuloDoRegistro(evidenceId) {
      const existente = registros.get(evidenceId);
      if (existente) return existente;
      const rotulo = `R${registros.size + 1}`;
      registros.set(evidenceId, rotulo);
      registrosDeVolta.set(rotulo, evidenceId);
      return rotulo;
    },
    registroOriginal: (rotulo) => registrosDeVolta.get(rotulo.trim()) ?? null,
    reverter(texto) {
      // Maior rótulo primeiro: "Pessoa A2" antes de "Pessoa A".
      const pares = [...nomeNaTela.entries()].sort(
        (a, b) => b[0].length - a[0].length
      );
      return pares.reduce(
        (saida, [rotulo, nome]) => saida.replace(palavra(rotulo), nome),
        texto
      );
    }
  };
}
