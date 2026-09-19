'use server';

import crypto from 'crypto';
import { authOrganizationActionClient } from '@/actions/safe-action';

import { NotFoundError, PreConditionError } from '@workspace/common/errors';
import {
  and,
  db,
  eq,
  eventRegistrations,
  events,
  userTable
} from '@workspace/database';
import { routeUrls } from '@workspace/routes';

import { EmailProvider } from '@workspace/email/provider';

import { registrationByIdSchema } from '../schemas/registration-by-id-schema';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateRegistrationCode(): string {
  return crypto
    .randomBytes(10)
    .toString('base64url')
    .replace(/[_-]/g, '')
    .slice(0, 12);
}

export const resendEventRegistrationEmail = authOrganizationActionClient
  .metadata({ actionName: 'resendEventRegistrationEmail' })
  .inputSchema(registrationByIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { registrationId } = parsedInput;

    const [row] = await db
      .select({
        id: eventRegistrations.id,
        eventId: eventRegistrations.eventId,
        registrationCode: eventRegistrations.registrationCode,
        guestName: eventRegistrations.guestName,
        guestEmail: eventRegistrations.guestEmail,
        userName: userTable.name,
        userEmail: userTable.email,
        eventSlug: events.slug,
        eventTitle: events.title
      })
      .from(eventRegistrations)
      .innerJoin(events, eq(events.id, eventRegistrations.eventId))
      .leftJoin(userTable, eq(userTable.id, eventRegistrations.userId))
      .where(
        and(
          eq(eventRegistrations.id, registrationId),
          eq(events.organizationId, ctx.organization.id),
          eq(events.createdById, ctx.session.user.id)
        )
      )
      .limit(1);

    if (!row) {
      throw new NotFoundError(
        'Inscrição não encontrada ou você não tem permissão'
      );
    }

    const recipient = row.userEmail ?? row.guestEmail;
    if (!recipient) {
      throw new PreConditionError('Participante não possui e-mail cadastrado');
    }

    const participantName = row.userName ?? row.guestName ?? 'Participante';

    let code = row.registrationCode ?? null;
    if (!code) {
      code = generateRegistrationCode();
      await db
        .update(eventRegistrations)
        .set({ registrationCode: code, updatedAt: new Date() })
        .where(eq(eventRegistrations.id, registrationId));
    }

    const baseConfirmationUrl = routeUrls.dashboard.openEvents
      .bySlug(row.eventSlug)
      .confirmation;
    const confirmationUrl = new URL(baseConfirmationUrl);
    confirmationUrl.searchParams.set('code', code);

    const subject = `Seu ingresso para ${row.eventTitle}`;
    const text = `Olá, ${participantName}!\n\nAqui está o link do seu ingresso para "${row.eventTitle}":\n${confirmationUrl.toString()}\n\nSe você não solicitou este e-mail, pode ignorá-lo.`;
    const safeName = escapeHtml(participantName);
    const safeTitle = escapeHtml(row.eventTitle);
    const safeUrl = escapeHtml(confirmationUrl.toString());
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, 'Noto Sans', 'Liberation Sans', sans-serif; line-height: 1.5;">
        <p>Olá, <strong>${safeName}</strong>!</p>
        <p>Aqui está o link do seu ingresso para <strong>${safeTitle}</strong>:</p>
        <p><a href="${safeUrl}">${safeUrl}</a></p>
        <p style="color: #666; font-size: 12px;">Se você não solicitou este e-mail, pode ignorá-lo.</p>
      </div>
    `.trim();

    await EmailProvider.sendEmail({
      recipient,
      subject,
      text,
      html
    });

    return { success: true as const, recipient };
  });
