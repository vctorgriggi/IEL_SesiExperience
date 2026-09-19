import { z } from 'zod';

/**
 * Contrato estável entre a UI da Central de Seleção IEL e os provedores de
 * análise assistida (determinístico hoje, modelo real amanhã).
 *
 * O provider nunca deve consultar estado global: tudo que ele precisa para
 * responder chega resolvido no `AssistantRequest`, montado pela UI a partir
 * dos registros efetivamente selecionados. Isso mantém a regra do briefing —
 * "as respostas devem usar os registros efetivamente selecionados" — como uma
 * propriedade do contrato, não uma convenção que o provider precisa lembrar.
 */

export const ASSISTANT_KINDS = [
  'resumir-selecao',
  'comparar-selecionados',
  'mostrar-lacunas'
] as const;

export type AssistantKind = (typeof ASSISTANT_KINDS)[number];

/** Mesmo limite usado na comparação da UI: três candidatos por vez. */
export const MAX_ASSISTANT_APPLICATIONS = 3;

const criterionStateSchema = z.enum([
  'alinhamento',
  'a-esclarecer',
  'divergencia',
  'sem-informacao',
  'nao-se-aplica'
]);

const externalStageSchema = z.enum([
  'inscrito',
  'triagem',
  'analise-tecnica',
  'entrevista-empresa'
]);

const analysisStageSchema = z.enum([
  'nao-iniciada',
  'em-andamento',
  'pronta-para-encaminhar'
]);

const referralStageSchema = z.enum([
  'nao-encaminhada',
  'na-lista',
  'encaminhada',
  'interesse-em-entrevista',
  'nao-avancou'
]);

const externalRefSchema = z.object({
  system: z.string(),
  account: z.string(),
  id: z.string()
});

const applicationSchema = z.object({
  id: z.string().min(1),
  talentId: z.string().min(1),
  jobId: z.string().min(1),
  appliedAt: z.string(),
  externalStage: externalStageSchema,
  analysisStage: analysisStageSchema,
  referralStage: referralStageSchema,
  externalRef: externalRefSchema
});

const criterionAnalysisSchema = z.object({
  state: criterionStateSchema,
  note: z.string(),
  evidenceIds: z.array(z.string()),
  updatedBy: z.string().optional(),
  updatedAt: z.string().optional()
});

/** `applicationId` → `criterionId` → análise. Espelha `AnalysisByApplication`. */
const analysisByApplicationSchema = z.record(
  z.string(),
  z.record(z.string(), criterionAnalysisSchema)
);

const dataSourceIdSchema = z.enum([
  'FONTE-EMPREGARE',
  'FONTE-AVALIACAO',
  'FONTE-EMPRESA',
  'FONTE-IEL'
]);

const evidenceNatureSchema = z.enum([
  'relato-do-candidato',
  'confirmado-pelo-gestor',
  'descricao-da-vaga',
  'registro-iel',
  'avaliacao-externa',
  'resposta-de-esclarecimento'
]);

const evidenceVisibilitySchema = z.enum(['compartilhavel', 'interno']);

const criterionRefSchema = z.object({
  jobId: z.string(),
  criterionId: z.string()
});

const evidenceSchema = z.object({
  id: z.string().min(1),
  talentId: z.string().nullable(),
  teamId: z.string().nullable(),
  information: z.string(),
  sourceId: dataSourceIdSchema,
  originLabel: z.string(),
  nature: evidenceNatureSchema,
  updatedAt: z.string(),
  visibility: evidenceVisibilitySchema,
  links: z.array(criterionRefSchema),
  interpretation: z.string()
});

/**
 * Pedido de análise assistida.
 *
 * `applications`, `analysis` e `evidences` trazem só o recorte relevante às
 * candidaturas selecionadas — não o estado inteiro da demonstração. A vaga em
 * si (`jobId`) é resolvida pelo provider a partir do catálogo fictício, que é
 * dado estático e igual para todo mundo; o que muda por sessão (análise,
 * evidências, estágio da candidatura) vem sempre no corpo do pedido.
 */
export const assistantRequestSchema = z.object({
  kind: z.enum(ASSISTANT_KINDS),
  jobId: z.string().min(1),
  applicationIds: z
    .array(z.string().min(1))
    .max(
      MAX_ASSISTANT_APPLICATIONS,
      `Selecione no máximo ${MAX_ASSISTANT_APPLICATIONS} candidaturas.`
    ),
  applications: z.array(applicationSchema),
  analysis: analysisByApplicationSchema,
  evidences: z.array(evidenceSchema)
});

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export const assistantCitationSchema = z.object({
  evidenceId: z.string(),
  label: z.string()
});

export type AssistantCitation = z.infer<typeof assistantCitationSchema>;

export const assistantProviderIdSchema = z.enum(['deterministic', 'anthropic']);

export type AssistantProviderId = z.infer<typeof assistantProviderIdSchema>;

export const assistantResponseSchema = z.object({
  text: z.string(),
  citations: z.array(assistantCitationSchema),
  provider: assistantProviderIdSchema,
  generatedAt: z.string()
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

/** Formato pedido ao modelo real: só texto e citações, nada de nota ou ranking. */
export const modelAssistantOutputSchema = z.object({
  text: z.string().min(1),
  citations: z.array(assistantCitationSchema)
});

export type ModelAssistantOutput = z.infer<typeof modelAssistantOutputSchema>;
