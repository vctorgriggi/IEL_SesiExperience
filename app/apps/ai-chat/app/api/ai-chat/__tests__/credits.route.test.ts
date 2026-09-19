import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAiChatUserId,
  mockConsumeAiMessage,
  mockGetAiCreditBalance,
  mockListCreditLedger
} = vi.hoisted(() => ({
  mockGetAiChatUserId: vi.fn(),
  mockConsumeAiMessage: vi.fn(),
  mockGetAiCreditBalance: vi.fn(),
  mockListCreditLedger: vi.fn()
}));

vi.mock('@workspace/ai', () => ({
  consumeAiMessage: mockConsumeAiMessage,
  getAiCreditBalance: mockGetAiCreditBalance,
  listCreditLedger: mockListCreditLedger,
  CREDIT_LEDGER_PAGE_SIZE: 20
}));

vi.mock('~/lib/auth-user', () => ({
  getAiChatUserId: mockGetAiChatUserId
}));

const USER_ID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

describe('rotas de crédito', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAiChatUserId.mockResolvedValue(USER_ID);
  });

  describe('POST /use-message', () => {
    it('recusa quem não está autenticado sem debitar', async () => {
      mockGetAiChatUserId.mockResolvedValue(null);
      const { POST } = await import('../use-message/route');

      const res = await POST();

      expect(res.status).toBe(401);
      expect(mockConsumeAiMessage).not.toHaveBeenCalled();
    });

    it('responde 402 quando o saldo acabou', async () => {
      mockConsumeAiMessage.mockResolvedValue({
        ok: false,
        balance: { freeRemaining: 0, credits: 0 }
      });
      const { POST } = await import('../use-message/route');

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(402);
      expect(body.message).toMatch(/créditos/i);
      expect(body.freeRemaining).toBe(0);
    });

    it('devolve o saldo restante quando debita', async () => {
      mockConsumeAiMessage.mockResolvedValue({
        ok: true,
        source: 'free',
        balance: { freeRemaining: 19, credits: 0 }
      });
      const { POST } = await import('../use-message/route');

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.freeRemaining).toBe(19);
      expect(mockConsumeAiMessage).toHaveBeenCalledWith(USER_ID);
    });

    it('não deixa o saldo ser cacheado', async () => {
      mockConsumeAiMessage.mockResolvedValue({
        ok: true,
        source: 'free',
        balance: { freeRemaining: 19, credits: 0 }
      });
      const { POST } = await import('../use-message/route');

      const res = await POST();

      expect(res.headers.get('Cache-Control')).toBe('no-store');
    });
  });

  describe('GET /balance', () => {
    it('recusa quem não está autenticado', async () => {
      mockGetAiChatUserId.mockResolvedValue(null);
      const { GET } = await import('../balance/route');

      const res = await GET();

      expect(res.status).toBe(401);
      expect(mockGetAiCreditBalance).not.toHaveBeenCalled();
    });

    it('lê o saldo do usuário da sessão', async () => {
      mockGetAiCreditBalance.mockResolvedValue({
        freeRemaining: 3,
        credits: 10
      });
      const { GET } = await import('../balance/route');

      const res = await GET();
      const body = await res.json();

      expect(body).toEqual({ freeRemaining: 3, credits: 10 });
      expect(mockGetAiCreditBalance).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('GET /credits-history', () => {
    beforeEach(() => {
      mockListCreditLedger.mockResolvedValue({ items: [], nextCursor: null });
    });

    it('recusa quem não está autenticado', async () => {
      mockGetAiChatUserId.mockResolvedValue(null);
      const { GET } = await import('../credits-history/route');

      const res = await GET(
        new NextRequest('http://localhost/api/ai-chat/credits-history')
      );

      expect(res.status).toBe(401);
      expect(mockListCreditLedger).not.toHaveBeenCalled();
    });

    it('repassa cursor e limit', async () => {
      const { GET } = await import('../credits-history/route');

      await GET(
        new NextRequest(
          'http://localhost/api/ai-chat/credits-history?limit=5&cursor=2026-07-20T00:00:00.000Z'
        )
      );

      expect(mockListCreditLedger).toHaveBeenCalledWith({
        userId: USER_ID,
        limit: 5,
        cursor: '2026-07-20T00:00:00.000Z'
      });
    });

    it('cai no padrão quando o limit não é número', async () => {
      const { GET } = await import('../credits-history/route');

      await GET(
        new NextRequest(
          'http://localhost/api/ai-chat/credits-history?limit=abc'
        )
      );

      expect(mockListCreditLedger).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20 })
      );
    });
  });
});
