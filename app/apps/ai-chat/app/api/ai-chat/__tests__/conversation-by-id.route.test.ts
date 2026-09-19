import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetAiChatUserId,
  mockGetConversation,
  mockListMessages,
  mockUpdateConversation,
  mockDeleteConversation,
  mockCheck
} = vi.hoisted(() => ({
  mockGetAiChatUserId: vi.fn(),
  mockGetConversation: vi.fn(),
  mockListMessages: vi.fn(),
  mockUpdateConversation: vi.fn(),
  mockDeleteConversation: vi.fn(),
  mockCheck: vi.fn()
}));

vi.mock('@workspace/ai', () => ({
  getConversation: mockGetConversation,
  listMessages: mockListMessages,
  updateConversation: mockUpdateConversation,
  deleteConversation: mockDeleteConversation,
  chatWritesLimiter: { check: mockCheck },
  CHAT_WRITES_PER_MINUTE: 60,
  rateLimitedResponse: () => new Response(null, { status: 429 })
}));

vi.mock('~/lib/auth-user', () => ({
  getAiChatUserId: mockGetAiChatUserId
}));

const USER_ID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
const CONVERSATION_ID = '2b1f6b6e-5d0b-4a2a-9f0f-0a4a1f2c3d4e';

const params = Promise.resolve({ id: CONVERSATION_ID });

function request(method: string, body?: unknown) {
  return new NextRequest(
    `http://localhost/api/ai-chat/conversations/${CONVERSATION_ID}`,
    {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }
  );
}

describe('/api/ai-chat/conversations/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAiChatUserId.mockResolvedValue(USER_ID);
    mockCheck.mockResolvedValue({ isRateLimited: false });
    mockGetConversation.mockResolvedValue({
      id: CONVERSATION_ID,
      title: 'Conversa'
    });
    mockListMessages.mockResolvedValue([]);
    mockUpdateConversation.mockResolvedValue(true);
    mockDeleteConversation.mockResolvedValue(true);
  });

  describe('GET', () => {
    it('recusa quem não está autenticado', async () => {
      mockGetAiChatUserId.mockResolvedValue(null);
      const { GET } = await import('../conversations/[id]/route');

      const res = await GET(request('GET'), { params });

      expect(res.status).toBe(401);
    });

    it('responde 404 para conversa de outro usuário', async () => {
      mockGetConversation.mockResolvedValue(null);
      const { GET } = await import('../conversations/[id]/route');

      const res = await GET(request('GET'), { params });

      expect(res.status).toBe(404);
      expect(mockListMessages).not.toHaveBeenCalled();
    });

    it('devolve conversa com mensagens', async () => {
      mockListMessages.mockResolvedValue([{ id: 'm1', content: 'oi' }]);
      const { GET } = await import('../conversations/[id]/route');

      const res = await GET(request('GET'), { params });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.messages).toHaveLength(1);
      expect(mockGetConversation).toHaveBeenCalledWith(
        CONVERSATION_ID,
        USER_ID
      );
    });
  });

  describe('PATCH', () => {
    it('aceita só título, só modelo, ou os dois', async () => {
      const { PATCH } = await import('../conversations/[id]/route');

      const soTitulo = await PATCH(request('PATCH', { title: 'Novo' }), {
        params
      });
      const soModelo = await PATCH(request('PATCH', { model: 'gpt-4o' }), {
        params
      });

      expect(soTitulo.status).toBe(200);
      expect(soModelo.status).toBe(200);
      expect(mockUpdateConversation).toHaveBeenLastCalledWith({
        id: CONVERSATION_ID,
        userId: USER_ID,
        title: undefined,
        model: 'gpt-4o'
      });
    });

    it('recusa corpo sem nenhum campo', async () => {
      const { PATCH } = await import('../conversations/[id]/route');

      const res = await PATCH(request('PATCH', {}), { params });

      expect(res.status).toBe(400);
      expect(mockUpdateConversation).not.toHaveBeenCalled();
    });

    it('responde 404 quando a conversa não é do usuário', async () => {
      mockUpdateConversation.mockResolvedValue(false);
      const { PATCH } = await import('../conversations/[id]/route');

      const res = await PATCH(request('PATCH', { title: 'Novo' }), { params });

      expect(res.status).toBe(404);
    });

    it('devolve 429 sem tocar na conversa', async () => {
      mockCheck.mockResolvedValue({ isRateLimited: true });
      const { PATCH } = await import('../conversations/[id]/route');

      const res = await PATCH(request('PATCH', { title: 'Novo' }), { params });

      expect(res.status).toBe(429);
      expect(mockUpdateConversation).not.toHaveBeenCalled();
    });
  });

  describe('DELETE', () => {
    it('recusa quem não está autenticado', async () => {
      mockGetAiChatUserId.mockResolvedValue(null);
      const { DELETE } = await import('../conversations/[id]/route');

      const res = await DELETE(request('DELETE'), { params });

      expect(res.status).toBe(401);
      expect(mockDeleteConversation).not.toHaveBeenCalled();
    });

    it('responde 404 quando a conversa não é do usuário', async () => {
      mockDeleteConversation.mockResolvedValue(false);
      const { DELETE } = await import('../conversations/[id]/route');

      const res = await DELETE(request('DELETE'), { params });

      expect(res.status).toBe(404);
    });

    it('apaga passando o usuário da sessão', async () => {
      const { DELETE } = await import('../conversations/[id]/route');

      const res = await DELETE(request('DELETE'), { params });

      expect(res.status).toBe(200);
      expect(mockDeleteConversation).toHaveBeenCalledWith(
        CONVERSATION_ID,
        USER_ID
      );
    });
  });
});
