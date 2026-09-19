'use client';

import { useState } from 'react';
import { acceptInvitationAction } from '@/features/invitations/actions';

import { Button } from '@workspace/ui';

type Props = { token: string };

export function AcceptInvitationButton({ token }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleAccept() {
    setLoading(true);
    try {
      await acceptInvitationAction({ token });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleAccept}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Aceitando...' : 'Aceitar convite'}
    </Button>
  );
}
