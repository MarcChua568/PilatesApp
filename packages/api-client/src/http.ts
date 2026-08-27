export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface HttpOptions {
  baseUrl: string;
  storage?: Storage;
  onLogout?: () => void;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message?: string,
  ) {
    super(message ?? `Request failed (${status})`);
    this.name = 'ApiError';
  }
}

const REFRESH_KEY = 'pilates.refreshToken';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

function defaultStorage(): Storage {
  if (typeof localStorage !== 'undefined') return localStorage;
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

export function createHttp(opts: HttpOptions) {
  const storage = opts.storage ?? defaultStorage();
  let accessToken: string | null = null;

  const setAccessToken = (t: string | null) => {
    accessToken = t;
  };
  const getAccessToken = () => accessToken;
  const setRefreshToken = (t: string | null) => {
    if (t) storage.setItem(REFRESH_KEY, t);
    else storage.removeItem(REFRESH_KEY);
  };
  const getRefreshToken = () => storage.getItem(REFRESH_KEY);

  const clearSession = () => {
    accessToken = null;
    setRefreshToken(null);
    opts.onLogout?.();
  };

  async function raw(
    method: Method,
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${opts.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async function parse(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  async function tryRefresh(): Promise<boolean> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    const res = await fetch(`${opts.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await parse(res)) as {
      accessToken?: string;
      refreshToken?: string;
    } | null;
    if (!data?.accessToken) return false;
    setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return true;
  }

  async function request<T>(
    method: Method,
    path: string,
    body?: unknown,
  ): Promise<T> {
    let res = await raw(method, path, body);

    if (res.status === 401 && !path.startsWith('/auth/')) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await raw(method, path, body);
      }
      if (res.status === 401) {
        clearSession();
        throw new ApiError(401, await parse(res), 'Session expired');
      }
    }

    const parsed = await parse(res);
    if (!res.ok) {
      const message =
        parsed &&
        typeof parsed === 'object' &&
        'message' in parsed &&
        typeof (parsed as { message: unknown }).message === 'string'
          ? (parsed as { message: string }).message
          : undefined;
      throw new ApiError(res.status, parsed, message);
    }
    return parsed as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
    del: <T>(path: string) => request<T>('DELETE', path),
    setAccessToken,
    getAccessToken,
    setRefreshToken,
    getRefreshToken,
    clearSession,
  };
}

export type Http = ReturnType<typeof createHttp>;
