export type Role = 'member' | 'staff' | 'admin';
export type ClassType = 'reformer' | 'mat' | 'barre' | 'other';
export type IntensityLevel = 'beginner' | 'intermediate' | 'advanced';
export type BookingStatus =
  | 'booked'
  | 'cancelled'
  | 'waitlisted'
  | 'attended'
  | 'no_show';
export type ClassInstanceStatus = 'scheduled' | 'cancelled';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  healthWaiverSignedAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
}

export interface Instructor {
  id: string;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  notes: string | null;
  hasAssignedSpots: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSpot {
  id: string;
  roomId: string;
  label: string;
  positionGroup: string | null;
  sortOrder: number;
  bookable: boolean;
  active: boolean;
}

export interface RecurrenceRule {
  daysOfWeek: number[];
  startTime: string;
  startDate: string;
  endDate: string;
}

export interface ClassTemplate {
  id: string;
  name: string;
  classType: ClassType;
  description: string | null;
  instructorId: string;
  roomId: string;
  durationMinutes: number;
  intensityLevel: IntensityLevel;
  capacity: number;
  recurrenceRule: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassInstance {
  id: string;
  templateId: string | null;
  instructorId: string;
  roomId: string;
  classType: ClassType;
  name: string;
  description: string | null;
  durationMinutes: number;
  intensityLevel: IntensityLevel;
  startTime: string;
  bookableFrom: string | null;
  capacity: number;
  bookedCount: number;
  substitute: boolean;
  status: ClassInstanceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  memberId: string | null;
  bookedById: string;
  guestName: string | null;
  guestEmail: string | null;
  classInstanceId: string;
  spotId: string | null;
  status: BookingStatus;
  waitlistPosition: number | null;
  promotionOfferedAt: string | null;
  promotionOfferExpiresAt: string | null;
  bookedAt: string;
  cancelledAt: string | null;
  checkedInAt: string | null;
  checkedInById: string | null;
  member?: UserPublic | null;
  spot?: RoomSpot | null;
}

export type CancelBookingResult = Booking & { wasLateCancellation: boolean };

export interface Announcement {
  id: string;
  title: string;
  body: string;
  createdById: string;
  createdAt: string;
}

export interface StudioSettings {
  id: number;
  cancellationWindowHours: number;
  waitlistAutoPromoteCutoffHours: number;
  waitlistOfferTtlMinutes: number;
  maxSeatsPerBooking: number;
  updatedAt: string;
}

export type SpotState = 'open' | 'taken' | 'mine' | 'blocked';
export interface SpotMapEntry {
  id: string;
  label: string;
  positionGroup: string | null;
  sortOrder: number;
  state: SpotState;
}

export interface BookingsPerClassRow {
  classInstanceId: string;
  className: string;
  startTime: string;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  attendedCount: number;
  noShowCount: number;
}

export interface RateReport {
  attended?: number;
  noShow?: number;
  totalResolved: number;
  rate: number;
}

export interface DateRange {
  from?: string;
  to?: string;
}
