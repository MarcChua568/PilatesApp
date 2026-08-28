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
  register: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setUser(await api.me.get());
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const hydrate = async () => {
      if (!http.getAccessToken() && !http.getRefreshToken()) {
        setIsLoading(false);
        return;
      }
      await loadUser();
      setIsLoading(false);
    };
    void hydrate();
    const onLogout = () => setUser(null);
    window.addEventListener('pilates:logout', onLogout);
    return () => window.removeEventListener('pilates:logout', onLogout);
  }, [loadUser]);

  const applyTokens = useCallback(
    (tokens: { accessToken: string; refreshToken: string }) => {
      http.setAccessToken(tokens.accessToken);
      http.setRefreshToken(tokens.refreshToken);
    },
    [],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      applyTokens(await api.auth.login(email, password));
      await loadUser();
    },
    [applyTokens, loadUser],
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      applyTokens(await api.auth.register({ email, password, fullName }));
      await loadUser();
    },
    [applyTokens, loadUser],
  );

  const logout = useCallback(() => {
    http.clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refetchUser: loadUser }),
    [user, isLoading, login, register, logout, loadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
