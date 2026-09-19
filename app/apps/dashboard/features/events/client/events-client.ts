import {
  apiDelete,
  apiFetch,
  apiGet,
  apiPatch,
  apiPost,
  apiPut
} from '@/lib/api-client';

import { api } from '@workspace/routes';

type OrgOptions = { organizationSlug?: string };

function assertDefined<T>(value: T | null | undefined, context: string): T {
  if (value == null)
    throw new Error(`Unexpected empty response from API: ${context}`);
  return value;
}

function buildParams(
  record: Record<string, string | number | null | undefined>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (value != null) params.set(key, String(value));
  }
  return params.toString();
}

export async function exportEventRegistrationsCsv(
  eventId: string,
  options?: OrgOptions
): Promise<Blob> {
  const res = await apiFetch(api.events.registrationsExport(eventId), {
    method: 'GET',
    ...(options?.organizationSlug && {
      organizationSlug: options.organizationSlug
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(
      (err as { message?: string })?.message ?? 'Erro ao exportar CSV'
    );
  }
  return res.blob();
}

export type ParticipantListItem = {
  id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string | null;
  status: string;
  checkedInAt: string | null;
  createdAt: string;
};

export async function listParticipants(
  query: { eventId: string; status?: string; limit?: number; offset?: number },
  options?: OrgOptions
): Promise<{ items: ParticipantListItem[]; total: number }> {
  const data = await apiGet<{ items: ParticipantListItem[]; total: number }>(
    api.participants.list(buildParams(query)),
    options
  );
  return data ?? { items: [], total: 0 };
}

export async function cancelRegistrationById(
  registrationId: string,
  options?: OrgOptions
): Promise<void> {
  await apiPut(api.registrations.cancel(registrationId), undefined, options);
}

export async function resendRegistrationEmail(
  registrationId: string,
  options?: OrgOptions
): Promise<void> {
  await apiPost(
    api.registrations.resendEmail(registrationId),
    undefined,
    options
  );
}

export type UpdateTicketTypeData = Partial<{
  name: string;
  priceCents: number;
  quantityAvailable: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  isVisible: boolean;
}>;

export async function updateTicketType(
  ticketId: string,
  data: UpdateTicketTypeData,
  options?: OrgOptions
): Promise<void> {
  await apiPut(api.tickets.byId(ticketId), data, options);
}

export async function deleteTicketType(
  ticketId: string,
  options?: OrgOptions
): Promise<void> {
  await apiDelete(api.tickets.byId(ticketId), options);
}

export async function checkInRegistration(
  registrationId: string,
  options?: OrgOptions
): Promise<{ checkedInAt: string }> {
  const res = assertDefined(
    await apiPatch<{ success: boolean; checkedInAt: string }>(
      api.registrations.checkIn(registrationId),
      undefined,
      options
    ),
    'checkInRegistration'
  );
  return { checkedInAt: res.checkedInAt };
}

export type ValidateCheckInByCodeResult = {
  valid: true;
  eventTitle: string;
  name: string | null;
  eventId: string;
  alreadyCheckedIn: boolean;
};

export async function validateCheckInByCode(
  code: string,
  options?: OrgOptions
): Promise<ValidateCheckInByCodeResult> {
  return assertDefined(
    await apiGet<ValidateCheckInByCodeResult>(
      api.registrations.checkInByCodeValidate(code),
      options
    ),
    'validateCheckInByCode'
  );
}

export async function confirmCheckInByCode(
  code: string,
  options?: OrgOptions
): Promise<{ success: boolean; checkedInAt: string }> {
  return assertDefined(
    await apiPost<{ success: boolean; checkedInAt: string }>(
      api.registrations.checkInByCodeConfirm(code),
      undefined,
      options
    ),
    'confirmCheckInByCode'
  );
}

export type CreateRegistrationInput = {
  ticketId: string;
  attendee: { name: string; email: string };
};
export type CreateRegistrationResult = {
  registrationId: string;
  checkoutUrl?: string;
};

export async function createRegistration(
  input: CreateRegistrationInput
): Promise<CreateRegistrationResult> {
  return assertDefined(
    await apiPost<CreateRegistrationResult>(api.registrations.create(), input),
    'createRegistration'
  );
}
