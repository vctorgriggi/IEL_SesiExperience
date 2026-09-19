import type { AnalysisByApplication, DemoState, Evidence } from '../types';
import type { AssistantKind, AssistantRequest } from './types';

/**
 * Monta o `AssistantRequest` a partir do estado local da demonstração.
 *
 * Só entra no pedido o recorte relevante às candidaturas selecionadas: as
 * próprias candidaturas, a análise de cada uma e as evidências que sustentam
 * essa análise. Nada de estado global viaja para o provider — nem o resto da
 * base fictícia, que ele não usaria de qualquer forma.
 */
export function buildAssistantRequestPayload(
  state: DemoState,
  jobId: string,
  applicationIds: string[],
  kind: AssistantKind
): AssistantRequest {
  const applications = state.applications.filter((application) =>
    applicationIds.includes(application.id)
  );

  const analysis: AnalysisByApplication = {};
  const evidenceIds = new Set<string>();
  for (const applicationId of applicationIds) {
    const perCriterion = state.analysis[applicationId];
    if (!perCriterion) continue;
    analysis[applicationId] = perCriterion;
    for (const criterionAnalysis of Object.values(perCriterion)) {
      for (const evidenceId of criterionAnalysis.evidenceIds) {
        evidenceIds.add(evidenceId);
      }
    }
  }

  const evidences: Evidence[] = state.evidences.filter((evidence) =>
    evidenceIds.has(evidence.id)
  );

  return { kind, jobId, applicationIds, applications, analysis, evidences };
}
