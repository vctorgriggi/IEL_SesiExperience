export const FORM_INPUT =
  'h-9 rounded-xl border border-border bg-background px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-60';
export const FORM_SELECT = 'w-full';
export const FORM_LABEL = 'text-xs font-medium text-foreground';
export const FORM_ERROR = 'text-xs leading-5 text-destructive';
export const FORM_HINT = 'text-xs leading-5 text-muted-foreground';
export const CARD_TITLE = 'text-sm font-semibold text-foreground';

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'evento'
  );
}
