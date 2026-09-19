export type ServerFetchOptions = {
  baseUrl: string;
  path: string;
  init?: RequestInit;
  cookie?: string | null;
  extraHeaders?: HeadersInit;
  defaultCache?: RequestCache;
};

export function buildServerUrl(baseUrl: string, path: string): string {
  const origin = baseUrl.replace(/\/$/, '');
  const pathname = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${pathname}`;
}

export function createServerRequestHeaders(options: {
  initHeaders?: HeadersInit;
  cookie?: string | null;
  extraHeaders?: HeadersInit;
}): Headers {
  const headers = new Headers(options.initHeaders);

  if (options.extraHeaders) {
    const extra = new Headers(options.extraHeaders);
    extra.forEach((value, key) => headers.set(key, value));
  }

  if (!headers.has('cookie') && options.cookie) {
    headers.set('cookie', options.cookie);
  }

  return headers;
}

export async function fetchServerPath(
  options: ServerFetchOptions
): Promise<Response> {
  const url = buildServerUrl(options.baseUrl, options.path);
  const headers = createServerRequestHeaders({
    initHeaders: options.init?.headers,
    cookie: options.cookie,
    extraHeaders: options.extraHeaders
  });

  return fetch(url, {
    ...options.init,
    headers,
    cache: options.init?.cache ?? options.defaultCache ?? 'no-store'
  });
}
