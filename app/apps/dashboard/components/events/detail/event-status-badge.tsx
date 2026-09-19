import type { EventStatus } from '@/features/events/types';

import { cn } from '@workspace/ui';

const statusConfig: Record<EventStatus, { label: string; className: string }> =
  {
    draft: {
      label: 'Rascunho',
      className:
        'rounded-lg bg-muted/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
    },
    published: {
      label: 'Publicado',
      className:
        'rounded-lg bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success'
    },
    cancelled: {
      label: 'Cancelado',
      className:
        'rounded-lg bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive'
    },
    completed: {
      label: 'Concluído',
      className:
        'rounded-lg bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'
    }
  };

type EventStatusBadgeProps = {
  status: EventStatus;
  className?: string;
};

export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={cn(config.className, className)}>{config.label}</span>
  );
}
