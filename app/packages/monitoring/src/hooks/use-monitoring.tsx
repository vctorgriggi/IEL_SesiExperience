'use client';

import { createContext, useContext, useMemo } from 'react';
import type { JSX, PropsWithChildren } from 'react';

import { MonitoringProvider as MonitoringProviderImpl } from '../provider';
import type { MonitoringProvider as MonitoringProviderInterface } from '../provider/types';

export const MonitoringContext = createContext<MonitoringProviderInterface>(
  MonitoringProviderImpl
);

export function MonitoringProvider(props: PropsWithChildren): JSX.Element {
  const providerValue = useMemo(() => MonitoringProviderImpl, []);
  return (
    <MonitoringContext.Provider value={providerValue}>
      {props.children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring(): MonitoringProviderInterface {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}
