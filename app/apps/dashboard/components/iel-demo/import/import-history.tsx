'use client';

import { plural } from '@/features/iel-demo/format';
import { getImportHistory } from '@/features/iel-demo/state/selectors';
import type { DemoState } from '@/features/iel-demo/types';

import { formatDateTime } from '../shared/ui';
import { CollapsibleSection } from '../talents/collapsible-section';

/** Importações já aplicadas nesta vaga, fora da primeira dobra. */
export function ImportHistory({
  state,
  jobId
}: {
  state: DemoState;
  jobId: string;
}) {
  const historico = getImportHistory(state, jobId);

  return (
    <CollapsibleSection
      title="Importações desta vaga"
      meta={
        historico.length === 0
          ? 'Nenhuma ainda.'
          : plural(historico.length, 'importação', 'importações')
      }
    >
      {historico.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Assim que você confirmar a primeira planilha, ela aparece aqui.
        </p>
      ) : (
        <ul className="space-y-3">
          {historico.map((registro) => (
            <li
              key={registro.id}
              className="space-y-0.5"
            >
              <p className="text-sm font-medium text-foreground">
                {formatDateTime(registro.at)}
              </p>
              <p className="iel-prose text-xs text-muted-foreground">
                {plural(
                  registro.counts.newApplications,
                  'pessoa entrou',
                  'pessoas entraram'
                )}
                , {registro.counts.updatedMatches} com requisitos da vaga
                atualizados, {registro.counts.ignored} sem mudança e{' '}
                {plural(
                  registro.counts.errors,
                  'linha com erro',
                  'linhas com erro'
                )}
                .
              </p>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}
