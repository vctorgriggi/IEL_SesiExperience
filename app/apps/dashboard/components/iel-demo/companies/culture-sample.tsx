'use client';

import { useState } from 'react';
import {
  CULTURE_INVITE_DEADLINE_DAYS,
  getSuggestedSampleSize,
  type CultureInviteRole
} from '@/features/iel-demo/analysis/culture-invites';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import type { CultureInvitePerson } from '@/features/iel-demo/state/reducer';
import {
  DEMO_REFERENCE_DATE,
  getCultureInvites,
  type CultureInviteStatus
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { CultureRespondentInvite } from '@/features/iel-demo/types';
import { MoreVertical, Plus, Trash2 } from 'lucide-react';

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
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';

/**
 * Quem foi convidado e quem ainda falta (M2).
 *
 * Esta lista é da analista do IEL. A empresa não a vê — PRODUTO.md §5.2 diz
 * que quem responde sobre o próprio ambiente de trabalho não pode ficar
 * identificado para a gestão, e uma linha com "respondeu em 08/09" ao lado do
 * nome é exatamente essa identificação.
 *
 * O que aparece aqui é operação do convite (nome, área, papel, estado), nunca
 * resposta: não há como saber, desta tela, o que qualquer pessoa respondeu.
 */

/** Papel de quem responde, na palavra curta que cabe numa célula. */
const ROLE_LABEL: Record<CultureInviteRole, string> = {
  gestao: 'Gestão',
  rh: 'RH',
  equipe: 'Equipe'
};

const ROLE_OPTIONS: CultureInviteRole[] = ['equipe', 'gestao', 'rh'];

/** "DD/MM": a data como a linha a diz, sem o ano corrente. */
function shortDate(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}

/**
 * Estado do convite contra a data da demonstração.
 *
 * Repete a regra de `readInviteStatus` porque o seletor não a exporta; o que
 * ela decide é só o texto da linha — quem responde ou não continua sendo o
 * reducer.
 */
function inviteStatus(invite: CultureRespondentInvite): CultureInviteStatus {
  if (invite.answeredAt) return 'respondido';
  return DEMO_REFERENCE_DATE > invite.expiresAt ? 'expirado' : 'aberto';
}

function statusLabel(invite: CultureRespondentInvite): string {
  const status = inviteStatus(invite);
  if (status === 'respondido') {
    return `Respondeu em ${shortDate(invite.answeredAt ?? '')}`;
  }
  if (status === 'expirado') return `Venceu em ${shortDate(invite.expiresAt)}`;
  return `Aguardando · vence em ${shortDate(invite.expiresAt)}`;
}

/** Uma linha em branco do formulário de convite. */
function emptyRow(): CultureInvitePerson {
  return { name: '', corporateEmail: '', role: 'equipe', area: '' };
}

/** Endereço absoluto do link, para a pessoa colar num e-mail. */
function inviteUrl(token: string): string {
  const path = routes.dashboard.iel.cultureInvite.byToken(token);
  return typeof window === 'undefined'
    ? path
    : `${window.location.origin}${path}`;
}

/** Menu da linha: o que dá para fazer com um convite já enviado. */
function InviteActions({ invite }: { invite: CultureRespondentInvite }) {
  const { dispatch } = useIelDemo();
  const [linkVisivel, setLinkVisivel] = useState<string | null>(null);
  const respondido = inviteStatus(invite) === 'respondido';

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
            size="icon-sm"
            aria-label={`Ações do convite de ${invite.name}`}
          >
            <MoreVertical />
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
                `Link reenviado para ${invite.name.split(' ')[0]}, com mais ${CULTURE_INVITE_DEADLINE_DAYS} dias.`
              );
            }}
          >
            Reenviar link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void copiar()}>
            Copiar link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** A amostra convidada, uma pessoa por linha. */
export function CultureSampleTable({ companyId }: { companyId: string }) {
  const { state } = useIelDemo();
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
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Pessoa</TableHead>
            <TableHead className="w-[12rem]">Área</TableHead>
            <TableHead className="w-[7rem]">Papel</TableHead>
            <TableHead className="w-[14rem]">Estado</TableHead>
            <TableHead className="w-[6rem] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="font-medium">{invite.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {invite.area}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{ROLE_LABEL[invite.role]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {statusLabel(invite)}
              </TableCell>
              <TableCell className="text-right">
                <InviteActions invite={invite} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
  const { dispatch } = useIelDemo();
  const [headcount, setHeadcount] = useState('30');
  const [linhas, setLinhas] = useState<CultureInvitePerson[]>([
    emptyRow(),
    emptyRow(),
    emptyRow()
  ]);

  const sugerido = getSuggestedSampleSize(Number.parseInt(headcount, 10));
  const preenchidas = linhas.filter(
    (linha) =>
      linha.name.trim().length > 0 && linha.corporateEmail.trim().length > 0
  );

  const atualizar = (index: number, patch: Partial<CultureInvitePerson>) =>
    setLinhas((atual) =>
      atual.map((linha, i) => (i === index ? { ...linha, ...patch } : linha))
    );

  const enviar = () => {
    if (preenchidas.length === 0) return;
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
            // A posição é a identidade da linha: nome e e-mail começam vazios
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
                  <Trash2 />
                </Button>
              ) : null}
            </div>

            <Input
              aria-label={`Nome da pessoa ${index + 1}`}
              placeholder="Nome"
              value={linha.name}
              onChange={(event) =>
                atualizar(index, { name: event.target.value })
              }
            />
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
          <Plus />
          Acrescentar pessoa
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          disabled={preenchidas.length === 0}
          onClick={enviar}
        >
          Enviar{' '}
          {preenchidas.length > 0
            ? plural(preenchidas.length, 'convite', 'convites')
            : 'convites'}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Guardamos só nome e e-mail corporativo. As respostas entram agregadas
          na média da empresa: nem a gestão vê quem respondeu o quê.
        </p>
      </div>
    </div>
  );
}
