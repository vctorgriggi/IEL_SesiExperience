import {
  apiDelete,
  apiFetch,
  apiGet,
  apiPatch,
  apiPost,
  apiPut
} from '@/lib/api-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cancelRegistrationById,
  checkInRegistration,
  confirmCheckInByCode,
  createRegistration,
  deleteTicketType,
  exportEventRegistrationsCsv,
  listParticipants,
  resendRegistrationEmail,
  updateTicketType,
  validateCheckInByCode
} from './events-client';

vi.mock('@/lib/api-client', () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiFetch: vi.fn()
}));

const mockedApiFetch = vi.mocked(apiFetch);
const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);
const mockedApiPatch = vi.mocked(apiPatch);
const mockedApiPut = vi.mocked(apiPut);
const mockedApiDelete = vi.mocked(apiDelete);

describe('events service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportEventRegistrationsCsv', () => {
    it('calls apiFetch with export route and returns blob', async () => {
      const blob = new Blob(['csv-content'], { type: 'text/csv' });
      const response = {
        ok: true,
        blob: vi.fn().mockResolvedValue(blob)
      };

      mockedApiFetch.mockResolvedValue(response as never);

      const result = await exportEventRegistrationsCsv('event-uuid', {
        organizationSlug: 'acme'
      });

      expect(mockedApiFetch).toHaveBeenCalledTimes(1);
      expect(mockedApiFetch).toHaveBeenCalledWith(
        '/api/events/event-uuid/registrations/export',
        {
          method: 'GET',
          organizationSlug: 'acme'
        }
      );
      expect(result).toBe(blob);
    });

    it('throws API message when export fails', async () => {
      const response = {
        ok: false,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ message: 'Falha ao exportar' })
      };

      mockedApiFetch.mockResolvedValue(response as never);

      await expect(exportEventRegistrationsCsv('event-uuid')).rejects.toThrow(
        'Falha ao exportar'
      );
    });
  });

  describe('listParticipants', () => {
    it('calls apiGet with serialized filters and returns items', async () => {
      const payload = {
        items: [
          {
            id: 'participant-1',
            eventId: 'event-uuid',
            eventTitle: 'Evento teste',
            name: 'Lincoln',
            email: 'lincoln@example.com',
            status: 'confirmed',
            checkedInAt: null,
            createdAt: '2026-03-06T12:00:00.000Z'
          }
        ],
        total: 1
      };

      mockedApiGet.mockResolvedValue(payload);

      const result = await listParticipants(
        {
          eventId: 'event-uuid',
          status: 'confirmed',
          limit: 10,
          offset: 20
        },
        { organizationSlug: 'acme' }
      );

      expect(mockedApiGet).toHaveBeenCalledWith(
        '/api/participants?eventId=event-uuid&status=confirmed&limit=10&offset=20',
        { organizationSlug: 'acme' }
      );
      expect(result).toEqual(payload);
    });

    it('returns fallback when apiGet returns null', async () => {
      mockedApiGet.mockResolvedValue(null);

      const result = await listParticipants({ eventId: 'event-uuid' });

      expect(result).toEqual({ items: [], total: 0 });
    });
  });

  describe('registration helpers', () => {
    it('calls apiPut to cancel registration', async () => {
      mockedApiPut.mockResolvedValue(undefined);

      await cancelRegistrationById('registration-uuid', {
        organizationSlug: 'acme'
      });

      expect(mockedApiPut).toHaveBeenCalledTimes(1);
      expect(mockedApiPut).toHaveBeenCalledWith(
        '/api/registrations/registration-uuid/cancel',
        undefined,
        { organizationSlug: 'acme' }
      );
    });

    it('calls apiPost to resend registration email', async () => {
      mockedApiPost.mockResolvedValue(undefined);

      await resendRegistrationEmail('registration-uuid', {
        organizationSlug: 'acme'
      });

      expect(mockedApiPost).toHaveBeenCalledWith(
        '/api/registrations/registration-uuid/resend-email',
        undefined,
        { organizationSlug: 'acme' }
      );
    });

    it('returns checkedInAt on check-in success', async () => {
      mockedApiPatch.mockResolvedValue({
        success: true,
        checkedInAt: '2026-03-06T12:00:00.000Z'
      });

      await expect(checkInRegistration('registration-uuid')).resolves.toEqual({
        checkedInAt: '2026-03-06T12:00:00.000Z'
      });
    });

    it('throws when check-in returns empty response', async () => {
      mockedApiPatch.mockResolvedValue(null);

      await expect(checkInRegistration('registration-uuid')).rejects.toThrow(
        'Unexpected empty response from API'
      );
    });

    it('returns validation data for check-in by code', async () => {
      mockedApiGet.mockResolvedValue({
        valid: true,
        eventTitle: 'Evento teste',
        name: 'Lincoln',
        eventId: 'event-uuid',
        alreadyCheckedIn: false
      });

      await expect(validateCheckInByCode('ABC123')).resolves.toEqual({
        valid: true,
        eventTitle: 'Evento teste',
        name: 'Lincoln',
        eventId: 'event-uuid',
        alreadyCheckedIn: false
      });
    });

    it('throws when validate check-in by code returns empty response', async () => {
      mockedApiGet.mockResolvedValue(null);

      await expect(validateCheckInByCode('ABC123')).rejects.toThrow(
        'Unexpected empty response from API'
      );
    });

    it('throws when confirm check-in by code returns empty response', async () => {
      mockedApiPost.mockResolvedValue(null);

      await expect(confirmCheckInByCode('ABC123')).rejects.toThrow(
        'Unexpected empty response from API'
      );
    });

    it('creates registration and returns API payload', async () => {
      mockedApiPost.mockResolvedValue({
        registrationId: 'registration-uuid',
        checkoutUrl: 'https://checkout.example.com'
      });

      await expect(
        createRegistration({
          ticketId: 'ticket-uuid',
          attendee: {
            name: 'Lincoln',
            email: 'lincoln@example.com'
          }
        })
      ).resolves.toEqual({
        registrationId: 'registration-uuid',
        checkoutUrl: 'https://checkout.example.com'
      });
    });
  });

  describe('ticket helpers', () => {
    it('calls apiPut to update ticket type', async () => {
      mockedApiPut.mockResolvedValue(undefined);

      await updateTicketType(
        'ticket-uuid',
        { name: 'VIP', quantityAvailable: 20 },
        { organizationSlug: 'acme' }
      );

      expect(mockedApiPut).toHaveBeenCalledWith(
        '/api/tickets/ticket-uuid',
        { name: 'VIP', quantityAvailable: 20 },
        { organizationSlug: 'acme' }
      );
    });

    it('calls apiDelete to remove ticket type', async () => {
      mockedApiDelete.mockResolvedValue(undefined);

      await deleteTicketType('ticket-uuid', { organizationSlug: 'acme' });

      expect(mockedApiDelete).toHaveBeenCalledWith('/api/tickets/ticket-uuid', {
        organizationSlug: 'acme'
      });
    });
  });
});
