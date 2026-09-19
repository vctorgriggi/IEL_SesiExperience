'use client';

import { useState } from 'react';
import { ChoosePlanCard } from '@/components/choose-plan/choose-plan-card';
import type { PlanDisplayFromServer } from '@/features/billing/plans-config';

import type { PlanId } from '@workspace/billing';
import { Button, Dialog } from '@workspace/ui';

type ChangePlanDialogProps = {
  slug: string;
  organizationName: string;
  currentPlan: PlanId;
  plans: PlanDisplayFromServer[];
};

export function ChangePlanDialog({
  slug,
  organizationName,
  currentPlan,
  plans
}: ChangePlanDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        outlined
        severity="secondary"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Alterar plano
      </Button>

      <Dialog
        visible={open}
        onHide={() => setOpen(false)}
        header="Escolher plano"
        style={{ width: '90%', maxWidth: '1100px' }}
      >
        <ChoosePlanCard
          slug={slug}
          organizationName={organizationName}
          currentPlan={currentPlan}
          plans={plans}
        />
      </Dialog>
    </>
  );
}
