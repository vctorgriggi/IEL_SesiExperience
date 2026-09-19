import 'server-only';

import { isKnowledgeAdmin } from './knowledge-admin';

export function canOpenKnowledge(email: string | null | undefined) {
  return isKnowledgeAdmin(email);
}

export function canEditKnowledge(email: string | null | undefined) {
  return isKnowledgeAdmin(email);
}
