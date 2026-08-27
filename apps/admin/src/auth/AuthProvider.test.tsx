import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      login: vi.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
    },
    me: {
      get: vi
        .fn()
        .mockResolvedValue({ id: 'u1', role: 'admin', fullName: 'A', email: 'a@b.c' }),
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
    <button onClick={() => void login('a@b.c', 'pw')}>
      {user ? user.role : 'anon'}
    </button>
  );
}

describe('AuthProvider', () => {
  it('exposes the user after a successful login', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('anon');
    await userEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByRole('button')).toHaveTextContent('admin'),
    );
  });
});
