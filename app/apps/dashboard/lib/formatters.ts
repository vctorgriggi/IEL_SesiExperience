import { APP_NAME } from '@workspace/common/app';

/** Data em pt-BR (dia da semana, dia, mês, ano) para exibição de eventos. */
export const eventDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

/** Hora em pt-BR para exibição de eventos. */
export const eventTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit'
});

export function createTitle(title: string, addSuffix: boolean = true): string {
  if (!addSuffix) {
    return title;
  }
  if (!title) {
    return APP_NAME;
  }

  return `${title} | ${APP_NAME}`;
}
