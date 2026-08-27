import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: vi.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
      register: vi
        .fn()
        .mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
    },
    me: {
      get: vi.fn().mockResolvedValue({
        id: 'm1',
        role: 'member',
        fullName: 'Mia',
        email: 'mia@x.com',
        healthWaiverSignedAt: null,
      }),
    },
  },
  http: {
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getAccessToken: () => null,
    getRefreshToken: () => null,
    clearSession: vi.fn(),
  },
}));

function Probe() {
  const { user, login } = useAuth();
  return (
    <button onClick={() => void login('mia@x.com', 'pw')}>
      {user ? user.role : 'anon'}
    </button>
  );
}

describe('AuthProvider (member)', () => {
  it('exposes the member after login', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByRole('button')).toHaveTextContent('member'),
    );
  });
});
