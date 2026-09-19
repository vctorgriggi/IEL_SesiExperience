/**
 * Cliente HTTP compartilhado da API.
 * Usa credenciais e retentativa em falha de conexão.
 */

import type { z } from 'zod';

const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 500;

function buildUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function isConnectionError(err: unknown): boolean {
  if (err instanceof TypeError) {
    const msg = (err.message ?? '').toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('connection')
    );
  }
  return false;
}

export interface ApiClientOptions extends Omit<RequestInit, 'credentials'> {
  organizationSlug?: string;
}

/** Opções para chamadas com escopo de organização. */
export function withOrg(slug: string): ApiClientOptions {
  return { organizationSlug: slug };
}

/** Lê JSON da resposta. Retorna null sem corpo. */
export async function handleApiResponse<T>(
  res: Response,
  schema?: z.ZodType<T>
): Promise<T | null> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return schema ? schema.parse(data) : data;
}

export type CreateApiClientOptions = {
  retryAttempts?: number;
  retryDelayMs?: number;
};

export function createApiClient(
  baseUrl: string,
  options?: CreateApiClientOptions
) {
  const retryAttempts = options?.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;
  const retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;

  async function apiFetch(
    path: string,
    init?: ApiClientOptions
  ): Promise<Response> {
    const { organizationSlug, headers: customHeaders, ...rest } = init ?? {};
    const url = buildUrl(baseUrl, path);
    const headers = new Headers(customHeaders ?? {});
    if (!(rest.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    if (organizationSlug) {
      headers.set('x-organization-slug', organizationSlug);
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          ...rest,
          credentials: 'include',
          headers
        });

        if (
          rest.redirect === 'manual' &&
          res.status >= 300 &&
          res.status < 400
        ) {
          return res;
        }

        if (!res.ok) {
          const err = (await res
            .json()
            .catch(() => ({ message: res.statusText }))) as {
            message?: string;
            error?: string;
          } | null;
          const message =
            err?.message ?? err?.error ?? `API error ${res.status}`;
          throw new Error(message);
        }

        return res;
      } catch (err) {
        lastErr = err;
        const isRetryable =
          attempt < retryAttempts &&
          (isConnectionError(err) || err instanceof TypeError);
        if (!isRetryable) {
          if (isConnectionError(err)) {
            throw new Error(
              'API indisponível. Verifique se o servidor da API está rodando e acessível.'
            );
          }
          throw err;
        }
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
      }
    }
    if (isConnectionError(lastErr)) {
      throw new Error(
        'API indisponível. Verifique se o servidor da API está rodando e acessível.'
      );
    }
    throw lastErr;
  }

  async function apiGet<T>(
    path: string,
    opts?: ApiClientOptions
  ): Promise<T | null> {
    const res = await apiFetch(path, { ...opts, method: 'GET' });
    return handleApiResponse<T>(res);
  }

  async function apiPost<T>(
    path: string,
    body?: unknown,
    opts?: ApiClientOptions
  ): Promise<T | null> {
    const res = await apiFetch(path, {
      ...opts,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    return handleApiResponse<T>(res);
  }

  async function apiPatch<T>(
    path: string,
    body?: unknown,
    opts?: ApiClientOptions
  ): Promise<T | null> {
    const res = await apiFetch(path, {
      ...opts,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    return handleApiResponse<T>(res);
  }

  async function apiPut<T>(
    path: string,
    body?: unknown,
    opts?: ApiClientOptions
  ): Promise<T | null> {
    const res = await apiFetch(path, {
      ...opts,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    return handleApiResponse<T>(res);
  }

  async function apiDelete<T>(
    path: string,
    opts?: ApiClientOptions
  ): Promise<T | null> {
    const res = await apiFetch(path, { ...opts, method: 'DELETE' });
    return handleApiResponse<T>(res);
  }

  return {
    apiFetch,
    apiGet,
    apiPost,
    apiPatch,
    apiPut,
    apiDelete,
    handleApiResponse
  };
}
