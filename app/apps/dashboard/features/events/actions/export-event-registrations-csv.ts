'use server';

import { authOrganizationActionClient } from '@/actions/safe-action';

import { NotFoundError } from '@workspace/common/errors';
import {
  and,
  db,
  eq,
  eventRegistrations,
  events,
  userTable
} from '@workspace/database';

import { exportEventRegistrationsCsvSchema } from '../schemas/export-event-registrations-csv-schema';

function toCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function sanitizeFilenameSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const exportEventRegistrationsCsv = authOrganizationActionClient
  .metadata({ actionName: 'exportEventRegistrationsCsv' })
  .inputSchema(exportEventRegistrationsCsvSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { eventId } = parsedInput;

    const [event] = await db
      .select({ id: events.id, title: events.title })
      .from(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.organizationId, ctx.organization.id),
          eq(events.createdById, ctx.session.user.id)
        )
      )
      .limit(1);

    if (!event) {
      throw new NotFoundError(
        'Evento não encontrado ou você não tem permissão'
      );
    }

    const rows = await db
      .select({
        name: userTable.name,
        email: userTable.email,
        guestName: eventRegistrations.guestName,
        guestEmail: eventRegistrations.guestEmail,
        status: eventRegistrations.status,
        registrationCode: eventRegistrations.registrationCode,
        checkedInAt: eventRegistrations.checkedInAt,
        createdAt: eventRegistrations.createdAt
      })
      .from(eventRegistrations)
      .leftJoin(userTable, eq(userTable.id, eventRegistrations.userId))
      .where(eq(eventRegistrations.eventId, eventId))
      .orderBy(eventRegistrations.createdAt);

    const header = [
      'Nome',
      'E-mail',
      'Status',
      'Código',
      'Check-in em',
      'Inscrito em'
    ].join(',');

    const lines = rows.map((r) => {
      const name = r.name ?? r.guestName ?? '';
      const email = r.email ?? r.guestEmail ?? '';
      const status = r.checkedInAt != null ? 'checked-in' : r.status;
      const code = r.registrationCode ?? '';
      const checkedInAt = r.checkedInAt ? r.checkedInAt.toISOString() : '';
      const createdAt = r.createdAt ? r.createdAt.toISOString() : '';

      return [
        toCsvCell(name),
        toCsvCell(email),
        toCsvCell(status),
        toCsvCell(code),
        toCsvCell(checkedInAt),
        toCsvCell(createdAt)
      ].join(',');
    });

    const csv = '\ufeff' + [header, ...lines].join('\n');
    const filename = `inscricoes-${sanitizeFilenameSegment(event.title) || eventId}.csv`;

    return { csv, filename };
  });
