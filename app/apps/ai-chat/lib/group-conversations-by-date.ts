import type { Conversation } from '~/types/conversation';

export type DateGroup = 'today' | 'yesterday' | 'last7' | 'older';

export function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7 = new Date(today);
  last7.setDate(last7.getDate() - 7);

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d.getTime() === today.getTime()) return 'today';
  if (d.getTime() === yesterday.getTime()) return 'yesterday';
  if (d.getTime() >= last7.getTime()) return 'last7';
  return 'older';
}

export const DATE_GROUP_LABELS: Record<DateGroup, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last7: 'Últimos 7 dias',
  older: 'Antigo'
};

export type GroupedConversations = Record<DateGroup, Conversation[]>;

export function groupConversationsByDate(
  conversations: Conversation[]
): GroupedConversations {
  const groups: GroupedConversations = {
    today: [],
    yesterday: [],
    last7: [],
    older: []
  };
  for (const c of conversations) {
    const group = getDateGroup(c.updatedAt);
    groups[group].push(c);
  }
  return groups;
}
