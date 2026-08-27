import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RosterTable } from './RosterTable';
import type { Booking } from '@pilates/api-client';

const base: Booking = {
  id: 'b1',
  memberId: 'm1',
  bookedById: 'm1',
  guestName: null,
  guestEmail: null,
  classInstanceId: 'ci1',
  spotId: null,
  status: 'booked',
  waitlistPosition: null,
  promotionOfferedAt: null,
  promotionOfferExpiresAt: null,
  bookedAt: '2026-09-01T00:00:00Z',
  cancelledAt: null,
  checkedInAt: null,
  checkedInById: null,
  member: {
    id: 'm1',
    fullName: 'Ann Booker',
    email: 'ann@x.com',
    phone: null,
    role: 'member',
    healthWaiverSignedAt: '2020-01-01',
    createdAt: '2020-01-01',
  },
};

describe('RosterTable', () => {
  it('splits booked / waitlisted / resolved and wires actions', async () => {
    const onCheckIn = vi.fn();
    render(
      <RosterTable
        bookings={[
          base,
          { ...base, id: 'b2', status: 'waitlisted', waitlistPosition: 1, member: { ...base.member!, fullName: 'Wade Wait' } },
          { ...base, id: 'b3', status: 'no_show', member: { ...base.member!, fullName: 'Nora NoShow' } },
        ]}
        onCheckIn={onCheckIn}
        onNoShow={vi.fn()}
        onCancel={vi.fn()}
        isMutating={false}
      />,
    );

    expect(screen.getByText('Booked · 1')).toBeInTheDocument();
    expect(screen.getByText('Waitlist · 1')).toBeInTheDocument();
    expect(screen.getByText('Resolved · 1')).toBeInTheDocument();
    expect(screen.getByText('Nora NoShow')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Check in' }));
    expect(onCheckIn).toHaveBeenCalledWith('b1');
  });

  it('shows spot column only for assigned-spot rooms', () => {
    const { rerender } = render(
      <RosterTable
        bookings={[base]}
        onCheckIn={vi.fn()}
        onNoShow={vi.fn()}
        onCancel={vi.fn()}
        isMutating={false}
      />,
    );
    expect(screen.queryByText('Spot')).not.toBeInTheDocument();

    rerender(
      <RosterTable
        bookings={[{ ...base, spot: { id: 's1', roomId: 'r1', label: '3', positionGroup: null, sortOrder: 3, bookable: true, active: true } }]}
        room={{ id: 'r1', name: 'A', notes: null, hasAssignedSpots: true, createdAt: '', updatedAt: '' }}
        onCheckIn={vi.fn()}
        onNoShow={vi.fn()}
        onCancel={vi.fn()}
        isMutating={false}
      />,
    );
    expect(screen.getByText('Spot')).toBeInTheDocument();
    expect(screen.getByText('Spot 3')).toBeInTheDocument();
  });
});
