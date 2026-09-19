'use client';

import { toast as globalToast } from '../lib/toast';
import { useMounted } from './use-mounted';

export type UseToastOptions = {
  duration?: number;
  dismissible?: boolean;
  position?: { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom' };
  ripple?: boolean;
};

export function useToast(_options?: UseToastOptions): {
  success: (message: string) => void;
  error: (message: string) => void;
  dismissAll: () => void;
} {
  const mounted = useMounted();
  return {
    success: (message: string) => {
      if (mounted) globalToast.success(message);
    },
    error: (message: string) => {
      if (mounted) globalToast.error(message);
    },
    dismissAll: () => {
      if (mounted) globalToast.dismissAll();
    }
  };
}
