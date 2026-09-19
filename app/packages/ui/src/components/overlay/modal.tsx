'use client';

import type { ReactNode } from 'react';

import { Dialog } from './dialog';

export type { DialogProps } from './dialog';

export function ModalProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const Modal = Dialog;

export { Dialog };
