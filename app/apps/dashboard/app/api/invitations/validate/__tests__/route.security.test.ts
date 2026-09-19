import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDbChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([])
};

vi.mock('@workspace/database', () => ({
  db: mockDbChain,
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((a: unknown, b: unknown) => ({ a, b })),
  invitationTable: {},
  organizationTable: {},
  InvitationStatus: { PENDING: 'PENDING' }
}));

const INVITATIONS_VALIDATE_REQUESTS_PER_MINUTE = 60;
const REQUESTS_OVER_LIMIT = INVITATIONS_VALIDATE_REQUESTS_PER_MINUTE + 1;

describe('GET /api/invitations/validate/[token] – rate limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbChain.limit.mockResolvedValue([]);
  });

  it('returns 429 after exceeding request limit per IP', async () => {
    const { GET } = await import('../[token]/route');

    const req = new NextRequest(
      'http://localhost/api/invitations/validate/550e8400-e29b-41d4-a716-446655440000',
      { headers: { 'x-forwarded-for': '192.168.1.100' } }
    );
    const params = Promise.resolve({
      token: '550e8400-e29b-41d4-a716-446655440000'
    });

    let lastStatus = 0;
    for (let i = 0; i < REQUESTS_OVER_LIMIT; i++) {
      const res = await GET(req, { params });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);
  });
});
