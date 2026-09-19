import { NextRequest, NextResponse } from 'next/server';
import { validate as uuidValidate } from 'uuid';

import {
  and,
  db,
  eq,
  InvitationStatus,
  invitationTable,
  organizationTable
} from '@workspace/database';
import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';

const invitationsValidateLimiter = inMemoryRateLimiter({
  intervalInMs: 60 * 1000 // 1 minute
});

const INVITATIONS_VALIDATE_REQUESTS_PER_MINUTE = 60;

function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';
  return `invitations-validate:${ip}`;
}

type RouteParams = { params: Promise<{ token: string }> };

/**
 * GET /api/invitations/validate/[token]
 * Rate limited per IP (60 req/min).
 */
export async function GET(
  req: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  const identifier = getClientIdentifier(req);
  const { isRateLimited } = await invitationsValidateLimiter.check(
    INVITATIONS_VALIDATE_REQUESTS_PER_MINUTE,
    identifier
  );
  if (isRateLimited) {
    return NextResponse.json({ valid: false as const }, { status: 429 });
  }

  const { token } = await params;
  if (!token || !uuidValidate(token)) {
    return NextResponse.json({ valid: false as const }, { status: 200 });
  }

  const [row] = await db
    .select({
      organizationName: organizationTable.name,
      role: invitationTable.role,
      email: invitationTable.email
    })
    .from(invitationTable)
    .innerJoin(
      organizationTable,
      eq(organizationTable.id, invitationTable.organizationId)
    )
    .where(
      and(
        eq(invitationTable.token, token),
        eq(invitationTable.status, InvitationStatus.PENDING)
      )
    )
    .limit(1);

  if (!row) {
    return NextResponse.json({ valid: false as const }, { status: 200 });
  }

  return NextResponse.json({
    valid: true as const,
    organizationName: row.organizationName,
    role: row.role,
    email: row.email
  });
}
