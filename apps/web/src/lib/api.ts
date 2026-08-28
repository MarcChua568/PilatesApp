import { createHttp, createClient, makeHooks } from '@pilates/api-client';

const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const http = createHttp({
  baseUrl,
  onLogout: () => {
    // AuthProvider subscribes by polling getAccessToken; also hard-redirect as a fallback
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('pilates:logout'));
  },
});

export const api = createClient(http);
export const hooks = makeHooks(api);
