/** Cota gratuita concedida no primeiro acesso. */
export const AI_CHAT_FREE_MESSAGES = (() => {
  const parsed = Number.parseInt(process.env.AI_CHAT_FREE_MESSAGES ?? '', 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 20;
})();

/** `amountCents` em BRL. */
export const AI_CHAT_CREDIT_PACKS = {
  10: { credits: 10, amountCents: 500, name: '10 mensagens' },
  50: { credits: 50, amountCents: 1500, name: '50 mensagens' },
  100: { credits: 100, amountCents: 4000, name: '100 mensagens' }
} as const;

export type AiCreditPack = keyof typeof AI_CHAT_CREDIT_PACKS;

export type ResolvedCreditPack = {
  pack: AiCreditPack;
  credits: number;
  amountCents: number;
  name: string;
};

export function resolveCreditPack(key: string): ResolvedCreditPack | null {
  switch (key) {
    case '10':
      return { pack: 10, ...AI_CHAT_CREDIT_PACKS[10] };
    case '50':
      return { pack: 50, ...AI_CHAT_CREDIT_PACKS[50] };
    case '100':
      return { pack: 100, ...AI_CHAT_CREDIT_PACKS[100] };
    default:
      return null;
  }
}
