'use client';

import { Shield01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@workspace/ui';

export type MfaIdleDisabledStepProps = {
  onStartEnable: () => void;
  loading?: boolean;
};

export function MfaIdleDisabledStep({
  onStartEnable,
  loading = false
}: MfaIdleDisabledStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">2FA não ativado</h3>
        <p className="text-sm text-muted-foreground">
          Adicione uma camada extra de segurança à sua conta.
        </p>
      </div>
      <div className="pt-2">
        <Button
          size="small"
          onClick={onStartEnable}
          className="min-w-[160px]"
          loading={loading}
        >
          <HugeiconsIcon
            icon={Shield01Icon}
            size={16}
            className="mr-2"
          />
          Ativar autenticador
        </Button>
      </div>
    </div>
  );
}
