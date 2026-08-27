import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpotMapEditor } from './SpotMapEditor';

const spotsList = vi.fn();
const spotsCreate = vi.fn();
const spotsUpdate = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    spots: {
      listForRoom: (...a: unknown[]) => spotsList(...a),
      create: (...a: unknown[]) => spotsCreate(...a),
      update: (...a: unknown[]) => spotsUpdate(...a),
      remove: vi.fn(),
    },
  },
  hooks: {
    useRoomSpots: () => ({ data: currentSpots, isLoading: false }),
  },
}));

let currentSpots: unknown[] = [];

function wrap(node: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{node}</QueryClientProvider>);
}

describe('SpotMapEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSpots = [
      {
        id: 's1',
        roomId: 'r1',
        label: '1',
        positionGroup: 'left',
        sortOrder: 1,
        bookable: true,
        active: true,
      },
    ];
    spotsCreate.mockResolvedValue({});
    spotsUpdate.mockResolvedValue({});
  });

  it('renders existing spots and creates a new one with the typed label', async () => {
    wrap(<SpotMapEditor roomId="r1" />);
    expect(screen.getByDisplayValue('left')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Label'), '7');
    await userEvent.click(screen.getByRole('button', { name: /add spot/i }));

    await waitFor(() =>
      expect(spotsCreate).toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({ label: '7', sortOrder: 2 }),
      ),
    );
  });

  it('toggles bookable on a row', async () => {
    wrap(<SpotMapEditor roomId="r1" />);
    const toggle = screen.getByRole('switch');
    await userEvent.click(toggle);
    await waitFor(() =>
      expect(spotsUpdate).toHaveBeenCalledWith(
        's1',
        expect.objectContaining({ bookable: false }),
      ),
    );
  });
});
