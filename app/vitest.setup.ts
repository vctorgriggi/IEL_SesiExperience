/**
  * Comentário.
 */
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test';
process.env.AUTH_SECRET ??= 'test-secret-for-unit-tests-min-32-chars';
// Comentário.
process.env.NEXT_PUBLIC_DASHBOARD_URL ??= 'http://localhost:3000';
process.env.NEXT_PUBLIC_MARKETING_URL ??= 'http://localhost:3001';
process.env.NEXT_PUBLIC_AI_CHAT_URL ??= 'http://localhost:3003';
// Comentário.
process.env.API_URL ??= 'http://localhost:3002';
