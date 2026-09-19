'use client';

import { useState } from 'react';
import { exportEventRegistrationsCsv } from '@/features/events/actions';
import { getErrorMessage } from '@/lib/get-error-message';
import { runSafeAction } from '@/lib/run-safe-action';
import { Download01Icon, Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button, toast } from '@workspace/ui';

type EventAttendeesExportButtonProps = {
  eventId: string;
  eventTitle?: string;
};

export function EventAttendeesExportButton({
  eventId,
  eventTitle: _eventTitle
}: EventAttendeesExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await runSafeAction<{ csv: string; filename: string }>(
        exportEventRegistrationsCsv({ eventId })
      );
      const csv = result?.csv;
      const filename = result?.filename;
      if (!csv) {
        toast.error('Não foi possível gerar o CSV. Tente novamente.');
        return;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `inscricoes-${eventId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(filename ? `CSV exportado: ${filename}` : 'CSV exportado');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Erro ao exportar CSV'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <HugeiconsIcon
          icon={Loading03Icon}
          size={16}
          className="animate-spin mr-2"
        />
      ) : (
        <HugeiconsIcon
          icon={Download01Icon}
          size={16}
          className="mr-2"
        />
      )}
      Exportar CSV
    </Button>
  );
}
