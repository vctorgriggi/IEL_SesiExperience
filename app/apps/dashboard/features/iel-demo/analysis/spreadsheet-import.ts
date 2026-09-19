/**
 * Importação da planilha da Empregare (M6).
 *
 * ## Por que planilha
 *
 * É como o IEL trabalha hoje: o analista exporta da Empregare uma planilha por
 * vaga, com os candidatos e o percentual de match técnico já calculado lá, e
 * junta isso à mão com outros dois relatórios. A central de seleção substitui
 * a junção manual, não a origem do dado — o match técnico continua sendo da
 * Empregare, e esta camada não o recalcula nem o corrige.
 *
 * ## Contrato de evento futuro (API/webhook da Empregare)
 *
 * A planilha é a entrada de hoje, não o contrato. Quando a integração direta
 * existir, ela entrega os mesmos campos de `ImportRow` — um objeto por
 * candidatura — e nada mais muda: `buildImportPlan` e a ação
 * `import-spreadsheet` do reducer continuam iguais, porque nenhum dos dois
 * sabe que existiu um arquivo.
 *
 * Dois eventos cobrem o que a planilha traz hoje:
 *
 * - `candidatura.criada` → um `ImportRow` com `name`, `email`, `phone`,
 *   `city`, `jobTitle` e `technicalMatch` possivelmente `null` (o match ainda
 *   não foi calculado). Vira `novo-talento` ou `nova-candidatura`.
 * - `match.calculado` → um `ImportRow` da mesma candidatura com
 *   `technicalMatch` preenchido e, quando o filtro da vaga descartou a pessoa,
 *   `situation` preenchida. Vira `match-atualizado` ou `ignorada`.
 *
 * O adaptador do webhook monta `ParsedSpreadsheet` com `rows` vindas do corpo
 * do evento, `errors` vazio e `fingerprint` derivada do id do evento. A
 * idempotência é a mesma nos dois caminhos: a `fingerprint` já aplicada não
 * volta a ser aplicada.
 *
 * ## Formato esperado do arquivo
 *
 * Texto delimitado, uma linha por candidato, cabeçalho na primeira linha.
 *
 * - **Separador**: `;` ou `,`. Detectado no cabeçalho, contando apenas o que
 *   está fora de aspas — a exportação em pt-BR usa `;` porque a cidade vem
 *   como "Goiânia, GO".
 * - **BOM**: aceito e descartado. O Excel em Windows grava UTF-8 com BOM, e
 *   sem descartá-lo o nome da primeira coluna viria com um caractere
 *   invisível na frente e a coluna `nome` não seria encontrada.
 * - **Aspas**: campo entre `"` pode conter separador, quebra de linha e `""`
 *   como aspas literal (RFC 4180).
 * - **Fim de linha**: `\n` ou `\r\n`. Linhas em branco são ignoradas.
 * - **Cabeçalho**: em português, comparado sem acento, sem caixa e sem espaço
 *   sobrando. Cada coluna aceita os sinônimos de `COLUMN_ALIASES` porque a
 *   exportação muda de nome entre versões e nenhum analista vai renomear
 *   coluna à mão antes de subir o arquivo.
 *
 * | Coluna          | Obrigatória | Conteúdo                                      |
 * | --------------- | ----------- | --------------------------------------------- |
 * | `nome`          | sim         | Nome do candidato                             |
 * | `email`         | sim         | E-mail; é a chave de identidade da pessoa     |
 * | `telefone`      | não         | Telefone de contato                           |
 * | `cidade`        | não         | Cidade/UF                                     |
 * | `vaga`          | sim         | Título da vaga, conferido com a vaga de destino |
 * | `match_tecnico` | sim         | 0 a 100; aceita `82` e `82%`; vazio vira `null` |
 * | `situacao`      | não         | Ex.: "descartado pelo filtro"                 |
 *
 * `match_tecnico` vazio vira `null`, nunca zero: o filtro mal configurado da
 * Empregare expurga candidato aderente (R10), e tratar ausência como zero
 * reproduziria o problema dentro da central.
 *
 * Nada é lançado. Linha inválida vira `ImportError` com linha, coluna e
 * motivo, e a importação segue com as linhas que deram certo — uma planilha
 * de cinquenta candidatos não pode ser recusada inteira porque um telefone
 * veio em branco.
 */

import { ALL_JOBS, ALL_TALENTS } from '../fixtures';
import type { Application, DemoState, ExternalRef, Talent } from '../types';
import { hashHex } from './deterministic-hash';

/** Origem dos registros criados por esta importação. */
export const IMPORT_ORIGIN = 'empregare';

const IMPORT_SOURCE_SYSTEM = 'Empregare — planilha';

/**
 * O que a coluna `situacao` precisa conter para a linha ser lida como
 * descartada pelo filtro técnico da Empregare.
 */
const DISCARD_MARKERS = ['descartado', 'descartada', 'reprovado', 'eliminado'];

export type ImportRow = {
  /** Linha no arquivo, com o cabeçalho valendo 1. */
  line: number;
  name: string;
  /** Normalizado: minúsculo e sem espaço nas pontas. É a chave de identidade. */
  email: string;
  phone: string | null;
  city: string | null;
  jobTitle: string;
  /** 0..100, ou `null` quando a planilha não trouxe valor. */
  technicalMatch: number | null;
  situation: string | null;
  /** `situacao` indica descarte pelo filtro técnico da origem. */
  discarded: boolean;
};

export type ImportError = {
  line: number;
  column: string;
  reason: string;
};

export type ImportSummary = {
  /** Linhas de dado encontradas, válidas ou não. */
  dataLines: number;
  validRows: number;
  invalidRows: number;
  discardedRows: number;
  separator: string;
};

export type ParsedSpreadsheet = {
  rows: ImportRow[];
  errors: ImportError[];
  summary: ImportSummary;
  /**
   * Impressão digital do conteúdo. É o que torna a reimportação um no-op
   * explícito no reducer, em vez de depender de os ids calhar de coincidir.
   */
  fingerprint: string;
};

type ColumnId =
  | 'nome'
  | 'email'
  | 'telefone'
  | 'cidade'
  | 'vaga'
  | 'match_tecnico'
  | 'situacao';

const COLUMN_ALIASES: Record<ColumnId, string[]> = {
  nome: ['nome', 'candidato', 'nome do candidato', 'nome completo'],
  email: ['email', 'e-mail', 'email do candidato', 'e-mail do candidato'],
  telefone: ['telefone', 'celular', 'telefone de contato'],
  cidade: ['cidade', 'cidade/uf', 'cidade uf', 'localidade', 'municipio'],
  vaga: ['vaga', 'titulo da vaga', 'cargo', 'posicao'],
  match_tecnico: [
    'match_tecnico',
    'match tecnico',
    'match',
    '% match',
    'percentual de match',
    'compatibilidade tecnica'
  ],
  situacao: ['situacao', 'status', 'situacao do candidato']
};

const REQUIRED_COLUMNS: ColumnId[] = ['nome', 'email', 'vaga', 'match_tecnico'];

function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Conta o separador candidato fora de aspas, na primeira linha lógica. */
function detectSeparator(content: string): string {
  let semicolons = 0;
  let commas = 0;
  let inQuotes = false;

  for (const char of content) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (inQuotes) continue;
    if (char === '\n') break;
    if (char === ';') semicolons += 1;
    if (char === ',') commas += 1;
  }

  return semicolons >= commas && semicolons > 0 ? ';' : ',';
}

/** Linhas lógicas já divididas em campos, respeitando aspas e RFC 4180. */
function splitRecords(content: string, separator: string): string[][] {
  const records: string[][] = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = (): void => {
    fields.push(field);
    field = '';
  };
  const pushRecord = (): void => {
    pushField();
    records.push(fields);
    fields = [];
  };

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]!;

    if (inQuotes) {
      if (char === '"') {
        if (content[index + 1] === '"') {
          field += '"';
          index += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === separator) {
      pushField();
      continue;
    }
    if (char === '\r') continue;
    if (char === '\n') {
      pushRecord();
      continue;
    }
    field += char;
  }

  if (field.length > 0 || fields.length > 0) pushRecord();

  return records;
}

function mapHeader(header: string[]): Partial<Record<ColumnId, number>> {
  const mapping: Partial<Record<ColumnId, number>> = {};

  header.forEach((raw, index) => {
    const normalized = normalizeText(raw);
    for (const [columnId, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (!aliases.includes(normalized)) continue;
      const column = columnId as ColumnId;
      if (mapping[column] === undefined) mapping[column] = index;
    }
  });

  return mapping;
}

/**
 * Lê o percentual de match.
 *
 * Aceita `82`, `82%`, `82,5` e vazio. Vazio devolve `null` — ausência não é
 * zero. Qualquer outra coisa é erro de linha, não um número chutado.
 */
function parseTechnicalMatch(
  raw: string
): { value: number | null } | { reason: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { value: null };

  const cleaned = trimmed.replace('%', '').replace(',', '.').trim();
  const value = Number(cleaned);

  if (!Number.isFinite(value)) {
    return { reason: `"${trimmed}" não é um percentual.` };
  }
  if (value < 0 || value > 100) {
    return { reason: `${value} está fora da faixa de 0 a 100.` };
  }

  return { value: Math.round(value) };
}

function isDiscardSituation(situation: string | null): boolean {
  if (!situation) return false;
  const normalized = normalizeText(situation);
  return DISCARD_MARKERS.some((marker) => normalized.includes(marker));
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Lê o conteúdo da planilha e devolve linhas, erros e resumo.
 *
 * Nunca lança: uma planilha malformada é um caso de uso, não uma exceção.
 */
export function parseSpreadsheet(content: string): ParsedSpreadsheet {
  const text = stripBom(content);
  const separator = detectSeparator(text);
  const fingerprint = hashHex(text.trim(), 16);
  const records = splitRecords(text, separator).filter((record) =>
    record.some((field) => field.trim().length > 0)
  );

  const emptySummary: ImportSummary = {
    dataLines: 0,
    validRows: 0,
    invalidRows: 0,
    discardedRows: 0,
    separator
  };

  const header = records[0];
  if (!header) {
    return {
      rows: [],
      errors: [
        { line: 1, column: 'cabecalho', reason: 'A planilha está vazia.' }
      ],
      summary: emptySummary,
      fingerprint
    };
  }

  const mapping = mapHeader(header);
  const missing = REQUIRED_COLUMNS.filter(
    (column) => mapping[column] === undefined
  );
  if (missing.length > 0) {
    return {
      rows: [],
      errors: missing.map((column) => ({
        line: 1,
        column,
        reason: `Coluna obrigatória ausente. Nomes aceitos: ${COLUMN_ALIASES[column].join(', ')}.`
      })),
      summary: emptySummary,
      fingerprint
    };
  }

  const rows: ImportRow[] = [];
  const errors: ImportError[] = [];

  const readField = (record: string[], column: ColumnId): string => {
    const index = mapping[column];
    if (index === undefined) return '';
    return (record[index] ?? '').trim();
  };

  for (let index = 1; index < records.length; index += 1) {
    const record = records[index]!;
    const line = index + 1;

    const name = readField(record, 'nome');
    const email = normalizeEmail(readField(record, 'email'));
    const jobTitle = readField(record, 'vaga');
    const rawMatch = readField(record, 'match_tecnico');

    const rowErrors: ImportError[] = [];

    if (name.length === 0) {
      rowErrors.push({ line, column: 'nome', reason: 'Nome em branco.' });
    }
    if (!EMAIL_SHAPE.test(email)) {
      rowErrors.push({
        line,
        column: 'email',
        reason:
          email.length === 0
            ? 'E-mail em branco: é a chave que identifica a pessoa.'
            : `"${email}" não parece um e-mail.`
      });
    }
    if (jobTitle.length === 0) {
      rowErrors.push({ line, column: 'vaga', reason: 'Vaga em branco.' });
    }

    const match = parseTechnicalMatch(rawMatch);
    if ('reason' in match) {
      rowErrors.push({ line, column: 'match_tecnico', reason: match.reason });
    }

    if (rowErrors.length > 0 || 'reason' in match) {
      errors.push(...rowErrors);
      continue;
    }

    const situation = readField(record, 'situacao') || null;
    const phone = readField(record, 'telefone') || null;
    const city = readField(record, 'cidade') || null;

    rows.push({
      line,
      name,
      email,
      phone,
      city,
      jobTitle,
      technicalMatch: match.value,
      situation,
      discarded: isDiscardSituation(situation)
    });
  }

  const invalidLines = new Set(errors.map((error) => error.line));

  return {
    rows,
    errors,
    summary: {
      dataLines: records.length - 1,
      validRows: rows.length,
      invalidRows: invalidLines.size,
      discardedRows: rows.filter((row) => row.discarded).length,
      separator
    },
    fingerprint
  };
}

/* ------------------------------------------------------------------ *
 * Plano de importação
 * ------------------------------------------------------------------ */

/**
 * O que a importação faz com uma linha.
 *
 * `ignorada` é duplicata exata: a mesma pessoa, na mesma vaga, com o mesmo
 * match. Reimportar a planilha de ontem cai inteira aqui.
 */
export type ImportDecision =
  | 'novo-talento'
  | 'nova-candidatura'
  | 'match-atualizado'
  | 'ignorada';

export type ImportPlanEntry = {
  line: number;
  decision: ImportDecision;
  /** Por que esta decisão, em uma frase que a tela pode exibir. */
  reason: string;
  talentId: string;
  applicationId: string;
  /** Talento a criar; `null` quando a pessoa já existia. */
  talent: Talent | null;
  /** Candidatura a criar; `null` quando a candidatura já existia. */
  application: Application | null;
  technicalMatch: number | null;
  previousTechnicalMatch: number | null;
  discarded: boolean;
};

export type ImportPlanCounts = Record<ImportDecision, number>;

export type ImportPlan = {
  jobId: string;
  fingerprint: string;
  origin: typeof IMPORT_ORIGIN;
  entries: ImportPlanEntry[];
  errors: ImportError[];
  counts: ImportPlanCounts;
};

function buildExternalRef(email: string, jobId: string): ExternalRef {
  return {
    system: IMPORT_SOURCE_SYSTEM,
    account: jobId,
    id: `EMPG-PLAN-${hashHex(`${jobId}:${email}`, 8).toUpperCase()}`
  };
}

function importedTalentId(email: string): string {
  return `TAL-IMP-${hashHex(email, 8).toUpperCase()}`;
}

function importedApplicationId(email: string, jobId: string): string {
  return `CAND-IMP-${hashHex(`${jobId}:${email}`, 8).toUpperCase()}`;
}

function buildTalent(row: ImportRow, jobId: string): Talent {
  return {
    id: importedTalentId(row.email),
    name: row.name,
    headline: 'Perfil recebido pela planilha da Empregare',
    summary:
      'Cadastro criado a partir da planilha exportada da Empregare. Experiências e preferências ainda não foram coletadas pelo IEL.',
    city: row.city ?? 'Cidade não informada',
    email: row.email,
    experiences: [],
    declaredSkills: [],
    expectations: [],
    preferences: [],
    externalRefs: [buildExternalRef(row.email, jobId)]
  };
}

/**
 * A data da candidatura criada pela importação.
 *
 * É a data da própria importação: a planilha não traz quando a pessoa se
 * inscreveu, e inventar uma data anterior faria o prazo do questionário de fit
 * (`getFitStatus`) nascer vencido para quem acabou de entrar na base.
 */
function buildApplication(
  row: ImportRow,
  jobId: string,
  at: string
): Application {
  return {
    id: importedApplicationId(row.email, jobId),
    talentId: importedTalentId(row.email),
    jobId,
    appliedAt: at.slice(0, 10),
    externalStage: 'triagem',
    analysisStage: 'nao-iniciada',
    referralStage: 'nao-encaminhada',
    technicalMatch: row.technicalMatch,
    externalRef: buildExternalRef(row.email, jobId)
  };
}

/**
 * Decide, linha a linha, o que a importação vai fazer — sem alterar nada.
 *
 * O plano é separado da aplicação de propósito: o analista vê o que vai
 * acontecer antes de acontecer, e o reducer recebe uma decisão já tomada em
 * vez de refazer a comparação com a base.
 *
 * A identidade da pessoa é o **e-mail normalizado**. É o único campo da
 * planilha que a Empregare garante único por candidato; nome se repete, e
 * usar nome como chave fundiria duas pessoas homônimas num perfil só.
 *
 * Quando a coluna `situacao` marca descarte, o plano mantém o
 * `technicalMatch` que a planilha trouxe — é justamente por esse campo que
 * `getRescueCandidates` encontra quem o filtro técnico expurgou e a aderência
 * resgata (R10, S2). A linha descartada entra na base como qualquer outra;
 * quem decide reabrir é o analista.
 *
 * `at` é a hora da importação e vem de fora: nada aqui lê relógio.
 */
export function buildImportPlan(
  state: DemoState,
  parsed: ParsedSpreadsheet,
  jobId: string,
  at: string
): ImportPlan {
  const job = ALL_JOBS.find((entry) => entry.id === jobId) ?? null;

  const knownTalents = new Map(
    [...ALL_TALENTS, ...(state.importedTalents ?? [])].map((talent) => [
      normalizeEmail(talent.email),
      talent
    ])
  );

  const entries: ImportPlanEntry[] = [];
  const errors: ImportError[] = [...parsed.errors];
  const seenEmails = new Set<string>();

  for (const row of parsed.rows) {
    if (job && normalizeText(row.jobTitle) !== normalizeText(job.title)) {
      errors.push({
        line: row.line,
        column: 'vaga',
        reason: `A linha é da vaga "${row.jobTitle}", e a importação é da vaga "${job.title}".`
      });
      continue;
    }

    if (seenEmails.has(row.email)) {
      errors.push({
        line: row.line,
        column: 'email',
        reason: `"${row.email}" aparece mais de uma vez na mesma planilha.`
      });
      continue;
    }
    seenEmails.add(row.email);

    const existingTalent = knownTalents.get(row.email) ?? null;
    const talentId = existingTalent?.id ?? importedTalentId(row.email);
    const existingApplication =
      state.applications.find(
        (application) =>
          application.talentId === talentId && application.jobId === jobId
      ) ?? null;

    if (!existingTalent) {
      entries.push({
        line: row.line,
        decision: 'novo-talento',
        reason: `"${row.email}" não estava na base: entra como talento novo e candidatura nova.`,
        talentId,
        applicationId: importedApplicationId(row.email, jobId),
        talent: buildTalent(row, jobId),
        application: buildApplication(row, jobId, at),
        technicalMatch: row.technicalMatch,
        previousTechnicalMatch: null,
        discarded: row.discarded
      });
      continue;
    }

    if (!existingApplication) {
      entries.push({
        line: row.line,
        decision: 'nova-candidatura',
        reason: `${existingTalent.name} já estava na base: entra apenas a candidatura desta vaga.`,
        talentId,
        applicationId: importedApplicationId(row.email, jobId),
        talent: null,
        application: {
          ...buildApplication(row, jobId, at),
          talentId
        },
        technicalMatch: row.technicalMatch,
        previousTechnicalMatch: null,
        discarded: row.discarded
      });
      continue;
    }

    const previous = existingApplication.technicalMatch ?? null;
    if (previous === row.technicalMatch) {
      entries.push({
        line: row.line,
        decision: 'ignorada',
        reason: 'Mesma pessoa, mesma vaga e mesmo match técnico: nada muda.',
        talentId,
        applicationId: existingApplication.id,
        talent: null,
        application: null,
        technicalMatch: row.technicalMatch,
        previousTechnicalMatch: previous,
        discarded: row.discarded
      });
      continue;
    }

    entries.push({
      line: row.line,
      decision: 'match-atualizado',
      reason: `O match técnico passa de ${previous ?? 'sem valor'} para ${row.technicalMatch ?? 'sem valor'}.`,
      talentId,
      applicationId: existingApplication.id,
      talent: null,
      application: null,
      technicalMatch: row.technicalMatch,
      previousTechnicalMatch: previous,
      discarded: row.discarded
    });
  }

  const counts: ImportPlanCounts = {
    'novo-talento': 0,
    'nova-candidatura': 0,
    'match-atualizado': 0,
    ignorada: 0
  };
  for (const entry of entries) counts[entry.decision] += 1;

  return {
    jobId,
    fingerprint: parsed.fingerprint,
    origin: IMPORT_ORIGIN,
    entries,
    errors,
    counts
  };
}
