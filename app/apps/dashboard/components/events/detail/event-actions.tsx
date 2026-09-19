'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteEvent } from '@/features/events/actions';
import {
  getEditEventPath,
  getEventsIndexPath
} from '@/features/events/routing/event-navigation';
import type { EventDto } from '@/features/events/types';
import { useCurrentOrganizationSlug } from '@/hooks/use-current-organization-slug';
import { getErrorMessage } from '@/lib/get-error-message';
import { runSafeAction } from '@/lib/run-safe-action';
import { Delete01Icon, Edit01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, toast } from '@workspace/ui';

type EventActionsProps = {
  event: EventDto;
};

export function EventActions({ event }: EventActionsProps) {
  const router = useRouter();
  const currentOrgSlug = useCurrentOrganizationSlug();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await runSafeAction(deleteEvent({ id: event.id }));
      toast.success('Evento excluído com sucesso!');
      setShowDeleteDialog(false);
      router.refresh();
      router.push(getEventsIndexPath(currentOrgSlug));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao excluir evento'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          outlined
          className="rounded-lg border-border bg-card text-foreground hover:bg-muted/50"
          onClick={() =>
            router.push(getEditEventPath(event.id, currentOrgSlug))
          }
          aria-label="Editar evento"
        >
          <HugeiconsIcon
            icon={Edit01Icon}
            size={16}
            className="mr-2"
          />
          Editar
        </Button>
        <Button
          severity="danger"
          className="size-9 shrink-0 rounded-lg border-destructive/60 bg-card text-destructive hover:bg-destructive/5"
          onClick={() => setShowDeleteDialog(true)}
          aria-label="Excluir evento"
        >
          <HugeiconsIcon
            icon={Delete01Icon}
            size={18}
          />
        </Button>
      </div>

      {showDeleteDialog && (
        <div
          className="overlay modal overlay-open:opacity-100 fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-md rounded-xl border border-border/80 bg-card p-6 shadow-sm max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Excluir Evento</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza que deseja excluir o evento &quot;{event.title}&quot;?
              Esta ação não pode ser desfeita. Todas as inscrições relacionadas
              também serão removidas.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                outlined
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                severity="danger"
                onClick={handleDelete}
                loading={isDeleting}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
