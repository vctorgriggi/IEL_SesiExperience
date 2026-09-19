'use client';

import type { ReferralDraftItem } from '@/features/iel-demo/analysis/assistant';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCompany,
  getEvidencesByIds,
  getTalent
} from '@/features/iel-demo/state/selectors';
import type { Job } from '@/features/iel-demo/types';

import { Alert } from '@workspace/ui';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@workspace/ui/shadcn/dialog';

/**
 * Pré-visualização do encaminhamento: mostra exatamente o conteúdo que a
 * empresa verá, com as justificativas revisadas pelo analista.
 */
export function ReferralPreviewDialog({
  job,
  message,
  items,
  justifications,
  visible,
  onHide
}: {
  job: Job;
  message: string;
  items: ReferralDraftItem[];
  justifications: Record<string, string>;
  visible: boolean;
  onHide: () => void;
}) {
  const { state } = useIelDemo();
  const company = getCompany(job.companyId);

  return (
    <Dialog
      open={visible}
      onOpenChange={(aberto) => {
        if (!aberto) onHide();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>O que a empresa vai receber</DialogTitle>
          <DialogDescription>
            {company?.name} · {job.title}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          <p className="text-sm text-foreground">{message}</p>

          <ul className="space-y-3">
            {items.map((item) => {
              const application = getApplication(state, item.applicationId);
              const talent = application
                ? getTalent(application.talentId)
                : null;
              const evidences = getEvidencesByIds(
                state,
                item.sharedEvidenceIds
              );

              return (
                <li
                  key={item.applicationId}
                  className="space-y-2 rounded-[var(--control-radius)] border border-border p-3"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {talent?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">Justificativa: </span>
                    {justifications[item.applicationId] ?? item.justification}
                  </p>

                  {item.attentionPoints.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Pontos de atenção
                      </p>
                      <ul className="list-inside list-disc text-sm text-muted-foreground">
                        {item.attentionPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {item.suggestedQuestions.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Perguntas sugeridas para a entrevista
                      </p>
                      <ul className="list-inside list-disc text-sm text-muted-foreground">
                        {item.suggestedQuestions.map((question) => (
                          <li key={question}>{question}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Evidências ({evidences.length})
                    </p>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {evidences.map((evidence) => (
                        <li key={evidence.id}>
                          “{evidence.information}” — {evidence.originLabel}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ul>

          <Alert variant="default">
            Fora deste conteúdo: notas internas do IEL, candidaturas em outras
            empresas, avaliações não autorizadas e o histórico de análise. Nada
            é enviado ao sistema de origem nesta demonstração.
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onHide}
          >
            Voltar para a revisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
