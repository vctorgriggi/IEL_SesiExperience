'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MOTIVO_NAO_CONTRATOU_LABEL,
  MOTIVO_SAIDA_LABEL,
  PERMANENCIA_DIAS
} from '@/features/iel-demo/analysis/devolutiva';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCompany,
  getEvidencesByIds,
  getJob,
  getReferral,
  getReferralOutcomeSummary,
  getReferralsByCompany,
  getRegisteredReferrals,
  getTalent,
  REFERRAL_STAGE_LABEL,
  type ReferralOutcomeRow
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { ReferralItem } from '@/features/iel-demo/types';
import {
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  SearchIcon
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { Alert, Textarea, toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { usePageHeader } from '../layout/page-header-context';
import { BADGE_DE_ESTADO, type EstadoDeCor } from '../metricas/cores';
import { formatarDataHora } from '../shared/datas';
import { ReferralReportLink } from './report-link';

/**
 * "2 sem resposta há 4 dias" — o que a analista precisa para cobrar.
 *
 * Os dias só entram quando já passou pelo menos um: "há 0 dias" é ruído no
 * dia do envio, e é justamente o dia em que ninguém cobra nada.
 */
function esperaEmAberto(resumo: {
  pendentes: number;
  maiorEsperaDias: number | null;
}): string {
  const base = `${resumo.pendentes} sem resposta`;
  const dias = resumo.maiorEsperaDias;
  if (dias === null || dias <= 0) return base;
  return `${base} há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/**
 * O desfecho de uma pessoa, do lado de quem cobra (C3).
 *
 * O ciclo parava em "quero entrevistar", que é intenção. O que decide se a
 * vaga fechou — e se a pessoa ficou — só chega quando a empresa responde o
 * relatório, e é esta etiqueta que mostra o que já chegou e o que falta.
 * Cor nunca sozinha: a palavra é que carrega o estado.
 */
function DesfechoDaEmpresa({ linha }: { linha: ReferralOutcomeRow }) {
  const { outcome, retentionState, waitingDays } = linha;

  const [texto, tom, Icone]: [string, EstadoDeCor, typeof CircleCheckIcon] =
    retentionState === 'saiu-antes-de-90-dias'
      ? [`Saiu antes de ${PERMANENCIA_DIAS} dias`, 'atencao', CircleMinusIcon]
      : retentionState === 'continua'
        ? [`Ficou ${PERMANENCIA_DIAS} dias`, 'combina', CircleCheckIcon]
        : retentionState === 'a-perguntar'
          ? [
              waitingDays && waitingDays > 0
                ? `Contratou · permanência em aberto há ${waitingDays} ${waitingDays === 1 ? 'dia' : 'dias'}`
                : 'Contratou · permanência a confirmar',
              'atencao',
              CircleAlertIcon
            ]
          : outcome.hiring === 'contratou'
            ? ['Contratou', 'combina', CircleCheckIcon]
            : outcome.hiring === 'nao-contratou'
              ? ['Não contratou', 'neutro', CircleDashedIcon]
              : [
                  waitingDays === null || waitingDays <= 0
                    ? 'Sem devolutiva'
                    : `Sem devolutiva há ${waitingDays} ${waitingDays === 1 ? 'dia' : 'dias'}`,
                  'atencao',
                  CircleAlertIcon
                ];

  const motivo =
    retentionState === 'saiu-antes-de-90-dias' && outcome.retentionReason
      ? MOTIVO_SAIDA_LABEL[outcome.retentionReason]
      : outcome.hiring === 'nao-contratou' && outcome.hiringReason
        ? MOTIVO_NAO_CONTRATOU_LABEL[outcome.hiringReason]
        : null;

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant="outline"
        className={BADGE_DE_ESTADO[tom]}
      >
        <Icone aria-hidden="true" />
        {texto}
      </Badge>
      {motivo ? (
        <p className="text-xs text-muted-foreground">
          Motivo informado: {motivo.toLowerCase()}
        </p>
      ) : null}
      {outcome.hiringNote || outcome.retentionNote ? (
        <p className="text-xs text-muted-foreground">
          “{outcome.retentionNote ?? outcome.hiringNote}”
        </p>
      ) : null}
    </div>
  );
}

/**
 * O retorno da empresa, escrito ao lado do ícone.
 *
 * Cor não é o único canal: quem não distingue verde de laranja continua
 * lendo a palavra que decide se ainda falta alguém responder.
 */
function DecisaoDaEmpresa({ item }: { item: ReferralItem }) {
  if (item.managerDecision === 'quero-entrevistar') {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        <CircleCheckIcon className="text-success" />
        Empresa quer entrevistar
      </Badge>
    );
  }
  if (item.managerDecision === 'nao-avancar') {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        <CircleDashedIcon />
        Empresa não vai avançar
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="text-muted-foreground"
    >
      <CircleAlertIcon className="text-[hsl(var(--brand-accent))]" />
      Aguardando retorno da empresa
    </Badge>
  );
}

/**
 * Enviados: o que já saiu do IEL para as empresas.
 *
 * Uma lista, não um painel. A pergunta que traz o analista aqui é "de qual
 * empresa eu ainda não tive retorno?", e a coluna de estado responde isso
 * antes de qualquer clique. O detalhe — evidências, justificativas, retorno
 * por pessoa — abre no encaminhamento.
 */
export function ReferralsScreen() {
  const { state, persona } = useIelDemo();
  const [busca, setBusca] = useState('');
  const iel = routes.dashboard.iel;
  const isManager = persona.kind === 'gestor';

  usePageHeader({ breadcrumb: [{ label: 'Enviados' }] });

  const referrals = (
    isManager && persona.companyId
      ? getReferralsByCompany(state, persona.companyId)
      : getRegisteredReferrals(state)
  ).filter((referral) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    const job = getJob(referral.jobId);
    const company = getCompany(referral.companyId);
    return (
      (job?.title.toLowerCase().includes(termo) ?? false) ||
      (company?.name.toLowerCase().includes(termo) ?? false)
    );
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {isManager ? 'Perfis encaminhados' : 'Enviados'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isManager
            ? 'Apenas os perfis compartilhados com a sua empresa.'
            : 'Cada envio guarda um retrato das informações no momento em que saiu.'}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-xs">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Buscar vaga ou empresa"
              placeholder="Buscar vaga ou empresa"
              className="h-8 pl-8"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </div>
        </div>

        {referrals.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              {isManager
                ? 'Quando o IEL compartilhar perfis para uma vaga da sua empresa, eles aparecem aqui com as evidências autorizadas.'
                : 'Nenhum envio ainda. O envio nasce da lista de uma vaga, depois de marcar quem vai.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col">Vaga</TableHead>
                  <TableHead scope="col">Quem foi</TableHead>
                  <TableHead scope="col">Retorno da empresa</TableHead>
                  <TableHead scope="col">O que aconteceu</TableHead>
                  <TableHead scope="col">Enviado em</TableHead>
                  <TableHead
                    scope="col"
                    className="text-right"
                  >
                    Ação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => {
                  const job = getJob(referral.jobId);
                  const company = getCompany(referral.companyId);
                  const pending = referral.items.filter(
                    (item) => item.managerDecision === 'pendente'
                  ).length;
                  const desfechos = getReferralOutcomeSummary(
                    state,
                    referral.id,
                    nowIso()
                  );
                  const nomes = referral.items
                    .map((item) => {
                      const application = getApplication(
                        state,
                        item.applicationId
                      );
                      return application
                        ? getTalent(application.talentId)?.name
                        : null;
                    })
                    .filter((nome): nome is string => Boolean(nome));

                  return (
                    <TableRow key={referral.id}>
                      <TableCell className="max-w-[32ch] whitespace-normal align-top">
                        <Link
                          className="font-medium text-foreground underline underline-offset-2"
                          href={iel.referrals.byId(referral.id)}
                        >
                          {job?.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {company?.name} · {referral.id}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[32ch] whitespace-normal align-top">
                        <span className="text-foreground">
                          {nomes.join(', ')}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {plural(referral.items.length, 'perfil', 'perfis')}
                        </p>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          {pending > 0 ? (
                            <CircleAlertIcon className="text-[hsl(var(--brand-accent))]" />
                          ) : (
                            <CircleCheckIcon className="text-success" />
                          )}
                          {pending > 0
                            ? `${pending} aguardando`
                            : 'Retornos registrados'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[28ch] whitespace-normal align-top">
                        {desfechos ? (
                          <>
                            <span className="text-foreground">
                              {desfechos.respondidos} de {desfechos.total}{' '}
                              {desfechos.respondidos === 1
                                ? 'respondido'
                                : 'respondidos'}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {desfechos.contratados > 0
                                ? `${desfechos.contratados} ${desfechos.contratados === 1 ? 'contratado' : 'contratados'}`
                                : 'nenhuma contratação informada'}
                              {desfechos.pendentes > 0
                                ? ` · ${esperaEmAberto(desfechos)}`
                                : ''}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top tabular-nums text-muted-foreground">
                        {referral.createdAt
                          ? formatarDataHora(referral.createdAt)
                          : '—'}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={iel.referrals.byId(referral.id)}>
                            {isManager ? 'Abrir lista' : 'Ver retornos'}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          “Quero entrevistar” registra a intenção da empresa e atualiza o
          histórico. Nenhuma reunião é agendada e nenhuma contratação é
          automatizada nesta demonstração.
        </p>
      </div>
    </div>
  );
}

export function ReferralDetailScreen({ referralId }: { referralId: string }) {
  const { state, dispatch, persona } = useIelDemo();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const iel = routes.dashboard.iel;

  const referral = getReferral(state, referralId);
  const job = referral ? getJob(referral.jobId) : null;
  const company = referral ? getCompany(referral.companyId) : null;
  const isManager = persona.kind === 'gestor';
  // O que a empresa já devolveu e o que falta: é com isto que a analista
  // cobra — "a gente tem que ficar em cima" (00:44:09).
  const desfechos = getReferralOutcomeSummary(state, referralId, nowIso());

  /*
    O caminho é publicado antes das saídas antecipadas: `usePageHeader` é um
    hook, e o encaminhamento inexistente não pode mudar a ordem das chamadas.
  */
  usePageHeader({
    breadcrumb: [
      { label: 'Enviados', href: iel.referrals.index },
      { label: job?.title ?? referralId }
    ],
    actions: (
      <Button
        variant="outline"
        size="sm"
        asChild
      >
        <Link href={iel.referrals.index}>Voltar</Link>
      </Button>
    )
  });

  if (!referral || referral.state !== 'registrado') {
    return <Alert variant="destructive">Encaminhamento não encontrado.</Alert>;
  }

  if (
    persona.kind === 'gestor' &&
    persona.companyId &&
    persona.companyId !== referral.companyId
  ) {
    return (
      <Alert variant="warning">
        Este encaminhamento é de outra empresa e está fora do escopo desta
        persona.{' '}
        <Link
          className="underline"
          href={iel.referrals.index}
        >
          Ver os encaminhamentos da minha empresa
        </Link>
        .
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {isManager
            ? 'Perfis compartilhados pelo IEL'
            : `Encaminhamento ${referral.id}`}
        </h1>
        <p className="text-sm text-muted-foreground">
          {company?.name} · {job?.title} — {referral.message}
        </p>
        <p className="text-xs text-muted-foreground">
          Retrato registrado em{' '}
          {referral.createdAt ? formatarDataHora(referral.createdAt) : '—'}.
          Notas internas do IEL e dados de outras empresas não fazem parte deste
          conteúdo.
        </p>
      </div>

      {!isManager && desfechos ? (
        <div className="flex flex-col gap-1 rounded-lg border p-3">
          <p className="text-sm font-medium">
            {desfechos.respondidos} de {desfechos.total} com desfecho informado
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {desfechos.contratados > 0
              ? `${desfechos.contratados} ${desfechos.contratados === 1 ? 'contratação informada' : 'contratações informadas'}`
              : 'Nenhuma contratação informada'}
            {desfechos.naoContratados > 0
              ? ` · ${desfechos.naoContratados} sem contratação`
              : ''}
            {desfechos.saidasAntes90 > 0
              ? ` · ${desfechos.saidasAntes90} ${desfechos.saidasAntes90 === 1 ? 'saiu' : 'saíram'} antes de ${PERMANENCIA_DIAS} dias`
              : ''}
            {desfechos.pendentes > 0 ? ` · ${esperaEmAberto(desfechos)}` : ''}.
            A empresa responde na própria página do relatório, em um clique.
          </p>
        </div>
      ) : null}

      {!isManager ? <ReferralReportLink jobId={referral.jobId} /> : null}

      <ul className="flex flex-col gap-4">
        {referral.items.map((item) => {
          const application = getApplication(state, item.applicationId);
          const talent = application ? getTalent(application.talentId) : null;
          const evidences = getEvidencesByIds(state, item.sharedEvidenceIds);
          const note = notes[item.applicationId] ?? '';
          const linha = desfechos?.linhas.find(
            (entrada) => entrada.applicationId === item.applicationId
          );

          return (
            <li key={item.applicationId}>
              <Card>
                <CardHeader>
                  <CardTitle>{talent?.name}</CardTitle>
                  <CardDescription>{item.summary}</CardDescription>
                  <CardAction>
                    <div className="flex flex-wrap justify-end gap-2">
                      {linha ? <DesfechoDaEmpresa linha={linha} /> : null}
                      <DecisaoDaEmpresa item={item} />
                      {application ? (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          {REFERRAL_STAGE_LABEL[application.referralStage]}
                        </Badge>
                      ) : null}
                    </div>
                  </CardAction>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Justificativa do IEL
                    </p>
                    <p className="text-sm text-foreground">
                      {item.justification}
                    </p>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Pontos de atenção
                      </p>
                      {item.attentionPoints.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum ponto pendente.
                        </p>
                      ) : (
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {item.attentionPoints.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Perguntas sugeridas para a entrevista
                      </p>
                      {item.suggestedQuestions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Sem perguntas pendentes.
                        </p>
                      ) : (
                        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                          {item.suggestedQuestions.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Evidências compartilhadas ({evidences.length})
                    </p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {evidences.map((evidence) => (
                        <li key={evidence.id}>
                          “{evidence.information}” — {evidence.originLabel}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {item.managerNote ? (
                    <div className="rounded-md border bg-muted/50 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        Retorno da empresa
                      </p>
                      <p className="text-sm text-foreground">
                        {item.managerNote}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.decidedAt ? formatarDataHora(item.decidedAt) : ''}
                      </p>
                    </div>
                  ) : null}

                  {isManager && item.managerDecision === 'pendente' ? (
                    <div className="flex flex-col gap-2 border-t pt-3">
                      <Label htmlFor={`manager-note-${item.applicationId}`}>
                        Observação operacional (obrigatória para “Não avançar”)
                      </Label>
                      <Textarea
                        id={`manager-note-${item.applicationId}`}
                        rows={2}
                        value={note}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [item.applicationId]: event.target.value
                          }))
                        }
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            dispatch({
                              type: 'manager-decision',
                              referralId: referral.id,
                              applicationId: item.applicationId,
                              decision: 'quero-entrevistar',
                              note,
                              at: nowIso()
                            });
                            toast.success(
                              'Interesse registrado. Nenhuma reunião foi agendada nesta demonstração.'
                            );
                          }}
                        >
                          Quero entrevistar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={note.trim().length === 0}
                          onClick={() => {
                            dispatch({
                              type: 'manager-clarification-request',
                              referralId: referral.id,
                              applicationId: item.applicationId,
                              question: note,
                              at: nowIso()
                            });
                            toast.success(
                              'Pedido de esclarecimento registrado para o IEL. A candidatura segue encaminhada.'
                            );
                          }}
                        >
                          Solicitar esclarecimento ao IEL
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={note.trim().length === 0}
                          onClick={() => {
                            dispatch({
                              type: 'manager-decision',
                              referralId: referral.id,
                              applicationId: item.applicationId,
                              decision: 'nao-avancar',
                              note,
                              at: nowIso()
                            });
                            toast.success(
                              'Decisão registrada com a justificativa informada.'
                            );
                          }}
                        >
                          Não avançar
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {!isManager ? (
                    <div>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <Link
                          href={
                            application
                              ? iel.talents
                                  .byId(application.talentId)
                                  .inJob(referral.jobId)
                              : iel.talents.index
                          }
                        >
                          Abrir perfil completo (visão IEL)
                        </Link>
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      {isManager ? (
        <Alert variant="default">
          Você vê apenas o conteúdo compartilhado neste encaminhamento.
          Avaliações internas, notas do analista e candidaturas de outras
          empresas não são exibidas.
        </Alert>
      ) : null}
    </div>
  );
}
