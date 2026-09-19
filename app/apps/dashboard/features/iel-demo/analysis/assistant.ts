import { findClarificationTemplate } from '../fixtures';
import {
  getApplication,
  getEvidencesByIds,
  getEvidencesForCriterion,
  getTalent
} from '../state/selectors';
import type {
  Application,
  ClarificationRecipientKind,
  DemoState,
  Job,
  JobCriterion
} from '../types';
import {
  CRITERION_STATE_META,
  describeCoverage,
  DIMENSION_META,
  getCoverage,
  getCriterionAnalysis
} from './criterion-states';

export type AssistantAnswer = {
  title: string;
  paragraphs: string[];
  /** Registros efetivamente usados para montar o texto. */
  usedRecords: string[];
  disclaimer: string;
};

const DISCLAIMER =
  'Texto montado a partir dos registros selecionados nesta base de demonstração. Nenhum modelo de linguagem foi consultado e nenhuma informação foi inventada.';

function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName;
}

function listCriteria(
  job: Job,
  state: DemoState,
  applicationId: string,
  wanted: string[]
): JobCriterion[] {
  return job.criteria.filter((criterion) =>
    wanted.includes(
      getCriterionAnalysis(state.analysis, applicationId, criterion.id).state
    )
  );
}

function describeApplication(
  state: DemoState,
  job: Job,
  application: Application
): { sentence: string; usedRecords: string[] } {
  const talent = getTalent(application.talentId);
  const name = talent ? firstName(talent.name) : application.talentId;
  const aligned = listCriteria(job, state, application.id, ['alinhamento']);
  const toClarify = listCriteria(job, state, application.id, ['a-esclarecer']);
  const diverging = listCriteria(job, state, application.id, ['divergencia']);
  const unknown = listCriteria(job, state, application.id, ['sem-informacao']);
  const coverage = getCoverage(job, state.analysis, application.id);

  const parts: string[] = [];
  if (aligned.length > 0) {
    parts.push(
      `há evidência registrada para ${aligned.map((criterion) => criterion.label.toLowerCase()).join(', ')}`
    );
  }
  if (diverging.length > 0) {
    parts.push(
      `há divergência explícita em ${diverging.map((criterion) => criterion.label.toLowerCase()).join(', ')}`
    );
  }
  if (toClarify.length > 0) {
    parts.push(
      `${toClarify.map((criterion) => criterion.label.toLowerCase()).join(', ')} ainda precisa de confirmação`
    );
  }
  if (unknown.length > 0) {
    parts.push(
      `não há informação sobre ${unknown.map((criterion) => criterion.label.toLowerCase()).join(', ')}`
    );
  }

  const usedRecords = job.criteria.flatMap(
    (criterion) =>
      getCriterionAnalysis(state.analysis, application.id, criterion.id)
        .evidenceIds
  );

  return {
    sentence: `${name}: ${parts.join('; ')}. ${describeCoverage(coverage)}.`,
    usedRecords: [...new Set(usedRecords)]
  };
}

/** Resumo da seleção atual da vaga, dimensão por dimensão. */
export function summarizeSelection(
  state: DemoState,
  job: Job,
  applicationIds: string[]
): AssistantAnswer {
  const applications = applicationIds
    .map((id) => getApplication(state, id))
    .filter((application): application is Application => Boolean(application));

  if (applications.length === 0) {
    return {
      title: 'Resumo da seleção',
      paragraphs: [
        'Nenhuma candidatura selecionada. Marque candidatos na matriz para que o resumo use exatamente esses registros.'
      ],
      usedRecords: [],
      disclaimer: DISCLAIMER
    };
  }

  const described = applications.map((application) =>
    describeApplication(state, job, application)
  );

  const requiredGaps = applications.flatMap((application) =>
    job.criteria
      .filter((criterion) => criterion.required)
      .filter((criterion) => {
        const analysis = getCriterionAnalysis(
          state.analysis,
          application.id,
          criterion.id
        );
        return analysis.state !== 'alinhamento';
      })
      .map((criterion) => {
        const talent = getTalent(application.talentId);
        return `${talent ? firstName(talent.name) : application.id} — ${criterion.label}`;
      })
  );

  const paragraphs = [
    `Seleção de ${applications.length} candidatura(s) na vaga ${job.title}.`,
    ...described.map((entry) => entry.sentence)
  ];

  if (requiredGaps.length > 0) {
    paragraphs.push(
      `Requisitos obrigatórios que não estão plenamente sustentados: ${requiredGaps.join('; ')}. Sinalizar não é eliminar: a decisão continua com o analista.`
    );
  }

  return {
    title: 'Resumo da seleção',
    paragraphs,
    usedRecords: [...new Set(described.flatMap((entry) => entry.usedRecords))],
    disclaimer: DISCLAIMER
  };
}

/** Comparação entre os selecionados, critério a critério. */
export function compareSelection(
  state: DemoState,
  job: Job,
  applicationIds: string[]
): AssistantAnswer {
  const applications = applicationIds
    .map((id) => getApplication(state, id))
    .filter((application): application is Application => Boolean(application));

  if (applications.length < 2) {
    return {
      title: 'Comparação dos selecionados',
      paragraphs: [
        'Selecione de dois a três candidatos para comparar. Com uma única candidatura a comparação não tem contraparte.'
      ],
      usedRecords: [],
      disclaimer: DISCLAIMER
    };
  }

  const paragraphs: string[] = [];
  const usedRecords: string[] = [];

  for (const dimension of [
    'tecnica',
    'profissional',
    'organizacional'
  ] as const) {
    const criteria = job.criteria.filter(
      (criterion) => criterion.dimension === dimension
    );
    if (criteria.length === 0) continue;

    const sentences = applications.map((application) => {
      const talent = getTalent(application.talentId);
      const name = talent ? firstName(talent.name) : application.id;
      const states = criteria.map((criterion) => {
        const analysis = getCriterionAnalysis(
          state.analysis,
          application.id,
          criterion.id
        );
        usedRecords.push(...analysis.evidenceIds);
        return `${criterion.label.toLowerCase()} (${CRITERION_STATE_META[analysis.state].label.toLowerCase()})`;
      });
      return `${name}: ${states.join('; ')}`;
    });

    paragraphs.push(
      `${DIMENSION_META[dimension].label} — ${sentences.join(' | ')}.`
    );
  }

  const conflicts = applications.flatMap((application) => {
    const talent = getTalent(application.talentId);
    const name = talent ? firstName(talent.name) : application.id;
    return job.criteria
      .filter(
        (criterion) =>
          getCriterionAnalysis(state.analysis, application.id, criterion.id)
            .state === 'divergencia'
      )
      .map((criterion) => `${name} — ${criterion.label}`);
  });

  if (conflicts.length > 0) {
    paragraphs.push(
      `Divergências que precisam de decisão registrada: ${conflicts.join('; ')}.`
    );
  }

  paragraphs.push(
    'Os critérios são os mesmos para todos os selecionados. As diferenças de estado vêm dos dados disponíveis, não de um ranking de pessoas.'
  );

  return {
    title: 'Comparação dos selecionados',
    paragraphs,
    usedRecords: [...new Set(usedRecords)],
    disclaimer: DISCLAIMER
  };
}

/** O que falta esclarecer na seleção atual. */
export function missingInformation(
  state: DemoState,
  job: Job,
  applicationIds: string[]
): AssistantAnswer {
  const applications = applicationIds
    .map((id) => getApplication(state, id))
    .filter((application): application is Application => Boolean(application));

  const target = applications.length > 0 ? applications : [];

  if (target.length === 0) {
    return {
      title: 'O que falta esclarecer',
      paragraphs: [
        'Selecione candidaturas na matriz para ver as lacunas específicas delas.'
      ],
      usedRecords: [],
      disclaimer: DISCLAIMER
    };
  }

  const paragraphs: string[] = [];
  for (const application of target) {
    const talent = getTalent(application.talentId);
    const name = talent ? talent.name : application.id;
    const gaps = job.criteria.filter((criterion) => {
      const analysis = getCriterionAnalysis(
        state.analysis,
        application.id,
        criterion.id
      );
      return (
        analysis.state === 'sem-informacao' ||
        analysis.state === 'a-esclarecer' ||
        analysis.state === 'divergencia'
      );
    });

    if (gaps.length === 0) {
      paragraphs.push(`${name}: todos os critérios têm evidência suficiente.`);
      continue;
    }

    const questions = gaps.map((criterion) => {
      const recipientKind: ClarificationRecipientKind =
        criterion.dimension === 'organizacional' ? 'gestor' : 'candidato';
      return `• ${criterion.label} (${recipientKind === 'gestor' ? 'perguntar ao gestor' : 'perguntar à pessoa'}): ${suggestQuestion(job, criterion, recipientKind)}`;
    });

    paragraphs.push(`${name} — perguntas sugeridas:`);
    paragraphs.push(...questions);
  }

  return {
    title: 'O que falta esclarecer',
    paragraphs,
    usedRecords: [],
    disclaimer: DISCLAIMER
  };
}

/** Pergunta sugerida para um critério, revisável antes do envio. */
export function suggestQuestion(
  job: Job,
  criterion: JobCriterion,
  recipientKind: ClarificationRecipientKind
): string {
  const template = findClarificationTemplate(
    job.id,
    criterion.id,
    recipientKind
  );
  if (template) return template.suggestedQuestion;

  if (recipientKind === 'gestor') {
    return `Sobre "${criterion.label}" na vaga ${job.title}: como essa condição funciona hoje na equipe?`;
  }
  return `Sobre "${criterion.label}" na vaga ${job.title}: você pode contar como isso aparece na sua experiência?`;
}

export type ReferralDraftItem = {
  applicationId: string;
  summary: string;
  attentionPoints: string[];
  suggestedQuestions: string[];
  justification: string;
  sharedEvidenceIds: string[];
};

/** Resumo de encaminhamento por candidatura, revisável pelo analista. */
export function buildReferralDraft(
  state: DemoState,
  job: Job,
  applicationIds: string[]
): { message: string; items: ReferralDraftItem[] } {
  const items: ReferralDraftItem[] = [];

  for (const applicationId of applicationIds) {
    const application = getApplication(state, applicationId);
    if (!application) continue;
    const talent = getTalent(application.talentId);
    if (!talent) continue;

    const aligned = listCriteria(job, state, applicationId, ['alinhamento']);
    const attention = job.criteria.filter((criterion) => {
      const analysis = getCriterionAnalysis(
        state.analysis,
        applicationId,
        criterion.id
      );
      return (
        analysis.state === 'a-esclarecer' ||
        analysis.state === 'divergencia' ||
        (analysis.state === 'sem-informacao' && criterion.required)
      );
    });

    const sharedEvidenceIds = [
      ...new Set(
        job.criteria.flatMap(
          (criterion) =>
            getCriterionAnalysis(state.analysis, applicationId, criterion.id)
              .evidenceIds
        )
      )
    ].filter((evidenceId) => {
      const [evidence] = getEvidencesByIds(state, [evidenceId]);
      return evidence?.visibility === 'compartilhavel';
    });

    const coverage = getCoverage(job, state.analysis, applicationId);

    items.push({
      applicationId,
      summary: `${talent.name} — ${talent.headline}. ${
        aligned.length > 0
          ? `Evidências registradas para: ${aligned.map((criterion) => criterion.label.toLowerCase()).join(', ')}.`
          : 'Ainda sem critérios plenamente sustentados por evidência.'
      } ${describeCoverage(coverage)}.`,
      attentionPoints: attention.map((criterion) => {
        const analysis = getCriterionAnalysis(
          state.analysis,
          applicationId,
          criterion.id
        );
        return `${criterion.label}: ${CRITERION_STATE_META[analysis.state].label.toLowerCase()} — ${analysis.note}`;
      }),
      suggestedQuestions: attention
        .slice(0, 3)
        .map((criterion) => suggestQuestion(job, criterion, 'candidato')),
      justification: `Encaminhada para ${job.title} porque ${
        aligned.length > 0
          ? aligned
              .slice(0, 2)
              .map((criterion) => criterion.label.toLowerCase())
              .join(' e ')
          : 'a análise segue em andamento'
      } aparecem sustentados pelos registros disponíveis.`,
      sharedEvidenceIds
    });
  }

  return {
    message: `Encaminhamento de ${items.length} perfil(is) para a vaga ${job.title}. As informações abaixo vêm das fontes autorizadas da base de demonstração e incluem os pontos que ainda precisam de conversa. Notas internas do IEL não fazem parte deste conteúdo.`,
    items
  };
}

/** Evidências que sustentam um critério, para o painel de evidências. */
export function getCriterionEvidenceBundle(
  state: DemoState,
  application: Application,
  criterionId: string
) {
  const analysis = getCriterionAnalysis(
    state.analysis,
    application.id,
    criterionId
  );
  const linked = getEvidencesForCriterion(state, application, criterionId);
  const byAnalysis = getEvidencesByIds(state, analysis.evidenceIds);
  const merged = [...byAnalysis];
  for (const evidence of linked) {
    if (!merged.some((entry) => entry.id === evidence.id))
      merged.push(evidence);
  }
  return { analysis, evidences: merged };
}
