import { AnimatedMetricValue } from '@/components/home/animated-metric-value';
import type { DashboardStats } from '@/features/home/types';
import type { Permissions } from '@/features/members/permissions';
import {
  PartyIcon,
  Ticket01Icon,
  UserMultipleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { MetricCard } from '@workspace/ui';

export type HomeMetricasProps = {
  stats: DashboardStats;
  permissions: Permissions;
};

export function HomeMetricas({ stats, permissions }: HomeMetricasProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total de eventos"
        value={
          <AnimatedMetricValue
            value={stats.activeEvents}
            suffix=" ativos"
            animateFromZeroOnMount
          />
        }
        icon={
          <HugeiconsIcon
            icon={PartyIcon}
            size={24}
            className="text-primary"
          />
        }
      />
      <MetricCard
        title="Inscritos (no mês)"
        value={
          <AnimatedMetricValue
            value={stats.totalRegistrations}
            animateFromZeroOnMount
          />
        }
        icon={
          <HugeiconsIcon
            icon={UserMultipleIcon}
            size={24}
            className="text-primary"
          />
        }
      />
      {permissions.viewRevenue && (
        <MetricCard
          title="Receita (no mês)"
          value={
            <AnimatedMetricValue
              value={stats.totalRevenue / 100}
              format={{ style: 'currency', currency: 'BRL' }}
              animateFromZeroOnMount
            />
          }
          icon={
            <HugeiconsIcon
              icon={Ticket01Icon}
              size={24}
              className="text-primary"
            />
          }
        />
      )}
      <MetricCard
        title="Taxa de check-in"
        value={
          <AnimatedMetricValue
            value={stats.checkinRate}
            suffix="%"
            animateFromZeroOnMount
          />
        }
        icon={
          <HugeiconsIcon
            icon={UserMultipleIcon}
            size={24}
            className="text-primary"
          />
        }
      />
    </div>
  );
}
