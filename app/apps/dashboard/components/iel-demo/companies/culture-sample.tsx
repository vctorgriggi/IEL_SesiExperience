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
  getCultureSampleProgress,
  type CultureInviteStatus
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { CultureRespondentInvite } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';
import { Button, cn, FilterNativeSelect, Input, toast } from '@workspace/ui';

import { Chip, InfoHint, Panel, PanelHeader } from '../shared/ui';

/** Papel de quem responde, na palavra curta que cabe numa linha de lista. */
const ROLE_LABEL: Record<CultureInviteRole, string> = {
  gestao: 'Gestão',
  rh: 'RH',
  equipe: 'Equipe'
};

const ITENS_VISIVEIS = 5;

/** "DD/MM": a data como a linha de lista a diz, sem o ano corrente. */
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

/** Uma linha em branco do formulário de convite. */
function emptyRow(area: string): CultureInvitePerson {
  return { name: '', corporateEmail: '', role: 'equipe', area };
}

/** Uma pessoa convidada: quem é, em que estado está e o que fazer com ela. */
function InviteRow({ invite }: { invite: CultureRespondentInvite }) {
  const { dispatch } = useIelDemo();
  const [linkVisivel, setLinkVisivel] = useState<string | null>(null);
  const status = inviteStatus(invite);

  const estado =
    status === 'respondido'
      ? `respondeu em ${shortDate(invite.answeredAt ?? '')}`
      : status === 'expirado'
        ? 'prazo vencido'
        : `aguardando · vence em ${shortDate(invite.expiresAt)}`;

  const url = routes.dashboard.iel.cultureInvite.byToken(invite.token);
  const absoluteUrl =
    typeof window === 'undefined' ? url : `${window.location.origin}${url}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success('Link copiado.');
    } catch {
      // Sem permissão de área de transferência (ou sem HTTPS): mostrar o
      // endereço é o que permite copiar à mão, em vez de um erro sem saída.
      setLinkVisivel(absoluteUrl);
      toast.info('Não deu para copiar. O link está logo abaixo.');
    }
  };

  return (
    <li className="flex flex-col gap-2 border-b border-border px-1 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{invite.name}</p>
        <p className="text-xs text-muted-foreground">
          {invite.area} · {ROLE_LABEL[invite.role]}
        </p>
        <p
          className={cn(
            'mt-0.5 text-xs',
            status === 'respondido'
              ? 'text-success'
              : status === 'expirado'
                ? 'text-destructive'
                : 'text-warning'
          )}
        >
          {estado}
        </p>
        {linkVisivel ? (
          <p className="mt-1 break-all text-[11px] text-muted-foreground">
            {linkVisivel}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {status !== 'respondido' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
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
          </Button>
        ) : null}
        <Button
          size="sm"
          variant="ghost"
          onClick={copiar}
        >
          Copiar link
        </Button>
      </div>
    </li>
  );
}

/**
 * Quem foi convidado e quem ainda falta (M2).
 *
 * Esta seção é da analista do IEL: ela cadastra a amostra, acompanha quem
 * respondeu e cobra quem não respondeu. A empresa não a vê — PRODUTO.md §5.2
 * diz que quem responde sobre o próprio ambiente de trabalho não pode ficar
 * identificado para a gestão, e uma lista com "respondeu em 08/09" ao lado do
 * nome é exatamente essa identificação.
 *
 * O que aparece aqui é operação do convite (nome, área, papel, estado), nunca
 * resposta: não há como saber, desta tela, o que qualquer pessoa respondeu.
 */
export function CultureSampleSection({
  companyId,
  formOpen,
  onFormOpenChange
}: {
  companyId: string;
  /** O formulário é aberto pelo botão do herói, que vive em outro bloco. */
  formOpen: boolean;
  onFormOpenChange: (open: boolean) => void;
}) {
  const { state, dispatch } = useIelDemo();
  const invites = getCultureInvites(state, companyId);
  const progress = getCultureSampleProgress(state, companyId);

  const [verTodos, setVerTodos] = useState(false);
  const [headcount, setHeadcount] = useState('30');
  const [linhas, setLinhas] = useState<CultureInvitePerson[]>([emptyRow('')]);

  const visiveis = verTodos ? invites : invites.slice(0, ITENS_VISIVEIS);
  const sugerido = getSuggestedSampleSize(Number.parseInt(headcount, 10));

  const preenchidas = linhas.filter(
    (linha) => linha.name.trim().length > 0 && linha.corporateEmail.trim()
  );

  const enviar = () => {
    if (preenchidas.length === 0) return;
    dispatch({
      type: 'add-culture-invites',
      companyId,
      people: preenchidas,
      at: nowIso()
    });
    setLinhas([emptyRow('')]);
    onFormOpenChange(false);
    toast.success(
      `${plural(preenchidas.length, 'convite enviado', 'convites enviados')}. Cada pessoa recebe um link próprio, sem login.`
    );
  };

  const atualizar = (index: number, patch: Partial<CultureInvitePerson>) =>
    setLinhas((atual) =>
      atual.map((linha, i) => (i === index ? { ...linha, ...patch } : linha))
    );

  return (
    <Panel
      elevation={1}
      padding="none"
      className="overflow-hidden"
    >
      <div className="px-5 pb-3 pt-4">
        <PanelHeader
          title="Quem foi convidado"
          hint="Nome e e-mail corporativo, e mais nada. O link não carrega dado pessoal."
          meta={`${progress.answered} de ${progress.total} responderam. A empresa vê a média, nunca quem respondeu o quê.`}
          actions={
            <Button
              size="sm"
              variant={formOpen ? 'ghost' : 'outline'}
              aria-expanded={formOpen}
              aria-controls="formulario-convite"
              onClick={() => onFormOpenChange(!formOpen)}
            >
              {formOpen ? 'Fechar' : 'Convidar colaboradores'}
            </Button>
          }
        />
      </div>

      {formOpen ? (
        <div
          id="formulario-convite"
          className="border-t border-border bg-muted/30 px-5 py-4"
        >
          <p className="iel-prose text-xs leading-relaxed text-muted-foreground">
            Para{' '}
            {plural(
              Math.max(Number.parseInt(headcount, 10) || 0, 0),
              'pessoa',
              'pessoas'
            )}
            , sugerimos {sugerido}{' '}
            {sugerido === 1 ? 'respondente' : 'respondentes'}: quem trabalha na
            área da vaga e em áreas próximas.
            <InfoHint
              className="ml-1"
              label={`Cerca de 20% do quadro da área, entre 3 e 10 pessoas. Abaixo de 3 respostas da equipe o perfil não fecha; acima de 10 a consulta pesa demais para o prazo de ${CULTURE_INVITE_DEADLINE_DAYS} dias.`}
            />
          </p>

          <div className="mt-3 max-w-[16rem]">
            <Input
              label="Quantas pessoas trabalham na área"
              inputMode="numeric"
              value={headcount}
              onChange={(event) => setHeadcount(event.target.value)}
            />
          </div>

          <ul className="mt-4 space-y-3">
            {linhas.map((linha, index) => (
              <li
                key={index}
                className="grid gap-2 rounded-[var(--control-radius)] border border-border bg-card p-3 sm:grid-cols-2"
              >
                <Input
                  label="Nome"
                  value={linha.name}
                  onChange={(event) =>
                    atualizar(index, { name: event.target.value })
                  }
                />
                <Input
                  label="E-mail corporativo"
                  type="email"
                  value={linha.corporateEmail}
                  onChange={(event) =>
                    atualizar(index, { corporateEmail: event.target.value })
                  }
                />
                <Input
                  label="Área"
                  value={linha.area}
                  onChange={(event) =>
                    atualizar(index, { area: event.target.value })
                  }
                />
                <div className="space-y-2">
                  <label
                    className="block text-sm font-medium leading-none text-foreground"
                    htmlFor={`papel-${index}`}
                  >
                    Papel
                  </label>
                  <FilterNativeSelect
                    id={`papel-${index}`}
                    value={linha.role}
                    onValueChange={(value) =>
                      atualizar(index, { role: value as CultureInviteRole })
                    }
                  >
                    {(Object.keys(ROLE_LABEL) as CultureInviteRole[]).map(
                      (role) => (
                        <option
                          key={role}
                          value={role}
                        >
                          {ROLE_LABEL[role]}
                        </option>
                      )
                    )}
                  </FilterNativeSelect>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setLinhas((atual) => [
                  ...atual,
                  emptyRow(atual[atual.length - 1]?.area ?? '')
                ])
              }
            >
              Mais uma pessoa
            </Button>
            <Button
              size="sm"
              disabled={preenchidas.length === 0}
              onClick={enviar}
            >
              Enviar convites ({preenchidas.length})
            </Button>
          </div>
        </div>
      ) : null}

      {invites.length === 0 ? (
        <p className="iel-prose border-t border-border px-5 py-5 text-sm text-muted-foreground">
          Ninguém foi convidado ainda. Sem amostra, o perfil da empresa não se
          forma.
        </p>
      ) : (
        <>
          <ul className="border-t border-border px-4">
            {visiveis.map((invite) => (
              <InviteRow
                key={invite.id}
                invite={invite}
              />
            ))}
          </ul>
          {invites.length > ITENS_VISIVEIS ? (
            <div className="border-t border-border px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVerTodos((atual) => !atual)}
              >
                {verTodos
                  ? 'Ver menos'
                  : `Ver todos (${plural(invites.length, 'pessoa', 'pessoas', { includeCount: false })} — ${invites.length})`}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">
        <Chip>Link sem login</Chip>
        <Chip>Vale {CULTURE_INVITE_DEADLINE_DAYS} dias</Chip>
        <Chip>Uma resposta por pessoa</Chip>
      </div>
    </Panel>
  );
}
