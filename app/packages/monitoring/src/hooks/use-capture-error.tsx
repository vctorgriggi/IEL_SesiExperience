'use client';

import { useEffect } from 'react';

import { useMonitoring } from './use-monitoring';

export function useCaptureError(error: unknown): void {
  const provider = useMonitoring();

  useEffect(() => {
    void provider.captureError(error);
  }, [error, provider]);
}
