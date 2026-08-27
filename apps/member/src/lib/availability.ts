import type { Booking, ClassInstance } from '@pilates/api-client';

export type AvailabilityState =
  | 'open'
  | 'full'
  | 'booked'
  | 'waitlisted'
  | 'offered';

export interface Availability {
  state: AvailabilityState;
  spotsLeft: number;
  bookingId?: string;
  waitlistPosition?: number;
}

/** The member's own status for a class wins over the generic open/full state. */
export function availabilityFor(
  instance: ClassInstance,
  myBookings: Booking[],
): Availability {
  const spotsLeft = Math.max(0, instance.capacity - instance.bookedCount);
  const mine = myBookings.find(
    (b) =>
      b.classInstanceId === instance.id &&
      (b.status === 'booked' || b.status === 'waitlisted'),
  );

  if (mine?.status === 'booked') {
    return { state: 'booked', spotsLeft, bookingId: mine.id };
  }
  if (mine?.status === 'waitlisted') {
    return {
      state: mine.promotionOfferedAt ? 'offered' : 'waitlisted',
      spotsLeft,
      bookingId: mine.id,
      waitlistPosition: mine.waitlistPosition ?? undefined,
    };
  }
  return { state: spotsLeft > 0 ? 'open' : 'full', spotsLeft };
}
