'use client';

import type React from 'react';
import { SIGN_OUT_CALLBACK_URL } from '@/features/auth/constants';
import { signOut } from 'next-auth/react';

import { Button, toast } from '@workspace/ui';

export function SignOutButton(
  props: React.ComponentPropsWithoutRef<typeof Button>
): React.ReactElement {
  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut({
        callbackUrl: SIGN_OUT_CALLBACK_URL,
        redirect: true
      });
    } catch {
      toast.error('Não foi possível sair.');
    }
  };

  return (
    <Button
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        handleSignOut();
      }}
    />
  );
}
