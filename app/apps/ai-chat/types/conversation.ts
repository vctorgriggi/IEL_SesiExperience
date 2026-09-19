export type Conversation = {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
};

export const CONVERSATIONS_PAGE_SIZE = 30;

/** Título provisório; o servidor gera o definitivo após a primeira resposta. */
export const DEFAULT_CONVERSATION_TITLE = 'Nova conversa';

export type ConversationPage = {
  items: Conversation[];
  nextCursor: string | null;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

export type ConversationWithMessages = Conversation & { messages: Message[] };
