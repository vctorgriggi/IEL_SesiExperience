'use client';

import { useEffect } from 'react';

import { initAnalytics, usePageView } from '@workspace/analytics';

export function AnalyticsInit(): null {
  useEffect(() => {
    initAnalytics();
  }, []);

  usePageView();

  return null;
}
