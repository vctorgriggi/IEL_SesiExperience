import type {
  AnalysisByApplication,
  CriterionAnalysis,
  CriterionState,
  Dimension,
  Job,
  JobCriterion
} from '../types';

export type CriterionStateMeta = {
  label: string;
  /** Explicação curta: o estado nunca depende apenas de cor. */
  description: string;
  /** Marcador textual usado junto do ícone. */
  marker: string;
  tone: 'positivo' | 'atencao' | 'conflito' | 'neutro' | 'desativado';
  /** Conta como informação disponível na cobertura. */
  hasInformation: boolean;
  /** Entra no denominador da cobertura. */
  countsForCoverage: boolean;
};

export const CRITERION_STATE_META: Record<CriterionState, CriterionStateMeta> =
  {
    alinhamento: {
      label: 'Alinhamento identificado',
      description:
        'Existe informação registrada que sustenta a relação com o critério.',
      marker: '✓',
      tone: 'positivo',
      hasInformation: true,
      countsForCoverage: true
    },
    'a-esclarecer': {
      label: 'Ponto a esclarecer',
      description:
        'Há informação, mas a interpretação ou a condição precisa ser confirmada.',
      marker: '?',
      tone: 'atencao',
      hasInformation: true,
      countsForCoverage: true
    },
    divergencia: {
      label: 'Divergência identificada',
      description: 'Existem informações explícitas em conflito.',
      marker: '≠',
      tone: 'conflito',
      hasInformation: true,
      countsForCoverage: true
    },
    'sem-informacao': {
      label: 'Sem informação',
      description:
        'Não há base suficiente para analisar. É um espaço não mapeado, não um ponto negativo.',
      marker: '—',
      tone: 'neutro',
      hasInformation: false,
      countsForCoverage: true
    },
    'nao-se-aplica': {
      label: 'Não se aplica',
      description: 'Critério fora do escopo desta vaga.',
      marker: '·',
      tone: 'desativado',
      hasInformation: false,
      countsForCoverage: false
    }
  };

export const DIMENSION_META: Record<
  Dimension,
  { label: string; shortLabel: string; description: string }
> = {
  tecnica: {
    label: 'Compatibilidade técnica',
    shortLabel: 'Técnica',
    description:
      'Relação entre requisitos e atividades da vaga e as experiências ou competências registradas.'
  },
  profissional: {
    label: 'Expectativas profissionais',
    shortLabel: 'Profissional',
    description:
      'Interesses, aspirações, disponibilidade e expectativas em relação à oportunidade.'
  },
  organizacional: {
    label: 'Contexto organizacional',
    shortLabel: 'Organizacional',
    description:
      'Condições de trabalho, orientação, autonomia, comunicação e avaliações existentes. Considera o contexto, não semelhança de personalidade.'
  }
};

export const EMPTY_CRITERION_ANALYSIS: CriterionAnalysis = {
  state: 'sem-informacao',
  note: 'Análise ainda não registrada para este critério.',
  evidenceIds: []
};

export function getCriterionAnalysis(
  analysis: AnalysisByApplication,
  applicationId: string,
  criterionId: string
): CriterionAnalysis {
  return analysis[applicationId]?.[criterionId] ?? EMPTY_CRITERION_ANALYSIS;
}

export type CoverageSummary = {
  /** Critérios com informação suficiente. */
  withInformation: number;
  /** Critérios considerados (exclui "não se aplica"). */
  total: number;
  missing: string[];
};

/** Cobertura informacional: mede dados disponíveis, não afinidade nem nota. */
export function getCoverage(
  job: Job,
  analysis: AnalysisByApplication,
  applicationId: string,
  dimension?: Dimension
): CoverageSummary {
  const criteria = dimension
    ? job.criteria.filter((criterion) => criterion.dimension === dimension)
    : job.criteria;

  let withInformation = 0;
  let total = 0;
  const missing: string[] = [];

  for (const criterion of criteria) {
    const { state } = getCriterionAnalysis(
      analysis,
      applicationId,
      criterion.id
    );
    const meta = CRITERION_STATE_META[state];
    if (!meta.countsForCoverage) continue;
    total += 1;
    if (meta.hasInformation) {
      withInformation += 1;
    } else {
      missing.push(criterion.label);
    }
  }

  return { withInformation, total, missing };
}

export type DimensionSummary = {
  dimension: Dimension;
  counts: Record<CriterionState, number>;
  /** Estado que resume a dimensão para leitura rápida na matriz. */
  headline: CriterionState;
  criteria: { criterion: JobCriterion; analysis: CriterionAnalysis }[];
};

const HEADLINE_PRIORITY: CriterionState[] = [
  'divergencia',
  'a-esclarecer',
  'sem-informacao',
  'alinhamento',
  'nao-se-aplica'
];

export function getDimensionSummary(
  job: Job,
  analysis: AnalysisByApplication,
  applicationId: string,
  dimension: Dimension
): DimensionSummary {
  const counts: Record<CriterionState, number> = {
    alinhamento: 0,
    'a-esclarecer': 0,
    divergencia: 0,
    'sem-informacao': 0,
    'nao-se-aplica': 0
  };

  const criteria = job.criteria
    .filter((criterion) => criterion.dimension === dimension)
    .map((criterion) => {
      const criterionAnalysis = getCriterionAnalysis(
        analysis,
        applicationId,
        criterion.id
      );
      counts[criterionAnalysis.state] += 1;
      return { criterion, analysis: criterionAnalysis };
    });

  const headline =
    HEADLINE_PRIORITY.find((state) => counts[state] > 0) ?? 'sem-informacao';

  return { dimension, counts, headline, criteria };
}

/** Requisitos obrigatórios com divergência confirmada ou sem informação. */
export function getRequiredAttentionPoints(
  job: Job,
  analysis: AnalysisByApplication,
  applicationId: string
): { criterion: JobCriterion; analysis: CriterionAnalysis }[] {
  return job.criteria
    .filter((criterion) => criterion.required)
    .map((criterion) => ({
      criterion,
      analysis: getCriterionAnalysis(analysis, applicationId, criterion.id)
    }))
    .filter(
      (entry) =>
        entry.analysis.state === 'divergencia' ||
        entry.analysis.state === 'sem-informacao' ||
        entry.analysis.state === 'a-esclarecer'
    );
}

export function describeCoverage(coverage: CoverageSummary): string {
  return `${coverage.withInformation} de ${coverage.total} critérios possuem dados suficientes`;
}
