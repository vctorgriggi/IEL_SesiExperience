'use client';

import { useState } from 'react';
import {
  CULTURE_INVITE_DEADLINE_DAYS,
  getSuggestedSampleSize,
  type CultureInviteRole
} from '@/features/iel-demo/analysis/culture-invites';
import type { FitAxisId } from '@/features/iel-demo/analysis/fit-axes';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import type { CultureInvitePerson } from '@/features/iel-demo/state/reducer';
import {
  competenciasDaEmpresa,
  getCompany,
  getCultureInvites,
  getCultureInviteStatus,
  type CultureInviteStatus
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { CultureRespondentInvite } from '@/features/iel-demo/types';
import {
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconPlus,
  IconTrash
} from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@workspace/ui/shadcn/dropdown-menu';
import { Input } from '@workspace/ui/shadcn/input';
import { Label } from '@workspace/ui/shadcn/label';
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

import { SimularEnvioDialog } from '../chat/simular-envio-dialog';
import { BADGE_DE_ESTADO, type EstadoDeCor } from '../metricas/cores';
import {
  PassoDeCompetencias,
  razaoDoMinimo
} from './competencias-do-questionario';

/**
 * Quem foi convidado e quem ainda falta (M2).
 *
 * Esta lista é da analista do IEL. A empresa não a vê — PRODUTO.md §5.2 diz
 * que quem responde sobre o próprio ambiente de trabalho não pode ficar
 * identificado para a gestão.
 *
 * Privacidade por padrão, linha a linha:
 *
 * - **Sem nome.** O convite não guarda nome; a linha mostra o e-mail
 *   corporativo, que é o que o reenvio precisa. O e-mail nasce mascarado
 *   ("d•••@cerrado.example.com") e só aparece inteiro por ação da analista —
 *   quem está olhando por cima do ombro dela não lê a lista.
 * - **Sem data da resposta.** "Respondeu", "Aguardando" ou "Prazo vencido",
 *   nunca "respondeu em 08/09 às 14h". Data exata + área pequena + a média do
 *   ponto reidentificam quem respondeu o quê.
 * - **Nunca resposta.** Não há como saber, desta tela, o que qualquer pessoa
 *   respondeu.
 */

/** Papel de quem responde, na palavra curta que cabe numa célula. */
const ROLE_LABEL: Record<CultureInviteRole, string> = {
  gestao: 'Gestão',
  rh: 'RH',
  equipe: 'Equipe'
};

const ROLE_OPTIONS: CultureInviteRole[] = ['equipe', 'gestao', 'rh'];

/** O estado da linha, sem data: quando a pessoa respondeu não aparece. */
const STATUS_LABEL: Record<CultureInviteStatus, string> = {
  respondido: 'Respondeu',
  aberto: 'Aguardando',
  expirado: 'Prazo vencido'
};

const STATUS_TOM: Record<CultureInviteStatus, EstadoDeCor> = {
  respondido: 'combina',
  aberto: 'neutro',
  expirado: 'atencao'
};

const STATUS_ICONE: Record<CultureInviteStatus, typeof IconCircleCheck> = {
  respondido: IconCircleCheck,
  aberto: IconClock,
  expirado: IconAlertCircle
};

function StatusBadge({ status }: { status: CultureInviteStatus }) {
  const Icone = STATUS_ICONE[status];
  return (
    <Badge
      variant="outline"
      className={cn('px-1.5', BADGE_DE_ESTADO[STATUS_TOM[status]])}
    >
      <Icone aria-hidden="true" />
      {STATUS_LABEL[status]}
    </Badge>
  );
}

/** "davi.rezende@cerrado.example.com" vira "d•••@cerrado.example.com". */
function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return `${local.slice(0, 1)}•••`;
  return `${local.slice(0, 1)}•••@${domain}`;
}

/** Uma linha em branco do formulário de convite. */
function emptyRow(): CultureInvitePerson {
  return { corporateEmail: '', role: 'equipe', area: '' };
}

/** Endereço absoluto do link, para a pessoa colar num e-mail. */
function inviteUrl(token: string): string {
  const path = routes.dashboard.iel.cultureInvite.byToken(token);
  return typeof window === 'undefined'
    ? path
    : `${window.location.origin}${path}`;
}

/** Menu da linha: o que dá para fazer com um convite já enviado. */
function InviteActions({
  invite,
  label
}: {
  invite: CultureRespondentInvite;
  /** Como a linha chama a pessoa: o e-mail, mascarado ou não. */
  label: string;
}) {
  const { dispatch } = useIelDemo();
  const [linkVisivel, setLinkVisivel] = useState<string | null>(null);
  const [simulando, setSimulando] = useState(false);
  const respondido = getCultureInviteStatus(invite) === 'respondido';
  const empresa = getCompany(invite.companyId)?.name;

  const copiar = async () => {
    const url = inviteUrl(invite.token);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado.');
    } catch {
      // Sem permissão de área de transferência (ou sem HTTPS): mostrar o
      // endereço é o que permite copiar à mão, em vez de um erro sem saída.
      setLinkVisivel(url);
      toast.info('Não deu para copiar. O link está na linha.');
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {linkVisivel ? (
        <span className="max-w-[16rem] truncate text-xs text-muted-foreground">
          {linkVisivel}
        </span>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ações para o convite de ${label}`}
            className="size-10"
          >
            <IconDotsVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={respondido}
            onSelect={() => {
              dispatch({
                type: 'resend-culture-invite',
                inviteId: invite.id,
                at: nowIso()
              });
              toast.success(
                `Link reenviado para ${label}, com mais ${CULTURE_INVITE_DEADLINE_DAYS} dias.`
              );
            }}
          >
            Reenviar link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void copiar()}>
            Copiar link
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={respondido}
            onSelect={() => setSimulando(true)}
          >
            Simular envio
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SimularEnvioDialog
        destinatario="colaborador"
        link={routes.dashboard.iel.cultureInvite.conversationByToken(
          invite.token
        )}
        contexto={{ empresa }}
        open={simulando}
        onOpenChange={setSimulando}
      />
    </div>
  );
}

/** A amostra convidada, uma pessoa por linha. */
export function CultureSampleTable({ companyId }: { companyId: string }) {
  const { state } = useIelDemo();
  const [mostrarEmails, setMostrarEmails] = useState(false);
  const invites = getCultureInvites(state, companyId);

  if (invites.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Ninguém foi convidado ainda. Sem respostas da equipe o perfil da empresa
        não fecha e a vaga fica sem base de comparação.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Sem nome e sem data da resposta: só quem foi convidado e se já
          respondeu.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMostrarEmails((atual) => !atual)}
        >
          {mostrarEmails ? <IconEyeOff /> : <IconEye />}
          {mostrarEmails ? 'Ocultar e-mails' : 'Mostrar e-mails'}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableCaption className="sr-only">
            Colaboradores convidados a responder sobre a empresa: e-mail{' '}
            {mostrarEmails ? 'completo' : 'mascarado'}, área, papel e estado
          </TableCaption>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead scope="col">E-mail corporativo</TableHead>
              <TableHead
                scope="col"
                className="w-[12rem]"
              >
                Área
              </TableHead>
              <TableHead
                scope="col"
                className="w-[7rem]"
              >
                Papel
              </TableHead>
              <TableHead
                scope="col"
                className="w-[10rem]"
              >
                Estado
              </TableHead>
              <TableHead
                scope="col"
                className="w-12"
              >
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => {
              const email = mostrarEmails
                ? invite.corporateEmail
                : maskEmail(invite.corporateEmail);
              return (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invite.area}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="px-1.5 text-muted-foreground"
                    >
                      {ROLE_LABEL[invite.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={getCultureInviteStatus(invite)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <InviteActions
                      invite={invite}
                      label={email}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

/**
 * O formulário de convite, que mora no painel lateral.
 *
 * Várias linhas de uma vez porque a amostra é cadastrada de uma vez: a
 * analista tem a lista da empresa na mão e não vai abrir o painel seis vezes.
 * O quadro da área serve só para a dica de quantas pessoas convidar (R2) e
 * não é gravado — é conta de tela, não dado da empresa.
 */
export function CultureInviteForm({
  companyId,
  onDone
}: {
  companyId: string;
  onDone: () => void;
}) {
  const { state, dispatch } = useIelDemo();
  const [headcount, setHeadcount] = useState('30');
  // A escolha começa no que a empresa já tem guardado — e, para quem nunca
  // escolheu, isso é as 11 (`competenciasDaEmpresa`). Todas marcadas por
  // padrão: quem não quiser mexer manda o instrumento inteiro, como antes.
  const [competencias, setCompetencias] = useState<FitAxisId[]>(() =>
    competenciasDaEmpresa(state, companyId)
  );
  const [linhas, setLinhas] = useState<CultureInvitePerson[]>([
    emptyRow(),
    emptyRow(),
    emptyRow()
  ]);

  const sugerido = getSuggestedSampleSize(Number.parseInt(headcount, 10));
  const preenchidas = linhas.filter(
    (linha) => linha.corporateEmail.trim().length > 0
  );

  const atualizar = (index: number, patch: Partial<CultureInvitePerson>) =>
    setLinhas((atual) =>
      atual.map((linha, i) => (i === index ? { ...linha, ...patch } : linha))
    );

  const travaDoMinimo = razaoDoMinimo(competencias.length);

  const enviar = () => {
    if (preenchidas.length === 0 || travaDoMinimo !== null) return;
    // A escolha é gravada antes dos convites: o bloco de cada convite é
    // calculado na abertura do link, e precisa achar a escolha já no estado.
    dispatch({
      type: 'set-company-competencies',
      companyId,
      axisIds: competencias,
      decidedBy: 'analista',
      at: nowIso()
    });
    dispatch({
      type: 'add-culture-invites',
      companyId,
      people: preenchidas,
      at: nowIso()
    });
    setLinhas([emptyRow(), emptyRow(), emptyRow()]);
    onDone();
    toast.success(
      `${plural(preenchidas.length, 'convite enviado', 'convites enviados')}. Cada pessoa recebe um link próprio, sem login.`
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {/*
       * A escolha do que medir vem antes da lista de e-mails: é ela que
       * define o que cada pessoa convidada vai responder.
       */}
      <PassoDeCompetencias
        escolhidas={competencias}
        onChange={setCompetencias}
        idPrefix={`convite-${companyId}`}
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor="headcount">Quantas pessoas há na área da vaga?</Label>
        <Input
          id="headcount"
          inputMode="numeric"
          className="w-28"
          value={headcount}
          onChange={(event) => setHeadcount(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Convide cerca de {sugerido} {sugerido === 1 ? 'pessoa' : 'pessoas'} da
          área e das áreas conexas. Cada uma recebe um link próprio, sem login,
          válido por {CULTURE_INVITE_DEADLINE_DAYS} dias.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {linhas.map((linha, index) => (
          <div
            // A posição é a identidade da linha: e-mail e área começam vazios
            // e mudam a cada tecla, então não servem de chave.
            key={index}
            className="flex flex-col gap-2 rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Pessoa {index + 1}
              </span>
              {linhas.length > 1 ? (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remover pessoa ${index + 1}`}
                  onClick={() =>
                    setLinhas((atual) => atual.filter((_, i) => i !== index))
                  }
                >
                  <IconTrash />
                </Button>
              ) : null}
            </div>

            <Input
              aria-label={`E-mail corporativo da pessoa ${index + 1}`}
              type="email"
              placeholder="E-mail corporativo"
              value={linha.corporateEmail}
              onChange={(event) =>
                atualizar(index, { corporateEmail: event.target.value })
              }
            />
            <div className="flex gap-2">
              <Input
                aria-label={`Área da pessoa ${index + 1}`}
                placeholder="Área"
                value={linha.area}
                onChange={(event) =>
                  atualizar(index, { area: event.target.value })
                }
              />
              <Select
                value={linha.role}
                onValueChange={(value) =>
                  atualizar(index, { role: value as CultureInviteRole })
                }
              >
                <SelectTrigger
                  className="w-32"
                  aria-label={`Papel da pessoa ${index + 1}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem
                      key={role}
                      value={role}
                    >
                      {ROLE_LABEL[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() => setLinhas((atual) => [...atual, emptyRow()])}
        >
          <IconPlus />
          Acrescentar pessoa
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          disabled={preenchidas.length === 0 || travaDoMinimo !== null}
          onClick={enviar}
        >
          Enviar{' '}
          {preenchidas.length > 0
            ? plural(preenchidas.length, 'convite', 'convites')
            : 'convites'}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Guardamos só e-mail corporativo, área e papel — nome não entra. As
          respostas entram agregadas na média da empresa: nem a gestão vê quem
          respondeu o quê.
        </p>
      </div>
    </div>
  );
}
