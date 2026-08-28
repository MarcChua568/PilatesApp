import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SpotPicker } from './SpotPicker';
import type { SpotMapEntry } from '@pilates/api-client';

const spots: SpotMapEntry[] = [
  { id: 's1', label: '1', positionGroup: 'left', sortOrder: 1, state: 'open' },
  { id: 's2', label: '2', positionGroup: 'left', sortOrder: 2, state: 'taken' },
  { id: 's3', label: '3', positionGroup: 'right', sortOrder: 3, state: 'open' },
];

describe('SpotPicker', () => {
  it('groups spots and selects an open one', async () => {
    const onChange = vi.fn();
    render(<SpotPicker spots={spots} value={null} onChange={onChange} />);

    expect(screen.getByText('left')).toBeInTheDocument();
    expect(screen.getByText('right')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '1' }));
    expect(onChange).toHaveBeenCalledWith('s1');
  });

  it('disables taken spots', async () => {
    const onChange = vi.fn();
    render(<SpotPicker spots={spots} value={null} onChange={onChange} />);
    const taken = screen.getByRole('button', { name: '2' });
    expect(taken).toBeDisabled();
    await userEvent.click(taken);
    expect(onChange).not.toHaveBeenCalled();
  });
});
