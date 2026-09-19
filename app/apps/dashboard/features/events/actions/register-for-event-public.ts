'use server';

import crypto from 'crypto';
import { actionClient } from '@/actions/safe-action';

import { NotFoundError, PreConditionError } from '@workspace/common/errors';
import {
  and,
  count,
  db,
  eq,
  eventRegistrations,
  events,
  eventTicketTypeTable
} from '@workspace/database';

import { registerForEventPublicSchema } from '../schemas/register-for-event-public-schema';

function generateRegistrationCode(): string {
  return crypto
    .randomBytes(10)
    .toString('base64url')
    .replace(/[_-]/g, '')
    .slice(0, 12);
}

export const registerForEventPublic = actionClient
  .metadata({ actionName: 'registerForEventPublic' })
  .inputSchema(registerForEventPublicSchema)
  .action(async ({ parsedInput }) => {
    const { eventSlug, ticketId, name, email } = parsedInput;

    const [event] = await db
      .select({
        id: events.id,
        status: events.status,
        isPublic: events.isPublic,
        maxAttendees: events.maxAttendees
      })
      .from(events)
      .where(
        and(
          eq(events.slug, eventSlug),
          eq(events.status, 'published'),
          eq(events.isPublic, true)
        )
      )
      .limit(1);
    if (!event) {
      throw new NotFoundError(
        'Evento não encontrado ou não disponível para inscrição'
      );
    }

    const [ticketType] = await db
      .select({
        id: eventTicketTypeTable.id,
        eventId: eventTicketTypeTable.eventId,
        isVisible: eventTicketTypeTable.isVisible,
        quantityAvailable: eventTicketTypeTable.quantityAvailable
      })
      .from(eventTicketTypeTable)
      .where(
        and(
          eq(eventTicketTypeTable.id, ticketId),
          eq(eventTicketTypeTable.eventId, event.id),
          eq(eventTicketTypeTable.isVisible, true)
        )
      )
      .limit(1);
    if (!ticketType) {
      throw new PreConditionError('Tipo de ingresso inválido ou indisponível');
    }

    const [countRow] = await db
      .select({ count: count() })
      .from(eventRegistrations)
      .where(
        and(
          eq(eventRegistrations.eventId, event.id),
          eq(eventRegistrations.status, 'confirmed')
        )
      );
    const confirmedCount = Number(countRow?.count ?? 0);
    if (event.maxAttendees != null && confirmedCount >= event.maxAttendees) {
      throw new PreConditionError('Evento esgotado');
    }

    if (
      ticketType.quantityAvailable != null &&
      ticketType.quantityAvailable > 0
    ) {
      const [ticketCountRow] = await db
        .select({ count: count() })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.ticketTypeId, ticketId),
            eq(eventRegistrations.status, 'confirmed')
          )
        );
      const ticketConfirmed = Number(ticketCountRow?.count ?? 0);
      if (ticketConfirmed >= ticketType.quantityAvailable) {
        throw new PreConditionError('Ingressos deste tipo esgotados');
      }
    }

    const registrationCode = generateRegistrationCode();

    const [registration] = await db
      .insert(eventRegistrations)
      .values({
        eventId: event.id,
        ticketTypeId: ticketId,
        userId: null,
        guestName: name.trim() || null,
        guestEmail: email.trim() || null,
        status: 'confirmed',
        registrationCode
      })
      .returning({ id: eventRegistrations.id });

    return {
      registrationId: registration?.id ?? '',
      code: registrationCode,
      eventSlug
    };
  });
