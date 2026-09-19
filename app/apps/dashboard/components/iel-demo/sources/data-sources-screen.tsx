'use client';

import { useState } from 'react';
import { DEMO_SYNC_EVENTS } from '@/features/iel-demo/fixtures';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { applySyncEventPayload } from '@/features/iel-demo/state/reducer';
import { getApplication, getTalent } from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react';

import { toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { ImportEntry } from '../import/import-entry';
import { usePageHeader } from '../layout/page-header-context';
import { formatarDataHora } from '../shared/datas';

/**
 * De onde vem cada informação, e o que fazer quando ela para de vir.
 *
 * A tela responde duas perguntas do analista: "esse dado é de quando?" e "por
 * que essa fonte está em silêncio?". Por isso a tabela traz a última
 * atualização ao lado do estado, e a falha simulada preserva o que já havia
 * chegado — uma fonte indisponível deixa o dado velho visível e rotulado, em
 * vez de apagá-lo.
 */
export function DataSourcesScreen() {
  const { state, dispatch } = useIelDemo();
  const [lastResult, setLastResult] = useState<string | null>(null);

  usePageHeader({ breadcrumb: [{ label: 'De onde vem' }] });

  const totals = {
    talents: new Set(
      state.applications.map((application) => application.talentId)
    ).size,
    applications: state.applications.length,
    clarifications: state.clarifications.length,
    referrals: state.referrals.length
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">De onde vem</h1>
        <p className="text-sm text-muted-foreground">
          Cada tipo de informação com a sua origem e a última atualização
          recebida. Nenhum sistema externo é consultado nesta demonstração.
        </p>
      </div>

      <ImportEntry />

      <div className="flex flex-col gap-4">
        <h2 className="text-base font-medium">Fontes</h2>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead scope="col">Fonte</TableHead>
                <TableHead scope="col">Tipo de informação</TableHead>
                <TableHead scope="col">Registros</TableHead>
                <TableHead scope="col">Última atualização</TableHead>
                <TableHead scope="col">Estado</TableHead>
                <TableHead
                  scope="col"
                  className="text-right"
                >
                  Ação
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {state.dataSources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="align-top">
                    <p className="font-medium text-foreground">{source.name}</p>
                    <p className="max-w-[40ch] whitespace-normal text-xs text-muted-foreground">
                      {source.description}
                    </p>
                  </TableCell>
                  <TableCell className="align-top text-muted-foreground">
                    {source.kind}
                  </TableCell>
                  <TableCell className="align-top tabular-nums text-foreground">
                    {source.receivedRecords}
                  </TableCell>
                  <TableCell className="align-top tabular-nums text-muted-foreground">
                    {formatarDataHora(source.lastSyncAt)}
                  </TableCell>
                  <TableCell className="align-top">
                    {source.status === 'ativa' ? (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        <CircleCheckIcon className="text-success" />
                        Respondendo
                      </Badge>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          <CircleAlertIcon className="text-warning" />
                          Indisponível
                        </Badge>
                        <p className="max-w-[32ch] whitespace-normal text-xs text-muted-foreground">
                          {source.lastError}
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="align-top text-right">
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
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">Atualização simulada</h2>
          <p className="text-sm text-muted-foreground">
            Evento fixo. Receber o mesmo evento duas vezes não duplica
            candidatura nem talento: a idempotência é verificada pelo
            identificador do evento.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead scope="col">Evento</TableHead>
                <TableHead scope="col">Candidatura</TableHead>
                <TableHead scope="col">Estado</TableHead>
                <TableHead
                  scope="col"
                  className="text-right"
                >
                  Ação
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_SYNC_EVENTS.map((event) => {
                const alreadyApplied = state.appliedSyncEventIds.includes(
                  event.id
                );
                const application = getApplication(
                  state,
                  event.payload.applicationId
                );
                const talent = getTalent(event.payload.talentId);
                const sourceUnavailable =
                  state.dataSources.find(
                    (source) => source.id === event.sourceId
                  )?.status === 'indisponivel';

                return (
                  <TableRow key={event.id}>
                    <TableCell className="align-top">
                      <p className="font-medium text-foreground">
                        {event.title}
                      </p>
                      <p className="max-w-[44ch] whitespace-normal text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-normal align-top text-muted-foreground">
                      {talent?.name} · {application?.externalStage}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {alreadyApplied ? 'Já aplicado' : 'Não aplicado'}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={sourceUnavailable}
                        onClick={() => {
                          const next = applySyncEventPayload(
                            state,
                            event,
                            nowIso()
                          );
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
                        Simular recebimento
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {lastResult ? (
          <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            {lastResult}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        <h2 className="text-base font-medium">
          O que é simulado nesta demonstração
        </h2>
        <p className="max-w-[80ch] text-sm text-muted-foreground">
          Em produção o caminho seria sistema de recrutamento → dados
          autorizados de vagas e candidaturas → central do IEL → análise e
          encaminhamento → retorno ao processo de origem. Cada conector depende
          de permissões próprias e nenhum está confirmado para o IEL.
        </p>
        <p className="max-w-[80ch] text-sm text-muted-foreground">
          As quatro fontes acima: nenhum sistema externo é consultado. O envio
          de perguntas: nenhum e-mail ou mensagem sai do ambiente. O retorno ao
          sistema de origem: fica registrado localmente e rotulado como não
          enviado.
        </p>
        <p className="text-xs text-muted-foreground">
          Base local: {totals.talents} talentos, {totals.applications}{' '}
          candidaturas, {totals.clarifications} perguntas e{' '}
          {plural(totals.referrals, 'encaminhamento', 'encaminhamentos')}.
        </p>
      </div>
    </div>
  );
}
