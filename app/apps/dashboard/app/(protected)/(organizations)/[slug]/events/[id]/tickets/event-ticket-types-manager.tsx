'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTicketType, deleteTicketType } from '@/features/events/actions';
import { getErrorMessage } from '@/lib/get-error-message';
import { runSafeAction } from '@/lib/run-safe-action';
import { Delete02Icon, Ticket01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast
} from '@workspace/ui';

import { AddTicketTypeForm } from './add-ticket-type-form';

type TicketTypeRow = {
  id: string;
  eventId: string;
  name: string;
  priceCents: number;
  quantityAvailable: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

type EventTicketTypesManagerProps = {
  eventId: string;
  initialTicketTypes: TicketTypeRow[];
};

const columnHelper = createColumnHelper<TicketTypeRow>();

export function EventTicketTypesManager({
  eventId,
  initialTicketTypes
}: EventTicketTypesManagerProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const createMutation = {
    mutateAsync: async (data: {
      name: string;
      priceCents: number;
      quantityAvailable?: number | null;
      isVisible: boolean;
    }) => {
      try {
        setIsCreating(true);
        await runSafeAction<{ id: string; name: string; priceCents: number }>(
          createTicketType({
            eventId,
            name: data.name,
            priceCents: data.priceCents,
            quantityAvailable: data.quantityAvailable ?? null,
            isVisible: data.isVisible
          })
        );
        router.refresh();
        setShowAdd(false);
        toast.success('Tipo de ingresso criado');
      } catch (err) {
        toast.error(getErrorMessage(err, 'Erro ao criar'));
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    isPending: isCreating
  };

  async function handleDelete(ticketTypeId: string) {
    try {
      setIsDeleting(true);
      await runSafeAction<{ id: string }>(
        deleteTicketType({
          eventId,
          ticketTypeId
        })
      );
      router.refresh();
      toast.success('Tipo removido');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao remover'));
    } finally {
      setIsDeleting(false);
    }
  }

  const ticketTypes = initialTicketTypes;

  const columns = [
    columnHelper.accessor('name', {
      header: 'Nome',
      cell: (info) => <span className="font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('priceCents', {
      header: 'Preço (R$)',
      cell: (info) => (info.getValue() / 100).toLocaleString('pt-BR')
    }),
    columnHelper.accessor('quantityAvailable', {
      header: 'Quantidade',
      cell: (info) => info.getValue() ?? '—'
    }),
    columnHelper.accessor('isVisible', {
      header: 'Visível',
      cell: (info) => (info.getValue() ? 'Sim' : 'Não')
    }),
    columnHelper.display({
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <Button
          type="button"
          title="Remover"
          disabled={isDeleting}
          onClick={() => {
            if (confirm('Remover este tipo de ingresso?')) {
              void handleDelete(row.original.id);
            }
          }}
        >
          <HugeiconsIcon
            icon={Delete02Icon}
            size={16}
          />
        </Button>
      ),
      meta: { className: 'w-[80px]' }
    })
  ];

  const table = useReactTable({
    data: ticketTypes,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!showAdd ? (
          <Button
            type="button"
            onClick={() => setShowAdd(true)}
          >
            Adicionar tipo de ingresso
          </Button>
        ) : (
          <AddTicketTypeForm
            onCancel={() => setShowAdd(false)}
            onSubmit={(data) =>
              createMutation.mutateAsync({
                name: data.name,
                priceCents: data.priceCents,
                quantityAvailable: data.quantityAvailable ?? null,
                isVisible: data.isVisible
              })
            }
            isSubmitting={createMutation.isPending}
          />
        )}
      </div>
      <div className="rounded-lg border">
        {ticketTypes.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <HugeiconsIcon
              icon={Ticket01Icon}
              size={48}
              className="mb-2 opacity-50"
            />
            <p>Nenhum tipo de ingresso. Adicione um para vender ingressos.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={
                        (header.column.columnDef.meta as { className?: string })
                          ?.className
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
        )}
      </div>
    </div>
  );
}
