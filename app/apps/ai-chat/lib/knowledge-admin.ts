import 'server-only';

const adminEmails = (process.env.AI_CHAT_KB_ADMIN_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isKnowledgeAdmin(email: string | null | undefined) {
  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}
