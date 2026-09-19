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
  'mostrar-lacunas',
  /**
   * Leitura de uma pessoa só: onde combina, onde vale uma conversa e duas
   * perguntas para a entrevista. Pede `applicationIds` com um id e o
   * `contexto` com os temas dessa pessoa.
   */
  'leitura-da-pessoa'
] as const;

export type AssistantKind = (typeof ASSISTANT_KINDS)[number];

/** Mesmo limite usado na comparação da UI: três candidatos por vez. */
export const MAX_ASSISTANT_APPLICATIONS = 3;

/** Tamanho máximo da pergunta livre da analista. */
export const MAX_PERGUNTA = 500;

/** Quantas pessoas o contexto do Mind pode levar numa pergunta. */
export const MAX_CONTEXTO_CANDIDATOS = 10;

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
 * Um tema do instrumento de fit e o quanto a pessoa combina com a empresa
 * nele (0 a 100, ou `null` quando falta um dos lados). O nome do tema é o
 * que a tela mostra; o contrato não depende de quantos temas o instrumento
 * tem.
 */
const temaDoContextoSchema = z.object({
  tema: z.string().min(1).max(120),
  combina: z.number().min(0).max(100).nullable()
});

/**
 * Uma pessoa como o Mind a enxerga na tela da vaga.
 *
 * `nome` e `cidade` viajam só até o servidor, e só para ele saber o que
 * apagar: `pseudonimizar.ts` troca o nome por "Pessoa A" e remove a cidade
 * antes de qualquer provedor externo.
 */
const candidatoDoContextoSchema = z.object({
  applicationId: z.string().min(1),
  talentId: z.string().min(1).optional(),
  nome: z.string().max(200).optional(),
  cidade: z.string().max(200).optional(),
  /** O % "combina com a empresa" da tela, ou `null` sem resposta. */
  combina: z.number().min(0).max(100).nullable(),
  /** O % de requisitos da vaga, ou `null` sem dado. */
  requisitos: z.number().min(0).max(100).nullable(),
  temas: z.array(temaDoContextoSchema).max(60)
});

/**
 * O que a analista está vendo quando pergunta: a vaga, as pessoas com o %
 * de combina e os temas, e as pendências. Montado no cliente pelos mesmos
 * seletores da tela (`chat/mind-livre.ts`).
 */
export const assistantContextoSchema = z.object({
  vaga: z
    .object({
      titulo: z.string().max(200),
      requisitos: z.array(z.string().max(300)).max(30)
    })
    .optional(),
  /** Nome da empresa: só para o servidor saber o que trocar por "a empresa". */
  empresa: z.string().max(200).optional(),
  candidatos: z
    .array(candidatoDoContextoSchema)
    .max(MAX_CONTEXTO_CANDIDATOS)
    .optional(),
  pendencias: z.array(z.string().max(300)).max(10).optional()
});

export type AssistantContexto = z.infer<typeof assistantContextoSchema>;
export type AssistantCandidatoDoContexto = z.infer<
  typeof candidatoDoContextoSchema
>;

/**
 * Pedido de análise assistida.
 *
 * `applications`, `analysis` e `evidences` trazem só o recorte relevante às
 * candidaturas selecionadas — não o estado inteiro da demonstração. A vaga em
 * si (`jobId`) é resolvida pelo provider a partir do catálogo fictício, que é
 * dado estático e igual para todo mundo; o que muda por sessão (análise,
 * evidências, estágio da candidatura) vem sempre no corpo do pedido.
 */
export const assistantRequestSchema = z
  .object({
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
    evidences: z.array(evidenceSchema),
    /** Pergunta livre da analista, com as palavras dela. */
    pergunta: z.string().trim().min(1).max(MAX_PERGUNTA).optional(),
    contexto: assistantContextoSchema.optional()
  })
  .superRefine((request, ctx) => {
    if (
      request.kind === 'leitura-da-pessoa' &&
      request.applicationIds.length !== 1
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['applicationIds'],
        message: 'A leitura da pessoa pede exatamente uma candidatura.'
      });
    }
  });

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

export const assistantCitationSchema = z.object({
  evidenceId: z.string(),
  label: z.string()
});

export type AssistantCitation = z.infer<typeof assistantCitationSchema>;

export const assistantProviderIdSchema = z.enum([
  'deterministic',
  'anthropic',
  'deepseek'
]);

export type AssistantProviderId = z.infer<typeof assistantProviderIdSchema>;

/** A leitura de uma pessoa: o que a tela da pessoa mostraria. */
export const leituraDaPessoaSchema = z.object({
  ondeCombina: z.array(z.string().min(1)).max(5),
  ondeConversar: z.array(z.string().min(1)).max(5),
  perguntas: z.array(z.string().min(1)).max(2)
});

export type LeituraDaPessoa = z.infer<typeof leituraDaPessoaSchema>;

export const assistantResponseSchema = z.object({
  text: z.string(),
  citations: z.array(assistantCitationSchema),
  provider: assistantProviderIdSchema,
  /** Nome do modelo usado, quando houve modelo (ex.: `deepseek-flash`). */
  modelo: z.string().optional(),
  /** Aviso para a analista, ex.: o modelo falhou e a regra fixa respondeu. */
  aviso: z.string().optional(),
  /** Só no pedido `leitura-da-pessoa`. */
  leitura: leituraDaPessoaSchema.optional(),
  generatedAt: z.string()
});

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;

/** Formato pedido ao modelo real: só texto e citações, nada de nota ou ranking. */
export const modelAssistantOutputSchema = z.object({
  text: z.string().min(1),
  citations: z.array(assistantCitationSchema)
});

export type ModelAssistantOutput = z.infer<typeof modelAssistantOutputSchema>;

/** Saída pedida ao modelo na leitura da pessoa: a mesma, mais a leitura. */
export const modelLeituraOutputSchema = modelAssistantOutputSchema.extend({
  leitura: leituraDaPessoaSchema
});
