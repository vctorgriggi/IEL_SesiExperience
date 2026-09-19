import type { UpcomingEventItem } from '@/features/events/types';
import type { DashboardStats } from '@/features/home/types';

export function hasNoMetricsYet(
  stats: DashboardStats,
  upcomingEvents: UpcomingEventItem[]
): boolean {
  return (
    stats.totalEvents === 0 &&
    stats.totalRegistrations === 0 &&
    upcomingEvents.length === 0
  );
}

export const PERIOD_LABELS: Record<string, string> = {
  '1d': 'Último dia',
  '7d': 'Últimos 7 dias',
  '15d': 'Últimos 15 dias',
  '30d': 'Últimos 30 dias'
};
