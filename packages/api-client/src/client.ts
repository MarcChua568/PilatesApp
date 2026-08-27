import type { Http } from './http';
import type {
  Announcement,
  Booking,
  BookingsPerClassRow,
  CancelBookingResult,
  ClassInstance,
  ClassTemplate,
  DateRange,
  Instructor,
  Paginated,
  RateReport,
  Room,
  RoomSpot,
  SpotMapEntry,
  StudioSettings,
  Tokens,
  UserPublic,
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
      refresh: () => http.post<Tokens>('/auth/refresh'),
    },

    me: {
      get: () => http.get<UserPublic>('/users/me'),
      signWaiver: () => http.post<UserPublic>('/users/me/waiver'),
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
  };
}

export type Client = ReturnType<typeof createClient>;
