import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { ReportsPage } from './ReportsPage';

vi.mock('@/lib/api', () => ({
  api: {
    reports: {
      attendanceRate: vi
        .fn()
        .mockResolvedValue({ attended: 8, totalResolved: 10, rate: 0.8 }),
      noShowRate: vi
        .fn()
        .mockResolvedValue({ noShow: 2, totalResolved: 10, rate: 0.2 }),
      bookingsPerClass: vi.fn().mockResolvedValue([
        {
          classInstanceId: 'ci1',
          className: 'Mat Pilates',
          startTime: '2026-09-10T07:00:00Z',
          capacity: 12,
          bookedCount: 9,
          waitlistCount: 1,
          attendedCount: 0,
          noShowCount: 0,
        },
      ]),
    },
  },
}));

function wrap(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe('ReportsPage', () => {
  it('renders the attendance rate and per-class table', async () => {
    wrap(<ReportsPage />);
    await waitFor(() => expect(screen.getByText('80%')).toBeInTheDocument());
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Mat Pilates')).toBeInTheDocument();
    expect(screen.getByText('9/12')).toBeInTheDocument();
  });
});
