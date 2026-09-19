import { NextRequest } from 'next/server';
import { env } from '@/env';

import { handlers } from '@workspace/auth';

const reqWithDashboardOrigin = (req: NextRequest): NextRequest => {
  const { href, origin } = req.nextUrl;
  return new NextRequest(
    href.replace(origin, new URL(env.NEXT_PUBLIC_DASHBOARD_URL).origin),
    req
  );
};

export const GET = (req: NextRequest) => {
  return handlers.GET(reqWithDashboardOrigin(req));
};

export const POST = (req: NextRequest) => {
  return handlers.POST(reqWithDashboardOrigin(req));
};
