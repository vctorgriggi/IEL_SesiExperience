'use client';

import { useState } from 'react';
import { Delete02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, toast } from '@workspace/ui';

export function DeleteOrganizationSection() {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => setShowConfirm(true);
  const handleCancel = () => setShowConfirm(false);
  const handleConfirm = () => {
    toast.error('Funcionalidade em breve.');
    setShowConfirm(false);
  };

  return (
    <section className="border-t border-border/80 pt-8">
      <div className="rounded-xl border-2 border-red-500 bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Excluir organização
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Excluir permanentemente a organização e todos os dados.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteClick}
            className="shrink-0"
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={18}
            />
            Excluir
          </Button>
        </div>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal
          aria-labelledby="confirm-delete-title"
          onClick={handleCancel}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl border-2 border-red-500 bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="confirm-delete-title"
              className="text-lg font-semibold text-foreground"
            >
              Excluir organização?
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. Todos os dados da organização
              serão removidos permanentemente.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                severity="secondary"
                outlined
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                severity="danger"
                onClick={handleConfirm}
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
