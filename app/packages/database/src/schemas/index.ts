/** Export central dos schemas do banco por domínio. */

// Tipos e enums compartilhados
export * from './shared';

// Auth
export * from './auth';

// Organizações
export * from './organizations';

// Eventos
export * from './events';

// Integrações (webhooks, API keys)
export * from './integrations';

// Billing (assinaturas)
export * from './billing';

// Suporte (feedback / contato)
export * from './support';

// Chat com IA (conversas, mensagens, créditos)
export * from './ai-chat';

// Mind RH / IEL (sala da demonstração compartilhada e log de ações)
export * from './iel';
