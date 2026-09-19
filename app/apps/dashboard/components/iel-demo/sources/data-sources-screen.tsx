'use client';

import { useState } from 'react';
import { DEMO_SYNC_EVENTS } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { applySyncEventPayload } from '@/features/iel-demo/state/reducer';
import { getApplication, getTalent } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';

import {
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast
} from '@workspace/ui';

import {
  Chip,
  formatDateTime,
  IelPageHeader,
  Panel,
  PanelHeader
} from '../shared/ui';

export function DataSourcesScreen() {
  const { state, dispatch } = useIelDemo();
  const [lastResult, setLastResult] = useState<string | null>(null);

  const totals = {
    talents: new Set(
      state.applications.map((application) => application.talentId)
    ).size,
    applications: state.applications.length,
    clarifications: state.clarifications.length,
    referrals: state.referrals.length
  };

  return (
    <div className="space-y-6">
      <IelPageHeader
        eyebrow="Integração simulada"
        title="Fontes de dados"
        description="De onde vem cada tipo de informação, com a última atualização recebida."
      />

      <Alert variant="default">
        Em produção, o fluxo seria: sistema de recrutamento → dados autorizados
        de vagas e candidaturas → central do IEL → análise e encaminhamento →
        retorno ao processo original, quando suportado. Cada conector depende de
        permissões próprias e ainda não está confirmado para o IEL.
      </Alert>

      <Panel padding="none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Fonte</TableHead>
                <TableHead scope="col">Tipo de informação</TableHead>
                <TableHead scope="col">Registros recebidos</TableHead>
                <TableHead scope="col">Última atualização</TableHead>
                <TableHead scope="col">Situação</TableHead>
                <TableHead scope="col" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.dataSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="align-top">
                    <p className="text-sm font-medium text-foreground">
                      {source.name}
                    </p>
                    <p className="max-w-96 text-xs text-muted-foreground">
                      {source.description}
                    </p>
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {source.kind}
                  </TableCell>
                  <TableCell className="align-top text-sm text-foreground">
                    {source.receivedRecords}
                  </TableCell>
                  <TableCell className="align-top text-xs text-muted-foreground">
                    {formatDateTime(source.lastSyncAt)}
                  </TableCell>
                  <TableCell className="align-top">
                    {source.status === 'ativa' ? (
                      <Chip tone="positivo">Respondendo</Chip>
                    ) : (
                      <div className="space-y-1">
                        <Chip tone="conflito">Indisponível</Chip>
                        <p className="max-w-64 text-[11px] text-muted-foreground">
                          {source.lastError}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {source.status === 'ativa' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          dispatch({
                            type: 'set-source-status',
                            sourceId: source.id,
                            status: 'indisponivel',
                            error:
                              'Falha simulada ao consultar a origem. Os dados anteriores foram preservados e podem estar desatualizados.',
                            at: nowIso()
                          });
                          toast.error(
                            'Falha simulada: nenhum dado foi apagado. Use "Tentar novamente".'
                          );
                        }}
                      >
                        Simular falha
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          dispatch({
                            type: 'set-source-status',
                            sourceId: source.id,
                            status: 'ativa',
                            error: null,
                            at: nowIso()
                          });
                          toast.success('Fonte restabelecida.');
                        }}
                      >
                        Tentar novamente
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-3">
        <PanelHeader
          eyebrow="Simulação"
          title="Recebimento de atualização simulada"
          hint="Evento fixo. Receber o mesmo evento novamente não duplica candidatura nem talento: a idempotência é verificada pelo identificador do evento."
        />
        <ul className="space-y-3">
          {DEMO_SYNC_EVENTS.map((event) => {
            const alreadyApplied = state.appliedSyncEventIds.includes(event.id);
            const application = getApplication(
              state,
              event.payload.applicationId
            );
            const talent = getTalent(event.payload.talentId);
            const sourceUnavailable =
              state.dataSources.find((source) => source.id === event.sourceId)
                ?.status === 'indisponivel';

            return (
              <li
                key={event.id}
                className="space-y-2 rounded-[var(--control-radius)] border border-border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  {alreadyApplied ? (
                    <Chip tone="positivo">Já aplicado</Chip>
                  ) : (
                    <Chip tone="atencao">Não aplicado</Chip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {event.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  Estado atual da candidatura: {talent?.name} ·{' '}
                  {application?.externalStage}
                </p>
                <Button
                  size="sm"
                  disabled={sourceUnavailable}
                  onClick={() => {
                    const next = applySyncEventPayload(state, event, nowIso());
                    dispatch({ type: 'hydrate', state: next });
                    setLastResult(
                      alreadyApplied
                        ? `Evento ${event.id} já havia sido aplicado: nada foi duplicado (${totals.applications} candidaturas, ${totals.talents} talentos antes e depois).`
                        : `Evento ${event.id} aplicado: a candidatura foi atualizada sem criar registros novos.`
                    );
                    toast.success(
                      alreadyApplied
                        ? 'Evento repetido: nenhum registro duplicado.'
                        : 'Atualização aplicada à base local.'
                    );
                  }}
                >
                  Simular recebimento de atualização
                </Button>
                {sourceUnavailable ? (
                  <p className="text-[11px] text-destructive">
                    A fonte está indisponível. Restabeleça antes de receber
                    atualizações.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
        {lastResult ? <Alert variant="info">{lastResult}</Alert> : null}
      </Panel>

      <Panel className="flex flex-col gap-2">
        <PanelHeader
          eyebrow="Limites da demonstração"
          title="O que é simulado nesta demonstração"
        />
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            Os quatro conjuntos de dados acima: nenhum sistema externo é
            consultado.
          </li>
          <li>
            O envio de esclarecimentos: nenhum e-mail, WhatsApp ou notificação
            sai do ambiente.
          </li>
          <li>
            O retorno ao sistema de origem: registramos localmente e rotulamos
            como “Atualização externa não enviada — demonstração”.
          </li>
          <li>
            A análise assistida: os textos são montados a partir dos registros
            selecionados, sem chamada a modelo de linguagem.
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          Base local: {totals.talents} talentos, {totals.applications}{' '}
          candidaturas, {totals.clarifications} solicitações e{' '}
          {plural(totals.referrals, 'encaminhamento', 'encaminhamentos')}.
        </p>
      </Panel>
    </div>
  );
}
