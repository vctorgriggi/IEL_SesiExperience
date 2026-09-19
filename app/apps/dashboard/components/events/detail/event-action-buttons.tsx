'use client';

import Link from 'next/link';
import {
  getEventAttendeesPath,
  getEventCheckinPath,
  getEventTicketsPath
} from '@/features/events/routing/event-navigation';
import { useCurrentOrganizationSlug } from '@/hooks/use-current-organization-slug';
import {
  Ticket01Icon,
  UserCheck01Icon,
  UserMultipleIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type EventActionButtonsProps = {
  eventId: string;
};

const actions = [
  {
    key: 'checkin',
    href: (id: string) => `/checkin/${id}`,
    label: 'Check-in',
    icon: UserCheck01Icon
  },
  {
    key: 'tickets',
    href: (id: string) => `/events/${id}/tickets`,
    label: 'Tipos de ingresso',
    icon: Ticket01Icon
  },
  {
    key: 'attendees',
    href: (id: string) => `/events/${id}/attendees`,
    label: 'Participantes',
    icon: UserMultipleIcon
  }
] as const;

function getActionHref(
  key: (typeof actions)[number]['key'],
  eventId: string,
  orgSlug: string | null
): string {
  switch (key) {
    case 'checkin':
      return getEventCheckinPath(eventId, orgSlug);
    case 'tickets':
      return getEventTicketsPath(eventId, orgSlug);
    case 'attendees':
      return getEventAttendeesPath(eventId, orgSlug);
  }
}

export function EventActionButtons({ eventId }: EventActionButtonsProps) {
  const currentOrgSlug = useCurrentOrganizationSlug();

  return (
    <div className="flex flex-wrap justify-end gap-2">
      {actions.map(({ key, label, icon }) => (
        <Link
          key={label}
          href={getActionHref(key, eventId, currentOrgSlug)}
        >
          <HugeiconsIcon
            icon={icon}
            size={16}
          />
          {label}
        </Link>
      ))}
    </div>
  );
}
