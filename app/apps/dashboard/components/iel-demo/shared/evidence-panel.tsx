'use client';

import { getCriterionEvidenceBundle } from '@/features/iel-demo/analysis/assistant';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { getTalent } from '@/features/iel-demo/state/selectors';
import type {
  Application,
  Evidence,
  EvidenceNature,
  Job,
  JobCriterion
} from '@/features/iel-demo/types';

import { Alert, Button, cn } from '@workspace/ui';

import { CriterionStateHeadline } from './criterion-state-badge';
import { Chip, formatDate, Panel, SourceTag } from './ui';

export const NATURE_LABEL: Record<EvidenceNature, string> = {
  'relato-do-candidato': 'Relato do candidato, sem verificação prática',
  'confirmado-pelo-gestor': 'Condição confirmada pelo gestor',
  'descricao-da-vaga': 'Informação da descrição da vaga',
  'registro-iel': 'Registro interno do IEL',
  'avaliacao-externa': 'Resultado de avaliação externa',
  'resposta-de-esclarecimento': 'Resposta a esclarecimento dirigido'
};

export function EvidenceCard({
  evidence,
  className
}: {
  evidence: Evidence;
  className?: string;
}) {
  const talent = evidence.talentId ? getTalent(evidence.talentId) : null;

  return (
    <Panel
      padding="sm"
      className={cn('flex flex-col gap-2', className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={evidence.visibility === 'interno' ? 'atencao' : 'info'}>
          {evidence.visibility === 'interno'
            ? 'Nota interna — não compartilhada'
            : 'Compartilhável no encaminhamento'}
        </Chip>
        <span className="text-[11px] text-muted-foreground">{evidence.id}</span>
      </div>
      <p className="text-sm text-foreground">“{evidence.information}”</p>
      <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="font-medium text-foreground/80">Origem</dt>
          <dd>{evidence.originLabel}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/80">Natureza</dt>
          <dd>{NATURE_LABEL[evidence.nature]}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/80">Atualização</dt>
          <dd>{formatDate(evidence.updatedAt)}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/80">Refere-se a</dt>
          <dd>{talent ? talent.name : 'Condição de trabalho da equipe'}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">Interpretação: </span>
        {evidence.interpretation}
      </p>
    </Panel>
  );
}

type EvidencePanelProps = {
  job: Job;
  application: Application;
  criterion: JobCriterion;
  onClose: () => void;
  onRequestClarification?: () => void;
};

/**
 * Painel de evidências de um critério: estado, nota da análise, registros de
 * origem e ação para pedir esclarecimento.
 */
export function EvidencePanel({
  job,
  application,
  criterion,
  onClose,
  onRequestClarification
}: EvidencePanelProps) {
  const { state } = useIelDemo();
  const { analysis, evidences } = getCriterionEvidenceBundle(
    state,
    application,
    criterion.id
  );
  const talent = getTalent(application.talentId);
  const conflicting = analysis.state === 'divergencia';

  return (
    <aside
      aria-label={`Evidências de ${criterion.label}`}
      className="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4 lg:max-w-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {talent?.name} · {job.title}
          </p>
          <h2 className="text-base font-semibold text-foreground">
            {criterion.label}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {criterion.question}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Fechar painel de evidências"
        >
          Fechar
        </Button>
      </div>

      <div className="space-y-2">
        <CriterionStateHeadline
          state={analysis.state}
          className="text-sm"
        />
        <p className="text-sm text-foreground">{analysis.note}</p>
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <Chip>
            {criterion.required
              ? 'Requisito obrigatório'
              : 'Critério complementar'}
          </Chip>
          <Chip>{`Confirmado por: ${criterion.confirmedBy}`}</Chip>
        </div>
        {analysis.updatedBy ? (
          <p className="text-[11px] text-muted-foreground">
            Última atualização: {analysis.updatedBy}
          </p>
        ) : null}
      </div>

      {conflicting ? (
        <Alert variant="destructive">
          Duas fontes discordam. A interface mostra as duas versões e pede
          confirmação em vez de escolher uma silenciosamente.
        </Alert>
      ) : null}

      {analysis.state === 'sem-informacao' ? (
        <Alert variant="default">
          Nenhum registro sustenta este critério ainda. É uma parte não mapeada
          do mapa, não um ponto negativo da pessoa.
        </Alert>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">
          Registros de origem ({evidences.length})
        </h3>
        {evidences.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sem registros vinculados. Uma solicitação de esclarecimento pode
            trazer a informação que falta.
          </p>
        ) : (
          evidences.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
            />
          ))
        )}
      </div>

      {onRequestClarification ? (
        <Button
          variant="outline"
          onClick={onRequestClarification}
          className="mt-auto"
        >
          Solicitar esclarecimento
        </Button>
      ) : null}

      <SourceTag
        source="Base de demonstração"
        nature="datas fixas"
        className="pt-2"
      />
    </aside>
  );
}
