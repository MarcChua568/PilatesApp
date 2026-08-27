import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { UserPublic } from '@pilates/api-client';
import { api, http } from '@/lib/api';

interface AuthState {
  user: UserPublic | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hydrate = useCallback(async () => {
    if (!http.getAccessToken() && !http.getRefreshToken()) {
      setIsLoading(false);
      return;
    }
    try {
      setUser(await api.me.get());
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void hydrate();
    const onLogout = () => setUser(null);
    window.addEventListener('pilates:logout', onLogout);
    return () => window.removeEventListener('pilates:logout', onLogout);
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.auth.login(email, password);
    http.setAccessToken(tokens.accessToken);
    http.setRefreshToken(tokens.refreshToken);
    setUser(await api.me.get());
  }, []);

  const logout = useCallback(() => {
    http.clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
