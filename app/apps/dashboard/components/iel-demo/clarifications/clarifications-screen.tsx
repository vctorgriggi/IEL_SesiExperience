'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CLARIFICATION_STATE_LABEL,
  getApplication,
  getCompany,
  getCriterion,
  getJob,
  getTalent
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Clarification } from '@/features/iel-demo/types';
import {
  IconAlertCircle,
  IconCircleCheck,
  IconDots,
  IconSearch
} from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';
import { Input } from '@workspace/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { usePageHeader } from '../layout/page-header-context';
import { formatarData } from '../shared/datas';
import { IncorporateClarificationDialog } from './incorporate-clarification-dialog';

/**
 * Estado da pergunta, em etiqueta de fábrica.
 *
 * Cor só no ícone — "respondida" e "incorporada" ganham um sinal verde,
 * "solicitada" um sinal âmbar de que alguém está esperando. Rascunho e
 * cancelada não recebem ícone: não há nada acontecendo com elas.
 */
function EstadoDaPergunta({ clarification }: { clarification: Clarification }) {
  const icone =
    clarification.state === 'respondida' ||
    clarification.state === 'incorporada' ? (
      <IconCircleCheck className="text-success" />
    ) : clarification.state === 'solicitada' ? (
      <IconAlertCircle className="text-warning" />
    ) : null;

  return (
    <Badge
      variant="outline"
      className="text-muted-foreground"
    >
      {icone}
      {CLARIFICATION_STATE_LABEL[clarification.state]}
    </Badge>
  );
}

/**
 * As perguntas em aberto, numa lista só.
 *
 * O analista chega aqui para saber de quem ele está esperando resposta, e é
 * isso que a tabela ordena: quem, sobre qual vaga, em que estado. A pergunta
 * inteira fica na linha, porque ler "Sobre o apoio nas primeiras semanas…" é
 * o que permite decidir sem abrir.
 */
export function ClarificationsScreen() {
  const { state, dispatch, persona } = useIelDemo();
  const [busca, setBusca] = useState('');
  const [stateFilter, setStateFilter] = useState('todas');
  const [incorporating, setIncorporating] = useState<Clarification | null>(
    null
  );
  const iel = routes.dashboard.iel;
  const analista = persona.kind === 'analista';

  usePageHeader({ breadcrumb: [{ label: 'Perguntas' }] });

  const visible = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return state.clarifications.filter((clarification) => {
      if (
        persona.kind === 'gestor' &&
        persona.companyId &&
        !(
          clarification.recipient.kind === 'gestor' &&
          clarification.recipient.companyId === persona.companyId
        )
      ) {
        return false;
      }
      if (stateFilter !== 'todas' && clarification.state !== stateFilter) {
        return false;
      }
      if (!termo) return true;
      const job = getJob(clarification.jobId);
      return (
        clarification.question.toLowerCase().includes(termo) ||
        clarification.recipient.name.toLowerCase().includes(termo) ||
        (job?.title.toLowerCase().includes(termo) ?? false)
      );
    });
  }, [state.clarifications, persona, stateFilter, busca]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {analista ? 'Perguntas' : 'Perguntas recebidas'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {analista
            ? 'De quem o IEL está esperando resposta. A tela de quem recebe abre aqui mesmo.'
            : 'O que o IEL perguntou sobre a sua equipe.'}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="relative w-full max-w-xs">
            <IconSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Buscar pergunta, pessoa ou vaga"
              placeholder="Buscar pergunta, pessoa ou vaga"
              className="h-8 pl-8"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </div>
          {analista ? (
            <Select
              value={stateFilter}
              onValueChange={setStateFilter}
            >
              <SelectTrigger
                size="sm"
                aria-label="Filtrar por estado"
                className="w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos os estados</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="solicitada">Solicitada</SelectItem>
                <SelectItem value="respondida">Respondida</SelectItem>
                <SelectItem value="incorporada">Incorporada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              {analista
                ? 'Nenhuma pergunta com esse filtro. Uma pergunta nasce de um critério, na mesa de seleção da vaga.'
                : 'Quando o IEL enviar uma pergunta sobre a sua equipe, ela aparece aqui.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead scope="col">Pergunta</TableHead>
                  <TableHead scope="col">Para quem</TableHead>
                  <TableHead scope="col">Vaga</TableHead>
                  <TableHead scope="col">Criada em</TableHead>
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
                {visible.map((clarification) => {
                  const job = getJob(clarification.jobId);
                  const company = job ? getCompany(job.companyId) : null;
                  const criterion = job
                    ? getCriterion(job, clarification.criterionId)
                    : null;
                  const application = clarification.applicationId
                    ? getApplication(state, clarification.applicationId)
                    : null;
                  const talent = application
                    ? getTalent(application.talentId)
                    : null;

                  return (
                    <TableRow key={clarification.id}>
                      <TableCell className="max-w-[40ch] whitespace-normal align-top">
                        <p className="font-medium text-foreground">
                          {clarification.question}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Sobre {criterion?.label ?? clarification.criterionId}
                          {talent ? (
                            <>
                              {' · '}
                              <Link
                                className="underline underline-offset-2"
                                href={iel.talents
                                  .byId(talent.id)
                                  .inJob(clarification.jobId)}
                              >
                                {talent.name}
                              </Link>
                            </>
                          ) : null}
                        </p>
                        {clarification.answer ? (
                          <p className="border-l-2 pl-2 text-xs italic text-muted-foreground">
                            {clarification.answer}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-normal align-top">
                        <p className="text-foreground">
                          {clarification.recipient.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {clarification.recipient.role}
                        </p>
                      </TableCell>
                      <TableCell className="whitespace-normal align-top">
                        {job ? (
                          <Link
                            className="text-foreground underline underline-offset-2"
                            href={iel.jobs.byId(job.id).index}
                          >
                            {job.title}
                          </Link>
                        ) : (
                          clarification.jobId
                        )}
                        <p className="text-xs text-muted-foreground">
                          {company?.name}
                        </p>
                      </TableCell>
                      <TableCell className="align-top tabular-nums text-muted-foreground">
                        {formatarData(clarification.createdAt)}
                      </TableCell>
                      <TableCell className="align-top">
                        <EstadoDaPergunta clarification={clarification} />
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {clarification.state === 'solicitada' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                            >
                              <Link
                                href={iel.clarifications.respond(
                                  clarification.id
                                )}
                              >
                                {analista ? 'Abrir o link' : 'Responder'}
                              </Link>
                            </Button>
                          ) : null}
                          {clarification.state === 'respondida' && analista ? (
                            <Button
                              size="sm"
                              onClick={() => setIncorporating(clarification)}
                            >
                              Incorporar
                            </Button>
                          ) : null}
                          {analista ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Mais ações"
                                >
                                  <IconDots />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {clarification.state === 'rascunho' ? (
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      dispatch({
                                        type: 'send-clarification',
                                        clarificationId: clarification.id,
                                        at: nowIso()
                                      });
                                      toast.success('Pergunta enviada.');
                                    }}
                                  >
                                    Enviar pergunta
                                  </DropdownMenuItem>
                                ) : null}
                                {job ? (
                                  <DropdownMenuItem asChild>
                                    <Link href={iel.jobs.byId(job.id).index}>
                                      Abrir a vaga
                                    </Link>
                                  </DropdownMenuItem>
                                ) : null}
                                {clarification.state === 'solicitada' ||
                                clarification.state === 'rascunho' ? (
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      dispatch({
                                        type: 'cancel-clarification',
                                        clarificationId: clarification.id,
                                        at: nowIso()
                                      });
                                      toast.success(
                                        'Pergunta cancelada. A análise não mudou.'
                                      );
                                    }}
                                  >
                                    Cancelar pergunta
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Nada é enviado por e-mail ou mensagem neste ambiente. “Abrir o link”
          mostra exatamente a tela que a pessoa veria no celular.
        </p>
      </div>

      {incorporating ? (
        <IncorporateClarificationDialog
          clarification={incorporating}
          visible
          onHide={() => setIncorporating(null)}
        />
      ) : null}
    </div>
  );
}
