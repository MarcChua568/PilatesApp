import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import type { Client, BookInput } from './client';
import type { DateRange } from './types';

export const queryKeys = {
  me: ['me'] as const,
  instructors: ['instructors'] as const,
  rooms: ['rooms'] as const,
  roomSpots: (roomId: string) => ['rooms', roomId, 'spots'] as const,
  classTemplates: ['class-templates'] as const,
  classInstances: (filters: Record<string, unknown> = {}) =>
    ['class-instances', filters] as const,
  classInstance: (id: string) => ['class-instances', id] as const,
  spotMap: (id: string) => ['class-instances', id, 'spots'] as const,
  bookingsForClass: (id: string) => ['bookings', 'class', id] as const,
  myBookings: ['bookings', 'me'] as const,
  members: (params: Record<string, unknown>) => ['users', params] as const,
  announcements: ['announcements'] as const,
  settings: ['settings'] as const,
  reports: (range: DateRange) => ['reports', range] as const,
};

/**
 * Invalidate everything that a booking/attendance/cancel mutation can affect:
 * the class's roster, its spot map, the schedule lists, and the acting user's
 * own bookings.
 */
export function invalidateBookingScope(
  qc: QueryClient,
  classInstanceId: string,
) {
  qc.invalidateQueries({ queryKey: queryKeys.bookingsForClass(classInstanceId) });
  qc.invalidateQueries({ queryKey: queryKeys.spotMap(classInstanceId) });
  qc.invalidateQueries({ queryKey: queryKeys.classInstance(classInstanceId) });
  qc.invalidateQueries({ queryKey: ['class-instances'] });
  qc.invalidateQueries({ queryKey: queryKeys.myBookings });
}

export function makeHooks(api: Client) {
  const useInstructors = () =>
    useQuery({ queryKey: queryKeys.instructors, queryFn: api.instructors.list });

  const useRooms = () =>
    useQuery({ queryKey: queryKeys.rooms, queryFn: api.rooms.list });

  const useRoomSpots = (roomId: string | undefined) =>
    useQuery({
      queryKey: queryKeys.roomSpots(roomId ?? ''),
      queryFn: () => api.spots.listForRoom(roomId as string),
      enabled: !!roomId,
    });

  const useClassTemplates = () =>
    useQuery({ queryKey: queryKeys.classTemplates, queryFn: api.classTemplates.list });

  const useClassInstances = (filters: Parameters<Client['classInstances']['list']>[0] = {}) =>
    useQuery({
      queryKey: queryKeys.classInstances(filters),
      queryFn: () => api.classInstances.list(filters),
    });

  const useClassInstance = (id: string | undefined) =>
    useQuery({
      queryKey: queryKeys.classInstance(id ?? ''),
      queryFn: () => api.classInstances.get(id as string),
      enabled: !!id,
    });

  const useBookingsForClass = (id: string | undefined) =>
    useQuery({
      queryKey: queryKeys.bookingsForClass(id ?? ''),
      queryFn: () => api.bookings.forClass(id as string),
      enabled: !!id,
    });

  const useMyBookings = () =>
    useQuery({ queryKey: queryKeys.myBookings, queryFn: api.bookings.mine });

  const useAnnouncements = () =>
    useQuery({ queryKey: queryKeys.announcements, queryFn: api.announcements.list });

  const useSettings = () =>
    useQuery({ queryKey: queryKeys.settings, queryFn: api.settings.get });

  const useReports = (range: DateRange) =>
    useQuery({
      queryKey: queryKeys.reports(range),
      queryFn: async () => ({
        attendance: await api.reports.attendanceRate(range),
        noShow: await api.reports.noShowRate(range),
        perClass: await api.reports.bookingsPerClass(range),
      }),
    });

  const useBookMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (input: BookInput) => api.bookings.book(input),
      onSuccess: (_data, input) => invalidateBookingScope(qc, input.classInstanceId),
    });
  };

  const useCancelBookingMutation = (classInstanceId: string) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (bookingId: string) => api.bookings.cancel(bookingId),
      onSuccess: () => invalidateBookingScope(qc, classInstanceId),
    });
  };

  const useSpotMap = (id: string | undefined) =>
    useQuery({
      queryKey: queryKeys.spotMap(id ?? ''),
      queryFn: () => api.classInstances.spots(id as string),
      enabled: !!id,
    });

  const useSignWaiverMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => api.me.signWaiver(),
      onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
    });
  };

  const useAcceptOfferMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (bookingId: string) => api.bookings.acceptOffer(bookingId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKeys.myBookings });
        qc.invalidateQueries({ queryKey: ['class-instances'] });
      },
    });
  };

  const useCancelMyBookingMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (bookingId: string) => api.bookings.cancel(bookingId),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKeys.myBookings });
        qc.invalidateQueries({ queryKey: ['class-instances'] });
      },
    });
  };

  const useAttendanceMutation = (classInstanceId: string) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ bookingId, kind }: { bookingId: string; kind: 'checkIn' | 'noShow' }) =>
        kind === 'checkIn'
          ? api.attendance.checkIn(bookingId)
          : api.attendance.markNoShow(bookingId),
      onSuccess: () => invalidateBookingScope(qc, classInstanceId),
    });
  };

  return {
    useInstructors,
    useRooms,
    useRoomSpots,
    useClassTemplates,
    useClassInstances,
    useClassInstance,
    useBookingsForClass,
    useMyBookings,
    useAnnouncements,
    useSettings,
    useReports,
    useBookMutation,
    useCancelBookingMutation,
    useAttendanceMutation,
    useSpotMap,
    useSignWaiverMutation,
    useAcceptOfferMutation,
    useCancelMyBookingMutation,
  };
}

export type Hooks = ReturnType<typeof makeHooks>;
