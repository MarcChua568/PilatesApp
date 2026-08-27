import { describe, it, expect } from 'vitest';
import { availabilityFor } from './availability';
import type { Booking, ClassInstance } from '@pilates/api-client';

const instance = (over: Partial<ClassInstance> = {}): ClassInstance => ({
  id: 'ci1',
  templateId: null,
  instructorId: 'i1',
  roomId: 'r1',
  classType: 'reformer',
  name: 'Reformer Flow',
  description: null,
  durationMinutes: 50,
  intensityLevel: 'intermediate',
  startTime: '2026-09-10T18:00:00Z',
  bookableFrom: null,
  capacity: 10,
  bookedCount: 5,
  substitute: false,
  status: 'scheduled',
  createdAt: '',
  updatedAt: '',
  ...over,
});

const booking = (over: Partial<Booking>): Booking => ({
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
  bookedAt: '',
  cancelledAt: null,
  checkedInAt: null,
  checkedInById: null,
  ...over,
});

describe('availabilityFor', () => {
  it('open with spotsLeft when under capacity and not booked', () => {
    expect(availabilityFor(instance(), [])).toEqual({
      state: 'open',
      spotsLeft: 5,
    });
  });

  it('full when at capacity and not booked', () => {
    expect(availabilityFor(instance({ bookedCount: 10 }), [])).toMatchObject({
      state: 'full',
      spotsLeft: 0,
    });
  });

  it('booked when the member holds a booked reservation', () => {
    expect(
      availabilityFor(instance({ bookedCount: 10 }), [booking({})]),
    ).toMatchObject({ state: 'booked', bookingId: 'b1' });
  });

  it('waitlisted (no offer) shows the position', () => {
    expect(
      availabilityFor(instance({ bookedCount: 10 }), [
        booking({ status: 'waitlisted', waitlistPosition: 2 }),
      ]),
    ).toMatchObject({ state: 'waitlisted', waitlistPosition: 2 });
  });

  it('offered when waitlisted with a promotion offer', () => {
    expect(
      availabilityFor(instance({ bookedCount: 10 }), [
        booking({
          status: 'waitlisted',
          waitlistPosition: 1,
          promotionOfferedAt: '2026-09-10T16:00:00Z',
        }),
      ]),
    ).toMatchObject({ state: 'offered' });
  });
});
