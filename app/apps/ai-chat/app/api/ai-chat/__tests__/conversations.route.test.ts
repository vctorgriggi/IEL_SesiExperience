import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAiChatUserId,
  mockListConversations,
  mockCreateConversation,
  mockCheck
} = vi.hoisted(() => ({
  mockGetAiChatUserId: vi.fn(),
  mockListConversations: vi.fn(),
  mockCreateConversation: vi.fn(),
  mockCheck: vi.fn()
}));

vi.mock('@workspace/ai', () => ({
  listConversations: mockListConversations,
  createConversation: mockCreateConversation,
  chatWritesLimiter: { check: mockCheck },
  CHAT_WRITES_PER_MINUTE: 60,
  rateLimitedResponse: () => new Response(null, { status: 429 })
}));

vi.mock('~/lib/auth-user', () => ({
  getAiChatUserId: mockGetAiChatUserId
}));

const USER_ID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

function get(url = 'http://localhost/api/ai-chat/conversations') {
  return new NextRequest(url);
}

function post(body: unknown) {
  return new NextRequest('http://localhost/api/ai-chat/conversations', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

describe('/api/ai-chat/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAiChatUserId.mockResolvedValue(USER_ID);
    mockCheck.mockResolvedValue({ isRateLimited: false });
    mockListConversations.mockResolvedValue({ items: [], nextCursor: null });
    mockCreateConversation.mockResolvedValue({ id: 'nova' });
  });

  describe('GET', () => {
    it('recusa quem não está autenticado', async () => {
      mockGetAiChatUserId.mockResolvedValue(null);
      const { GET } = await import('../conversations/route');

      const res = await GET(get());

      expect(res.status).toBe(401);
      expect(mockListConversations).not.toHaveBeenCalled();
    });

    it('repassa limit, cursor e busca', async () => {
      const { GET } = await import('../conversations/route');

      await GET(
        get(
          'http://localhost/api/ai-chat/conversations?limit=5&cursor=abc&q=teste'
        )
      );

      expect(mockListConversations).toHaveBeenCalledWith({
        userId: USER_ID,
        limit: 5,
        cursor: 'abc',
        query: 'teste'
      });
    });

    it('ignora limit não numérico em vez de quebrar', async () => {
      const { GET } = await import('../conversations/route');

      await GET(get('http://localhost/api/ai-chat/conversations?limit=muitos'));

      expect(mockListConversations).toHaveBeenCalledWith(
        expect.objectContaining({ limit: undefined })
      );
    });

    it('nunca lista conversa de outro usuário', async () => {
      const { GET } = await import('../conversations/route');

      await GET(get());

      expect(mockListConversations).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID })
      );
    });
  });

  describe('POST', () => {
    it('recusa quem não está autenticado', async () => {
      mockGetAiChatUserId.mockResolvedValue(null);
      const { POST } = await import('../conversations/route');

      const res = await POST(post({ title: 'oi', model: 'gpt-4o-mini' }));

      expect(res.status).toBe(401);
      expect(mockCreateConversation).not.toHaveBeenCalled();
    });

    it('devolve 429 quando o limite estoura, sem criar nada', async () => {
      mockCheck.mockResolvedValue({ isRateLimited: true });
      const { POST } = await import('../conversations/route');

      const res = await POST(post({ title: 'oi', model: 'gpt-4o-mini' }));

      expect(res.status).toBe(429);
      expect(mockCreateConversation).not.toHaveBeenCalled();
    });

    it('recusa corpo inválido', async () => {
      const { POST } = await import('../conversations/route');

      const semTitulo = await POST(post({ model: 'gpt-4o-mini' }));
      const tituloVazio = await POST(
        post({ title: '   ', model: 'gpt-4o-mini' })
      );

      expect(semTitulo.status).toBe(400);
      expect(tituloVazio.status).toBe(400);
      expect(mockCreateConversation).not.toHaveBeenCalled();
    });

    it('recusa JSON malformado', async () => {
      const { POST } = await import('../conversations/route');

      const req = new NextRequest(
        'http://localhost/api/ai-chat/conversations',
        { method: 'POST', body: 'nao é json' }
      );
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('cria com o usuário da sessão, não com o que veio no corpo', async () => {
      const { POST } = await import('../conversations/route');

      const res = await POST(
        post({
          title: 'Conversa',
          model: 'gpt-4o-mini',
          userId: 'outro-usuario'
        })
      );

      expect(res.status).toBe(201);
      expect(mockCreateConversation).toHaveBeenCalledWith({
        userId: USER_ID,
        title: 'Conversa',
        model: 'gpt-4o-mini'
      });
    });
  });
});
