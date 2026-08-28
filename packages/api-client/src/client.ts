import type { Http } from './http';
import type {
  Announcement,
  AppNotification,
  Booking,
  BookingsPerClassRow,
  CancelBookingResult,
  ClassInstance,
  ClassTemplate,
  DateRange,
  EventItem,
  EventRsvp,
  Instructor,
  Paginated,
  Promotion,
  RateReport,
  Room,
  RoomSpot,
  SiteContent,
  SpotMapEntry,
  StudioPackage,
  StudioSettings,
  SubmitWaiverInput,
  Tokens,
  UserPublic,
  WaiverSubmission,
} from './types';

function qs(params: object): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
  );
}

export interface BookInput {
  classInstanceId: string;
  spotId?: string;
  guests?: { name: string; email?: string; spotId?: string }[];
  /** Staff/admin only: book on behalf of this member. */
  memberId?: string;
}

export function createClient(http: Http) {
  return {
    auth: {
      login: (email: string, password: string) =>
        http.post<Tokens>('/auth/login', { email, password }),
      register: (body: { email: string; password: string; fullName: string; phone?: string }) =>
        http.post<Tokens>('/auth/register', body),
      refresh: (refreshToken: string) =>
        http.post<Tokens>('/auth/refresh', { refreshToken }),
    },

    me: {
      get: () => http.get<UserPublic>('/users/me'),
      signWaiver: () => http.post<UserPublic>('/users/me/waiver'),
      update: (body: { fullName?: string; phone?: string }) =>
        http.patch<UserPublic>('/users/me', body),
    },

    users: {
      list: (params: { role?: string; q?: string; page?: number; pageSize?: number } = {}) =>
        http.get<Paginated<UserPublic>>(`/users${qs(params)}`),
    },

    instructors: {
      list: () => http.get<Instructor[]>('/instructors'),
      get: (id: string) => http.get<Instructor>(`/instructors/${id}`),
      create: (body: Partial<Instructor>) => http.post<Instructor>('/instructors', body),
      update: (id: string, body: Partial<Instructor>) =>
        http.patch<Instructor>(`/instructors/${id}`, body),
      remove: (id: string) => http.del<void>(`/instructors/${id}`),
    },

    rooms: {
      list: () => http.get<Room[]>('/rooms'),
      get: (id: string) => http.get<Room>(`/rooms/${id}`),
      create: (body: Partial<Room>) => http.post<Room>('/rooms', body),
      update: (id: string, body: Partial<Room>) => http.patch<Room>(`/rooms/${id}`, body),
      remove: (id: string) => http.del<void>(`/rooms/${id}`),
    },

    spots: {
      listForRoom: (roomId: string) => http.get<RoomSpot[]>(`/rooms/${roomId}/spots`),
      create: (roomId: string, body: Partial<RoomSpot>) =>
        http.post<RoomSpot>(`/rooms/${roomId}/spots`, body),
      update: (id: string, body: Partial<RoomSpot>) => http.patch<RoomSpot>(`/spots/${id}`, body),
      remove: (id: string) => http.del<void>(`/spots/${id}`),
    },

    classTemplates: {
      list: () => http.get<ClassTemplate[]>('/class-templates'),
      get: (id: string) => http.get<ClassTemplate>(`/class-templates/${id}`),
      getBySlug: (slug: string) =>
        http.get<ClassTemplate>(`/class-templates/by-slug/${slug}`),
      create: (body: unknown) => http.post<ClassTemplate>('/class-templates', body),
      update: (id: string, body: unknown) => http.patch<ClassTemplate>(`/class-templates/${id}`, body),
      deactivate: (id: string) => http.patch<ClassTemplate>(`/class-templates/${id}/deactivate`),
    },

    classInstances: {
      list: (filters: { instructorId?: string; roomId?: string; from?: string; to?: string } = {}) =>
        http.get<ClassInstance[]>(`/class-instances${qs(filters)}`),
      get: (id: string) => http.get<ClassInstance>(`/class-instances/${id}`),
      spots: (id: string) => http.get<SpotMapEntry[]>(`/class-instances/${id}/spots`),
      create: (body: unknown) => http.post<ClassInstance>('/class-instances', body),
      update: (id: string, body: unknown) => http.patch<ClassInstance>(`/class-instances/${id}`, body),
      cancel: (id: string) => http.patch<ClassInstance>(`/class-instances/${id}/cancel`),
      generate: (templateId: string, throughDate: string) =>
        http.post<ClassInstance[]>(`/class-instances/generate/${templateId}`, { throughDate }),
    },

    bookings: {
      book: (body: BookInput) => http.post<Booking[]>('/bookings', body),
      cancel: (id: string) => http.del<CancelBookingResult>(`/bookings/${id}`),
      acceptOffer: (id: string) => http.post<Booking>(`/bookings/${id}/accept-offer`),
      mine: () => http.get<Booking[]>('/bookings/me'),
      forClass: (classInstanceId: string) =>
        http.get<Booking[]>(`/bookings/class/${classInstanceId}`),
    },

    attendance: {
      checkIn: (bookingId: string) => http.patch<Booking>(`/attendance/${bookingId}/check-in`),
      markNoShow: (bookingId: string) => http.patch<Booking>(`/attendance/${bookingId}/no-show`),
    },

    reports: {
      bookingsPerClass: (range: DateRange = {}) =>
        http.get<BookingsPerClassRow[]>(`/reports/bookings-per-class${qs(range)}`),
      attendanceRate: (range: DateRange = {}) =>
        http.get<RateReport>(`/reports/attendance-rate${qs(range)}`),
      noShowRate: (range: DateRange = {}) =>
        http.get<RateReport>(`/reports/no-show-rate${qs(range)}`),
    },

    announcements: {
      list: () => http.get<Announcement[]>('/announcements'),
      create: (body: { title: string; body: string }) =>
        http.post<Announcement>('/announcements', body),
      remove: (id: string) => http.del<void>(`/announcements/${id}`),
    },

    settings: {
      get: () => http.get<StudioSettings>('/settings'),
      update: (body: Partial<StudioSettings>) => http.patch<StudioSettings>('/settings', body),
    },

    events: {
      list: () => http.get<EventItem[]>('/events'),
      adminList: () => http.get<EventItem[]>('/events/admin/all'),
      get: (slug: string) => http.get<EventItem>(`/events/${slug}`),
      create: (body: unknown) => http.post<EventItem>('/events', body),
      update: (id: string, body: unknown) =>
        http.patch<EventItem>(`/events/${id}`, body),
      remove: (id: string) => http.del<void>(`/events/${id}`),
      rsvp: (id: string, guests = 0) =>
        http.post<EventRsvp>(`/events/${id}/rsvp`, { guests }),
      cancelRsvp: (id: string) => http.del<void>(`/events/${id}/rsvp`),
      myRsvps: () => http.get<EventRsvp[]>('/events/me/rsvps'),
    },

    promotions: {
      list: () => http.get<Promotion[]>('/promotions'),
      adminList: () => http.get<Promotion[]>('/promotions/admin/all'),
      get: (slug: string) => http.get<Promotion>(`/promotions/${slug}`),
      create: (body: unknown) => http.post<Promotion>('/promotions', body),
      update: (id: string, body: unknown) =>
        http.patch<Promotion>(`/promotions/${id}`, body),
      remove: (id: string) => http.del<void>(`/promotions/${id}`),
    },

    siteContent: {
      get: () => http.get<SiteContent>('/site-content'),
      update: (key: string, data: Record<string, unknown>) =>
        http.patch<{ key: string; data: Record<string, unknown> }>(
          `/site-content/${key}`,
          { data },
        ),
    },

    packages: {
      list: () => http.get<StudioPackage[]>('/packages'),
      adminList: () => http.get<StudioPackage[]>('/packages/admin/all'),
      get: (slug: string) => http.get<StudioPackage>(`/packages/${slug}`),
      create: (body: unknown) => http.post<StudioPackage>('/packages', body),
      update: (id: string, body: unknown) =>
        http.patch<StudioPackage>(`/packages/${id}`, body),
      remove: (id: string) => http.del<void>(`/packages/${id}`),
    },

    waivers: {
      submit: (body: SubmitWaiverInput) =>
        http.post<WaiverSubmission>('/waivers', body),
      mine: () => http.get<WaiverSubmission | null>('/waivers/me'),
      list: () => http.get<WaiverSubmission[]>('/waivers'),
      getForUser: (userId: string) =>
        http.get<WaiverSubmission>(`/waivers/${userId}`),
    },

    notifications: {
      list: () => http.get<AppNotification[]>('/notifications'),
      markRead: (id: string) =>
        http.patch<void>(`/notifications/${id}/read`),
      markAllRead: () => http.post<void>('/notifications/read-all', {}),
    },
  };
}

export type Client = ReturnType<typeof createClient>;
