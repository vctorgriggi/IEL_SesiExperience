'use client';

import { MfaDisableStep } from './mfa-disable-step';
import { MfaIdleDisabledStep } from './mfa-idle-disabled-step';
import { MfaRecoveryStep } from './mfa-recovery-step';
import { MfaSetupStep } from './mfa-setup-step';
import { useMfa } from './use-mfa';

type MfaSectionProps = {
  userId: string;
  initialHasTotp: boolean;
};

export function MfaSection({
  userId: _userId,
  initialHasTotp
}: MfaSectionProps) {
  const {
    state,
    startEnable,
    submitEnable,
    submitDisable,
    finishRecovery,
    cancelSetup,
    isExecuting
  } = useMfa(initialHasTotp);

  if (state.step === 'recovery' && state.recoveryCodes) {
    return (
      <MfaRecoveryStep
        recoveryCodes={state.recoveryCodes}
        onFinish={finishRecovery}
      />
    );
  }

  if (state.step === 'setup' && state.setupData && state.qrDataUrl) {
    return (
      <MfaSetupStep
        qrDataUrl={state.qrDataUrl}
        error={state.error}
        onSubmit={async ({ totpCode }) => {
          submitEnable(totpCode);
        }}
        onCancel={cancelSetup}
        loading={isExecuting}
      />
    );
  }

  if (state.isEnabled && state.step === 'idle') {
    return (
      <MfaDisableStep
        error={state.error}
        onSubmit={async ({ totpCode }) => {
          submitDisable(totpCode);
        }}
        loading={isExecuting}
      />
    );
  }

  return (
    <MfaIdleDisabledStep
      onStartEnable={startEnable}
      loading={isExecuting}
    />
  );
}
