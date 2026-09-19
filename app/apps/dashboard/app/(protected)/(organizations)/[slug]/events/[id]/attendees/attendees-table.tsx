'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  cancelEventRegistration,
  checkInEventRegistration,
  resendEventRegistrationEmail
} from '@/features/events/actions';
import { type ParticipantListItem } from '@/features/events/client/events-client';
import { getErrorMessage } from '@/lib/get-error-message';
import { runSafeAction } from '@/lib/run-safe-action';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Mail01Icon,
  UserCheck01Icon,
  UserMultipleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';

import {
  Button,
  Dialog,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast
} from '@workspace/ui';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'pending', label: 'Pendente' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'checked-in', label: 'Check-in feito' }
];

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  waitlist: 'Lista de espera',
  'checked-in': 'Check-in feito'
};

const statusBadgeClasses: Record<string, string> = {
  pending: 'badge badge-secondary',
  confirmed: 'badge badge-primary',
  cancelled: 'badge badge-error',
  waitlist: 'badge badge-outline',
  'checked-in': 'badge badge-success'
};

type AttendeesTableProps = {
  eventId: string;
  orgSlug: string;
  data: { items: ParticipantListItem[]; total: number };
  page: number;
  statusFilter: string;
  totalPages: number;
  pageSize: number;
};

const columnHelper = createColumnHelper<ParticipantListItem>();

export function AttendeesTable({
  eventId: _eventId,
  orgSlug: _orgSlug,
  data,
  page,
  statusFilter,
  totalPages,
  pageSize
}: AttendeesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const items = data.items;
  const total = data.total;
  const [cancelTarget, setCancelTarget] = useState<ParticipantListItem | null>(
    null
  );
  const [isCancelling, setIsCancelling] = useState(false);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleResendEmail = useCallback(
    async (reg: ParticipantListItem) => {
      try {
        const result = await runSafeAction<{ recipient: string }>(
          resendEventRegistrationEmail({ registrationId: reg.id })
        );
        toast.success(
          `E-mail reenviado para ${result?.recipient ?? reg.email ?? reg.name}`
        );
        refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Erro ao reenviar e-mail'));
      }
    },
    [refresh]
  );

  const handleCancel = useCallback((reg: ParticipantListItem) => {
    setCancelTarget(reg);
  }, []);

  const confirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      setIsCancelling(true);
      try {
        await runSafeAction(
          cancelEventRegistration({ registrationId: cancelTarget.id })
        );
        toast.success('Inscrição cancelada');
        setCancelTarget(null);
        refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Erro ao cancelar'));
      }
    } finally {
      setIsCancelling(false);
    }
  }, [cancelTarget, refresh]);

  const handleCheckIn = useCallback(
    async (reg: ParticipantListItem) => {
      try {
        const result = await runSafeAction<{ checkedInAt: string }>(
          checkInEventRegistration({ registrationId: reg.id })
        );
        const time = result?.checkedInAt
          ? new Date(result.checkedInAt).toLocaleString('pt-BR')
          : null;
        toast.success(`${reg.name} fez check-in${time ? ` • ${time}` : ''}`);
        refresh();
      } catch (err) {
        toast.error(getErrorMessage(err, 'Erro ao marcar check-in'));
      }
    },
    [refresh]
  );

  const setFilterAndPage = useCallback(
    (newStatus: string, newPage: number) => {
      const params = new URLSearchParams();
      if (newStatus !== 'all') params.set('status', newStatus);
      if (newPage > 0) params.set('page', String(newPage));
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname]
  );

  const columns = [
    columnHelper.accessor('name', {
      header: 'Nome',
      cell: (info) => (
        <span className="font-medium">{info.getValue() || '—'}</span>
      )
    }),
    columnHelper.accessor('email', {
      header: 'E-mail',
      cell: (info) => info.getValue() ?? '—'
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={statusBadgeClasses[status] ?? 'badge badge-secondary'}
          >
            {statusLabels[status] ?? status}
          </span>
        );
      }
    }),
    columnHelper.accessor('createdAt', {
      header: 'Data',
      cell: (info) => {
        const val = info.getValue();
        return val ? new Date(val).toLocaleDateString('pt-BR') : '—';
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const reg = row.original;
        if (reg.status === 'cancelled') return null;
        return (
          <div className="flex gap-1">
            <Button
              type="button"
              outlined
              title="Reenviar e-mail"
              aria-label="Reenviar e-mail de confirmação"
              onClick={() => handleResendEmail(reg)}
            >
              <HugeiconsIcon
                icon={Mail01Icon}
                size={16}
              />
            </Button>
            {reg.status !== 'checked-in' && (
              <Button
                type="button"
                outlined
                title="Check-in"
                aria-label="Fazer check-in do participante"
                onClick={() => handleCheckIn(reg)}
              >
                <HugeiconsIcon
                  icon={UserCheck01Icon}
                  size={16}
                />
              </Button>
            )}
            <Button
              type="button"
              outlined
              title="Cancelar inscrição"
              aria-label="Cancelar inscrição do participante"
              onClick={() => handleCancel(reg)}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={16}
              />
            </Button>
          </div>
        );
      },
      meta: { className: 'w-[var(--width-button-action)]' }
    })
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const selectOptions = STATUS_OPTIONS.map((o) => ({
    label: o.label,
    value: o.value
  }));

  const effectiveTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(1, page + 1), effectiveTotalPages);

  const start = items.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end =
    items.length === 0 ? 0 : Math.min(start + items.length - 1, total);

  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < effectiveTotalPages ? currentPage + 1 : null;

  const pageNumbers: (number | 'ellipsis')[] = [];
  if (effectiveTotalPages <= 6) {
    for (let i = 1; i <= effectiveTotalPages; i++) pageNumbers.push(i);
  } else {
    pageNumbers.push(1);
    const lo = Math.max(2, currentPage - 1);
    const hi = Math.min(effectiveTotalPages - 1, currentPage + 1);
    if (lo > 2) pageNumbers.push('ellipsis');
    for (let i = lo; i <= hi; i++) pageNumbers.push(i);
    if (hi < effectiveTotalPages - 1) pageNumbers.push('ellipsis');
    pageNumbers.push(effectiveTotalPages);
  }

  const linkClass =
    'inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 aria-disabled:pointer-events-none aria-disabled:opacity-50';
  const activeClass =
    'border-primary/50 bg-primary/10 text-primary hover:bg-primary/15';

  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber <= 1) params.delete('page');
    else params.set('page', String(pageNumber - 1));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={statusFilter}
          onChange={(v) => setFilterAndPage(v, 0)}
          options={selectOptions}
          placeholder="Status"
          className="w-[var(--width-select-filter)]"
        />
        <span className="text-sm text-muted-foreground">
          {total} inscriç{total === 1 ? 'ão' : 'ões'}
        </span>
      </div>

      <div className="rounded-lg border">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <HugeiconsIcon
              icon={UserMultipleIcon}
              size={48}
              className="mb-2 opacity-50"
            />
            <p>Nenhum participante encontrado</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={
                          (
                            header.column.columnDef.meta as {
                              className?: string;
                            }
                          )?.className
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          (cell.column.columnDef.meta as { className?: string })
                            ?.className
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Mostrando{' '}
            <span className="font-medium text-foreground">{start}</span>–
            <span className="font-medium text-foreground">{end}</span> de{' '}
            <span className="font-medium text-foreground">{total}</span> inscriç
            {total === 1 ? 'ão' : 'ões'}
          </p>
          <nav
            className="flex items-center gap-1"
            aria-label="Paginação da lista de participantes"
          >
            {prevPage ? (
              <Link
                href={buildPageUrl(prevPage)}
                className={linkClass}
                aria-label="Página anterior"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={18}
                />
              </Link>
            ) : (
              <span
                className={linkClass + ' opacity-50'}
                aria-disabled
                aria-label="Página anterior"
              >
                <HugeiconsIcon
                  icon={ArrowLeft01Icon}
                  size={18}
                />
              </span>
            )}
            <div className="flex items-center gap-1">
              {pageNumbers.map((n, i) =>
                n === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={n}
                    href={buildPageUrl(n)}
                    className={
                      linkClass + (n === currentPage ? ' ' + activeClass : '')
                    }
                    aria-label={`Página ${n}`}
                    aria-current={n === currentPage ? 'page' : undefined}
                  >
                    {n}
                  </Link>
                )
              )}
            </div>
            {nextPage ? (
              <Link
                href={buildPageUrl(nextPage)}
                className={linkClass}
                aria-label="Próxima página"
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                />
              </Link>
            ) : (
              <span
                className={linkClass + ' opacity-50'}
                aria-disabled
                aria-label="Próxima página"
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                />
              </span>
            )}
          </nav>
        </div>
      )}

      <Dialog
        visible={!!cancelTarget}
        onHide={() => {
          if (isCancelling) return;
          setCancelTarget(null);
        }}
        header="Cancelar inscrição"
        style={{ width: '28rem', maxWidth: '90vw' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              outlined
              severity="secondary"
              onClick={() => setCancelTarget(null)}
              disabled={isCancelling}
            >
              Voltar
            </Button>
            <Button
              severity="danger"
              onClick={confirmCancel}
              loading={isCancelling}
            >
              Cancelar inscrição
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja cancelar a inscrição de{' '}
          <span className="font-medium text-foreground">
            {cancelTarget?.name ?? '—'}
          </span>
          ? Esta ação não pode ser desfeita.
        </p>
      </Dialog>
    </div>
  );
}
