import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  CHAT_CHECKOUT_PER_MINUTE,
  chatCheckoutLimiter,
  rateLimitedResponse,
  recordAiCreditPurchase,
  resolveCreditPack
} from '@workspace/ai';
import {
  createAbacatePayCustomerForUser,
  getAbacatePayClient
} from '@workspace/billing';
import { db, eq, userTable } from '@workspace/database';
import { baseUrl } from '@workspace/routes';

import { getAiChatUserId } from '~/lib/auth-user';

const bodySchema = z.object({
  pack: z.string().trim()
});

function abacatePaySecretKey(): string | null {
  return (
    process.env.BILLING_ABACATEPAY_SECRET_KEY ??
    process.env.ABACATEPAY_SECRET_KEY ??
    null
  );
}

function resolveReturnBase(req: NextRequest): string {
  const configured = [baseUrl.aiChat, baseUrl.dashboard, baseUrl.marketing]
    .filter((url): url is string => Boolean(url))
    .map((url) => new URL(url).origin);
  const allowed = new Set(configured);

  for (const header of ['origin', 'referer']) {
    const value = req.headers.get(header);
    if (!value) continue;
    try {
      const origin = new URL(value).origin;
      if (allowed.has(origin)) return origin;
    } catch {
      continue;
    }
  }

  return configured[0] ?? req.nextUrl.origin;
}

/**
 * POST /api/ai-chat/credits-checkout — cria uma cobrança única (PIX/cartão) no
 * AbacatePay para comprar um pacote de mensagens. O crédito é aplicado pelo
 * webhook de pagamento (idempotente).
 */
export async function POST(req: NextRequest): Promise<Response> {
  const userId = await getAiChatUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { isRateLimited } = await chatCheckoutLimiter.check(
    CHAT_CHECKOUT_PER_MINUTE,
    `ai-chat-checkout:${userId}`
  );
  if (isRateLimited) return rateLimitedResponse();

  const secretKey = abacatePaySecretKey();
  if (!secretKey) {
    return NextResponse.json(
      { error: 'Pagamento por PIX/cartão não está configurado.' },
      { status: 501 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 });
  }

  const pack = resolveCreditPack(parsed.data.pack);
  if (!pack) {
    return NextResponse.json({ error: 'Pacote inválido' }, { status: 400 });
  }

  const [user] = await db
    .select({ name: userTable.name, email: userTable.email })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!user?.email) {
    return NextResponse.json(
      { error: 'Sua conta precisa de um e-mail para pagar.' },
      { status: 400 }
    );
  }

  const customerId = await createAbacatePayCustomerForUser(db, secretKey, {
    userId,
    name: user.name,
    email: user.email
  });

  const returnBase = resolveReturnBase(req);
  const client = getAbacatePayClient(secretKey);

  const billing = await client.createBilling({
    frequency: 'ONE_TIME',
    methods: ['PIX', 'CARD'],
    products: [
      {
        externalId: `arki:ai-credits:${userId}:${pack.pack}`,
        name: pack.name,
        quantity: 1,
        price: pack.amountCents
      }
    ],
    returnUrl: `${returnBase}/chat`,
    completionUrl: `${returnBase}/chat?credits=success`,
    ...(customerId
      ? { customerId }
      : { customer: { name: user.name, email: user.email } })
  });

  if (billing.error || !billing.data?.url || !billing.data.id) {
    return NextResponse.json(
      { error: 'Não foi possível gerar o pagamento.' },
      { status: 502 }
    );
  }

  await recordAiCreditPurchase({
    billingId: billing.data.id,
    userId,
    credits: pack.credits,
    amountCents: pack.amountCents
  });

  return NextResponse.json({
    checkoutUrl: billing.data.url,
    billingId: billing.data.id
  });
}
