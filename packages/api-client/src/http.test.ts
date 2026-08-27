import { describe, it, expect, vi, afterEach } from 'vitest';
import { createHttp } from './http';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function memStorage(seed?: Record<string, string>) {
  const m = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const withRefresh = { 'pilates.refreshToken': 'stored-refresh' };

afterEach(() => vi.unstubAllGlobals());

describe('createHttp refresh-retry', () => {
  it('refreshes once on 401 then retries the original request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'unauthorized' }, 401))
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: 'new', refreshToken: 'r2' }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const http = createHttp({ baseUrl: 'http://x', storage: memStorage(withRefresh) });
    http.setAccessToken('old');
    const result = await http.get('/instructors');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(http.getAccessToken()).toBe('new');
  });

  it('logs out after a second 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: 'new', refreshToken: 'r2' }),
      )
      .mockResolvedValueOnce(jsonResponse({}, 401));
    vi.stubGlobal('fetch', fetchMock);
    const onLogout = vi.fn();
    const http = createHttp({
      baseUrl: 'http://x',
      storage: memStorage(withRefresh),
      onLogout,
    });
    http.setAccessToken('old');

    await expect(http.get('/instructors')).rejects.toThrow();
    expect(onLogout).toHaveBeenCalledOnce();
    expect(http.getAccessToken()).toBeNull();
  });

  it('does not attempt a refresh for a 401 from /auth/login', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'bad creds' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    const http = createHttp({ baseUrl: 'http://x', storage: memStorage(withRefresh) });

    await expect(
      http.post('/auth/login', { email: 'a', password: 'b' }),
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
