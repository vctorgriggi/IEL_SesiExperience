export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type EventDto = {
  id: string;
  slug?: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  imageUrl?: string | null;
  ticketType?: 'free' | 'paid';
  ticketPriceCents?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  maxAttendees: number | null;
  isPublic: boolean;
  status: EventStatus;
  organizationId?: string;
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { name?: string };
};

export type EventRegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'waitlist'
  | 'checked-in';

export type ParticipantListItemDto = {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string | null;
  status: EventRegistrationStatus;
  checkedInAt: string | null;
  createdAt: string;
};

export type EventRegistrationDto = {
  id: string;
  eventId: string;
  userId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  status: EventRegistrationStatus;
  registrationData?: unknown;
  createdAt?: string;
  updatedAt?: string;
  event?: EventDto;
  user?: { name?: string; email?: string };
};

export type EventWithRegistrationsDto = EventDto & {
  registrations?: EventRegistrationDto[];
};

export type UpcomingEventItem = {
  id: string;
  name: string;
  date: string;
  registrations: number;
  capacity: number | null;
  revenue: number;
  status: EventStatus;
};
