export type Role = 'member' | 'staff' | 'admin' | 'superadmin';

// Admin-portal sections grantable to a STAFF/ADMIN user. Keep in sync with
// apps/api/src/common/enums/role.enum.ts's ADMIN_PERMISSIONS.
export const ADMIN_PERMISSIONS = [
  'schedule',
  'classes',
  'instructors',
  'rooms',
  'events',
  'promotions',
  'pricing',
  'shop',
  'site-content',
  'waivers',
  'reports',
  'announcements',
  'settings',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
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
  permissions: string[];
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
  specialties: string[];
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
  slug: string;
  classType: ClassType;
  typeLabel: string | null;
  description: string | null;
  heroImageUrl: string | null;
  longDescription: string | null;
  whatToBring: string[];
  whoItsFor: string | null;
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

// ---- MILE brand site ----

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  coverImageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  hostInstructorId: string | null;
  hostInstructor?: Instructor | null;
  pricePhp: number;
  capacity: number | null;
  rsvpCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventRsvp {
  id: string;
  eventId: string;
  userId: string;
  guests: number;
  createdAt: string;
  updatedAt: string;
  event?: EventItem;
}

export interface Promotion {
  id: string;
  headline: string;
  body: string;
  imageUrl: string | null;
  ctaLabel: string;
  ctaHref: string;
  landingSlug: string | null;
  showInTopBar: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SiteContent = Record<string, Record<string, unknown>>;

export type PackageKind =
  | 'intro'
  | 'single'
  | 'pack'
  | 'membership'
  | 'workshop';

export interface StudioPackage {
  id: string;
  name: string;
  slug: string;
  kind: PackageKind;
  pricePhp: number;
  credits: number | null;
  validityDays: number | null;
  blurb: string;
  perks: string[];
  featured: boolean;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'apparel'
  | 'grip-socks'
  | 'wellness'
  | 'merch'
  | 'other';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  pricePhp: number | null;
  imageUrl: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
  featured: boolean;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreditTransactionType =
  | 'purchase'
  | 'gift_sent'
  | 'gift_received'
  | 'redeemed'
  | 'refund';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  counterpartyUserId: string | null;
  note: string | null;
  createdAt: string;
}

export interface CreditsSummary {
  balance: number;
  transactions: CreditTransaction[];
}

export interface WaiverSubmission {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes: string | null;
  acceptedTerms: boolean;
  signature: string;
  submittedAt: string;
  user?: UserPublic;
}

export interface SubmitWaiverInput {
  fullName: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalNotes?: string;
  acceptedTerms: boolean;
  signature: string;
}

export type NotificationType =
  | 'booked'
  | 'waitlist_promoted'
  | 'reminder'
  | 'cancelled'
  | 'welcome'
  | 'event_rsvp'
  | 'gift_received';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}
