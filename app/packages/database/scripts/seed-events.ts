import { and, eq } from 'drizzle-orm';

import {
  db,
  eventRegistrationTable,
  eventTable,
  eventTicketTypeTable,
  membershipTable,
  organizationTable,
  Role,
  userTable
} from '@workspace/database';

const SEED_USER_EMAIL = (process.env.SEED_USER_EMAIL ?? 'demo@arki.dev')
  .trim()
  .toLowerCase();
const DEFAULT_ORG_SLUG = process.env.SEED_ORG_DEFAULT_SLUG?.trim() || 'demo';

const SEED_ORG_SLUG = process.env.SEED_ORG_SLUG?.trim() || null;
const SEED_ORG_ID = process.env.SEED_ORG_ID?.trim() || null;

const PAST_EVENTS_COUNT = Math.min(
  Math.max(1, parseInt(process.env.SEED_PAST_EVENTS_COUNT ?? '40', 10)),
  100
);
const FUTURE_EVENTS_COUNT = Math.min(
  Math.max(1, parseInt(process.env.SEED_FUTURE_EVENTS_COUNT ?? '40', 10)),
  100
);

const EVENT_TITLES = [
  'Workshop de React e Next.js',
  'Meetup de Desenvolvedores',
  'Conferência de Product Management',
  'Curso de TypeScript Avançado',
  'Hackathon de Inovação',
  'Webinar: APIs REST com Node.js',
  'Treinamento de UX Design',
  'Encontro de DevOps',
  'Palestra: Carreira em Tech',
  'Workshop de Testes Automatizados',
  'Evento de Networking para Startups',
  'Bootcamp de Desenvolvimento Web',
  'Demo Day - Pitch de Projetos',
  'Mentoria em Liderança Técnica',
  'Workshop de GraphQL',
  'Meetup de Data Science',
  'Conferência de Segurança da Informação',
  'Curso de Cloud (AWS/GCP)',
  'Evento de Open Source',
  'Workshop de React Native',
  'Palestra: Inteligência Artificial',
  'Treinamento de Scrum e Agile',
  'Meetup de Mobile (iOS/Android)',
  'Hackathon de Sustentabilidade',
  'Webinar: Microserviços',
  'Encontro de QA e Testes',
  'Workshop de Docker e Kubernetes',
  'Conferência de Marketing Digital',
  'Curso de Python para Dados',
  'Evento de Diversidade em Tech'
];

const LOCATIONS = [
  'São Paulo - SP',
  'Rio de Janeiro - RJ',
  'Belo Horizonte - MG',
  'Curitiba - PR',
  'Porto Alegre - RS',
  'Online (Google Meet)',
  'Online (Zoom)',
  'Coworking Centro - Sala A',
  'Auditório da Universidade',
  'Espaço de Eventos TechHub',
  null
];

const PAST_STATUSES = [
  'completed',
  'completed',
  'completed',
  'published',
  'published',
  'draft'
] as const;
const FUTURE_STATUSES = [
  'draft',
  'published',
  'published',
  'published'
] as const;
const TICKET_TYPES = ['free', 'free', 'paid', 'paid'] as const;

const PLACEHOLDER_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
  null,
  null
];

const COORDINATES: Array<{ lat: number; lng: number } | null> = [
  { lat: -23.5505, lng: -46.6333 },
  { lat: -22.9068, lng: -43.1729 },
  { lat: -19.9167, lng: -43.9345 },
  { lat: -25.4284, lng: -49.2733 },
  { lat: -30.0346, lng: -51.2177 },
  { lat: -23.5489, lng: -46.6388 },
  null,
  null
];

const FIRST_NAMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elena',
  'Felipe',
  'Gabriela',
  'Henrique',
  'Isabela',
  'João',
  'Larissa',
  'Miguel',
  'Natália',
  'Otávio',
  'Patricia',
  'Rafael',
  'Sandra',
  'Thiago',
  'Úrsula',
  'Vitor',
  'Marina',
  'Lucas',
  'Julia'
];

const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Rodrigues',
  'Ferreira',
  'Alves',
  'Pereira',
  'Lima',
  'Gomes',
  'Costa',
  'Ribeiro',
  'Martins',
  'Carvalho',
  'Rocha'
];

const DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com.br',
  'empresa.com'
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)]!;
}

function slugFromTitle(title: string, suffix: number): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${base}-${suffix}`;
}

function randomDate(from: Date, to: Date): Date {
  const ts = from.getTime() + Math.random() * (to.getTime() - from.getTime());
  return new Date(ts);
}

function randomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[randomInt(0, chars.length - 1)];
  return code;
}

async function resolveOrgAndUser(): Promise<{
  userId: string;
  organizationId: string;
  orgLabel: string;
}> {
  if (SEED_ORG_SLUG || SEED_ORG_ID) {
    const [org] = await db
      .select({
        id: organizationTable.id,
        name: organizationTable.name,
        slug: organizationTable.slug
      })
      .from(organizationTable)
      .where(
        SEED_ORG_ID
          ? eq(organizationTable.id, SEED_ORG_ID)
          : eq(organizationTable.slug, SEED_ORG_SLUG!)
      )
      .limit(1);

    if (!org) {
      throw new Error(
        SEED_ORG_ID
          ? `Organization not found with id: ${SEED_ORG_ID}`
          : `Organization not found with slug: ${SEED_ORG_SLUG}. Check SEED_ORG_SLUG.`
      );
    }

    const members = await db
      .select({ userId: membershipTable.userId })
      .from(membershipTable)
      .where(eq(membershipTable.organizationId, org.id))
      .limit(10);

    const ownerFirst = await db
      .select({ userId: membershipTable.userId })
      .from(membershipTable)
      .where(
        and(
          eq(membershipTable.organizationId, org.id),
          eq(membershipTable.isOwner, true)
        )
      )
      .limit(1);

    const userId = (ownerFirst[0] ?? members[0])?.userId;
    if (!userId) {
      throw new Error(
        `Organization "${org.name}" (slug: ${org.slug}) has no members. Add yourself to the org first.`
      );
    }

    return {
      userId,
      organizationId: org.id,
      orgLabel: `${org.name} (${org.slug})`
    };
  }

  const [user] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, SEED_USER_EMAIL))
    .limit(1);

  if (!user) {
    throw new Error(
      `Usuário ${SEED_USER_EMAIL} não encontrado. Crie a conta com "bun --cwd packages/database run seed-demo", ou aponte SEED_USER_EMAIL para uma conta existente.`
    );
  }

  const slug = DEFAULT_ORG_SLUG;
  const [existingOrg] = await db
    .select({
      id: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug
    })
    .from(organizationTable)
    .where(eq(organizationTable.slug, slug))
    .limit(1);

  if (existingOrg) {
    const [membership] = await db
      .select({ organizationId: membershipTable.organizationId })
      .from(membershipTable)
      .where(eq(membershipTable.userId, user.id))
      .limit(1);

    if (membership) {
      return {
        userId: user.id,
        organizationId: membership.organizationId,
        orgLabel: `${existingOrg.name} (${existingOrg.slug})`
      };
    }
    await db.insert(membershipTable).values({
      userId: user.id,
      organizationId: existingOrg.id,
      role: Role.ADMIN,
      isOwner: true,
      createdAt: new Date()
    });
    return {
      userId: user.id,
      organizationId: existingOrg.id,
      orgLabel: `${existingOrg.name} (${existingOrg.slug})`
    };
  }

  const [org] = await db
    .insert(organizationTable)
    .values({ name: 'Dev Organization', slug })
    .returning({
      id: organizationTable.id,
      name: organizationTable.name,
      slug: organizationTable.slug
    });

  if (!org) throw new Error('Failed to create organization');

  await db.insert(membershipTable).values({
    userId: user.id,
    organizationId: org.id,
    role: Role.ADMIN,
    isOwner: true,
    createdAt: new Date()
  });

  return {
    userId: user.id,
    organizationId: org.id,
    orgLabel: `${org.name} (${org.slug})`
  };
}

async function seedEvents(
  userId: string,
  organizationId: string
): Promise<void> {
  const now = new Date();
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const oneMonthAhead = new Date(now);
  oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1);

  const insertedEvents: {
    id: string;
    ticketType: 'free' | 'paid';
    status: string;
  }[] = [];
  let eventIndex = 0;

  // 40 eventos passados (1 mês atrás até agora)
  for (let i = 0; i < PAST_EVENTS_COUNT; i++) {
    eventIndex += 1;
    const title = EVENT_TITLES[eventIndex % EVENT_TITLES.length]!;
    const slug = slugFromTitle(title, eventIndex);
    const status = pick(PAST_STATUSES);
    const ticketKind = pick(TICKET_TYPES);
    const startDate = randomDate(oneMonthAgo, now);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + randomInt(2, 8));

    const coords = pick(COORDINATES);
    const [inserted] = await db
      .insert(eventTable)
      .values({
        organizationId,
        slug,
        title,
        description: `Descrição do evento: ${title}. Um evento para você aprender e network.`,
        startDate,
        endDate,
        location: pick(LOCATIONS),
        imageUrl: pick(PLACEHOLDER_IMAGE_URLS),
        ticketType: ticketKind,
        ticketPriceCents: ticketKind === 'paid' ? randomInt(1, 3) * 5000 : null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        maxAttendees: randomInt(50, 500),
        isPublic: status === 'draft' ? Math.random() > 0.5 : true,
        status,
        metadata:
          Math.random() > 0.7
            ? { source: 'seed', tags: ['tech', 'networking'] }
            : null,
        createdById: userId,
        createdAt: now,
        updatedAt: now
      })
      .returning({
        id: eventTable.id,
        ticketType: eventTable.ticketType,
        status: eventTable.status
      });

    if (inserted) insertedEvents.push(inserted);
  }

  // 40 eventos futuros (agora até 1 mês à frente)
  for (let i = 0; i < FUTURE_EVENTS_COUNT; i++) {
    eventIndex += 1;
    const title = EVENT_TITLES[eventIndex % EVENT_TITLES.length]!;
    const slug = slugFromTitle(title, eventIndex);
    const status = pick(FUTURE_STATUSES);
    const ticketKind = pick(TICKET_TYPES);
    const startDate = randomDate(now, oneMonthAhead);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + randomInt(2, 8));

    const coords = pick(COORDINATES);
    const [inserted] = await db
      .insert(eventTable)
      .values({
        organizationId,
        slug,
        title,
        description: `Descrição do evento: ${title}. Um evento para você aprender e network.`,
        startDate,
        endDate,
        location: pick(LOCATIONS),
        imageUrl: pick(PLACEHOLDER_IMAGE_URLS),
        ticketType: ticketKind,
        ticketPriceCents: ticketKind === 'paid' ? randomInt(1, 3) * 5000 : null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        maxAttendees: randomInt(50, 500),
        isPublic: status === 'draft' ? Math.random() > 0.5 : true,
        status,
        metadata:
          Math.random() > 0.7
            ? { source: 'seed', tags: ['tech', 'networking'] }
            : null,
        createdById: userId,
        createdAt: now,
        updatedAt: now
      })
      .returning({
        id: eventTable.id,
        ticketType: eventTable.ticketType,
        status: eventTable.status
      });

    if (inserted) insertedEvents.push(inserted);
  }

  const eventIdsWithTicketTypes: string[] = [];

  for (const ev of insertedEvents) {
    if (ev.ticketType !== 'paid') continue;

    const [e] = await db
      .select({
        id: eventTable.id,
        startDate: eventTable.startDate,
        endDate: eventTable.endDate
      })
      .from(eventTable)
      .where(eq(eventTable.id, ev.id))
      .limit(1);
    if (!e) continue;

    const saleStartsAt = new Date(e.startDate);
    saleStartsAt.setDate(saleStartsAt.getDate() - randomInt(7, 30));
    const saleEndsAt = new Date(e.endDate);
    saleEndsAt.setHours(saleEndsAt.getHours() + 2);

    const types = [
      { name: 'Inteira', priceCents: 9900 },
      { name: 'Meia', priceCents: 4950 },
      { name: 'VIP', priceCents: 19900 }
    ];
    for (const t of types) {
      await db.insert(eventTicketTypeTable).values({
        eventId: e.id,
        name: t.name,
        priceCents: t.priceCents,
        quantityAvailable: randomInt(20, 100),
        saleStartsAt,
        saleEndsAt,
        isVisible: true,
        createdAt: now,
        updatedAt: now
      });
    }
    eventIdsWithTicketTypes.push(e.id);
  }

  const ticketTypeIdsByEvent = new Map<string, string[]>();
  for (const eventId of eventIdsWithTicketTypes) {
    const rows = await db
      .select({ id: eventTicketTypeTable.id })
      .from(eventTicketTypeTable)
      .where(eq(eventTicketTypeTable.eventId, eventId));
    ticketTypeIdsByEvent.set(
      eventId,
      rows.map((r) => r.id)
    );
  }

  const regStatuses = [
    'pending',
    'confirmed',
    'confirmed',
    'confirmed',
    'cancelled',
    'waitlist'
  ] as const;
  const paymentStatuses = ['pending', 'paid', 'paid', 'refunded'] as const;

  function fakePaymentId(): string {
    return `pay_${randomCode().toLowerCase()}${randomInt(100000, 999999)}`;
  }

  for (const ev of insertedEvents) {
    const regCount = randomInt(0, 40);
    const ticketIds = ticketTypeIdsByEvent.get(ev.id) ?? [];

    for (let r = 0; r < regCount; r++) {
      const isGuest = Math.random() > 0.2;
      const regStatus = pick(regStatuses);
      const paymentStatus =
        ev.ticketType === 'paid' ? pick(paymentStatuses) : ('pending' as const);
      const ticketTypeId = ticketIds.length > 0 ? pick(ticketIds) : null;

      const regCreatedAt = randomDate(
        new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        now
      );
      await db.insert(eventRegistrationTable).values({
        eventId: ev.id,
        ticketTypeId: ticketTypeId ?? undefined,
        userId: isGuest ? null : userId,
        guestName: isGuest ? `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}` : null,
        guestEmail: isGuest
          ? `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}@${pick(DOMAINS)}`
          : null,
        status: regStatus,
        paymentStatus: ev.ticketType === 'paid' ? paymentStatus : undefined,
        externalPaymentId:
          ev.ticketType === 'paid' && paymentStatus === 'paid'
            ? fakePaymentId()
            : null,
        registrationCode: randomCode(),
        registrationData:
          Math.random() > 0.6
            ? { source: 'seed', registeredAt: regCreatedAt.toISOString() }
            : null,
        checkedInAt:
          ev.status === 'completed' &&
          regStatus === 'confirmed' &&
          Math.random() > 0.3
            ? new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            : null,
        createdAt: regCreatedAt,
        updatedAt: now
      });
    }
  }

  console.log(
    `Seeded ${insertedEvents.length} events (${PAST_EVENTS_COUNT} past, ${FUTURE_EVENTS_COUNT} future), ticket types for ${eventIdsWithTicketTypes.length} paid events, and registrations.`
  );
}

async function main() {
  console.log(
    'Seeding events (past:',
    PAST_EVENTS_COUNT,
    ', future:',
    FUTURE_EVENTS_COUNT,
    ', window: 1 month back / 1 month ahead)...'
  );
  const { userId, organizationId, orgLabel } = await resolveOrgAndUser();
  console.log('Organization:', orgLabel);
  await seedEvents(userId, organizationId);
  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
