export type SearchParamsReader = Pick<URLSearchParams, 'get'>;

export function toISOStart(date: string): string {
  return `${date}T00:00:00.000Z`;
}

export function toISOEnd(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function readDateParam(
  searchParams: SearchParamsReader,
  key: string
): string {
  return searchParams.get(key)?.slice(0, 10) ?? '';
}

export function setOrDeleteParam(
  params: URLSearchParams,
  key: string,
  value?: string
): void {
  if (value) {
    params.set(key, value);
    return;
  }
  params.delete(key);
}

export function buildEventsPath(
  params: URLSearchParams,
  eventsRoute: string
): string {
  const query = params.toString();
  return query ? `${eventsRoute}?${query}` : eventsRoute;
}
