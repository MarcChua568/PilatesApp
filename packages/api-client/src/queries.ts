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
  classTemplateBySlug: (slug: string) =>
    ['class-templates', 'by-slug', slug] as const,
  events: ['events'] as const,
  adminEvents: ['events', 'admin'] as const,
  event: (slug: string) => ['events', slug] as const,
  promotions: ['promotions'] as const,
  adminPromotions: ['promotions', 'admin'] as const,
  promotion: (slug: string) => ['promotions', slug] as const,
  siteContent: ['site-content'] as const,
  packages: ['packages'] as const,
  adminPackages: ['packages', 'admin'] as const,
  studioPackage: (slug: string) => ['packages', slug] as const,
  myWaiver: ['waivers', 'me'] as const,
  waivers: ['waivers'] as const,
  notifications: ['notifications'] as const,
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

  // ---- MILE brand site ----

  const useClassTemplateBySlug = (slug: string | undefined) =>
    useQuery({
      queryKey: queryKeys.classTemplateBySlug(slug ?? ''),
      queryFn: () => api.classTemplates.getBySlug(slug as string),
      enabled: !!slug,
    });

  const useEvents = () =>
    useQuery({ queryKey: queryKeys.events, queryFn: api.events.list });

  const useAdminEvents = () =>
    useQuery({ queryKey: queryKeys.adminEvents, queryFn: api.events.adminList });

  const useEvent = (slug: string | undefined) =>
    useQuery({
      queryKey: queryKeys.event(slug ?? ''),
      queryFn: () => api.events.get(slug as string),
      enabled: !!slug,
    });

  const useRsvpMutation = (slug: string) => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, guests }: { id: string; guests?: number }) =>
        api.events.rsvp(id, guests ?? 0),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKeys.event(slug) });
        qc.invalidateQueries({ queryKey: queryKeys.events });
        qc.invalidateQueries({ queryKey: queryKeys.notifications });
      },
    });
  };

  const useAdminEventMutations = () => {
    const qc = useQueryClient();
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.events });
      qc.invalidateQueries({ queryKey: queryKeys.adminEvents });
    };
    return {
      create: useMutation({
        mutationFn: (body: unknown) => api.events.create(body),
        onSuccess: invalidate,
      }),
      update: useMutation({
        mutationFn: ({ id, body }: { id: string; body: unknown }) =>
          api.events.update(id, body),
        onSuccess: invalidate,
      }),
      remove: useMutation({
        mutationFn: (id: string) => api.events.remove(id),
        onSuccess: invalidate,
      }),
    };
  };

  const usePromotions = () =>
    useQuery({ queryKey: queryKeys.promotions, queryFn: api.promotions.list });

  const useAdminPromotions = () =>
    useQuery({
      queryKey: queryKeys.adminPromotions,
      queryFn: api.promotions.adminList,
    });

  const usePromotion = (slug: string | undefined) =>
    useQuery({
      queryKey: queryKeys.promotion(slug ?? ''),
      queryFn: () => api.promotions.get(slug as string),
      enabled: !!slug,
    });

  const useAdminPromotionMutations = () => {
    const qc = useQueryClient();
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.promotions });
      qc.invalidateQueries({ queryKey: queryKeys.adminPromotions });
    };
    return {
      create: useMutation({
        mutationFn: (body: unknown) => api.promotions.create(body),
        onSuccess: invalidate,
      }),
      update: useMutation({
        mutationFn: ({ id, body }: { id: string; body: unknown }) =>
          api.promotions.update(id, body),
        onSuccess: invalidate,
      }),
      remove: useMutation({
        mutationFn: (id: string) => api.promotions.remove(id),
        onSuccess: invalidate,
      }),
    };
  };

  const useSiteContent = () =>
    useQuery({
      queryKey: queryKeys.siteContent,
      queryFn: api.siteContent.get,
    });

  const useUpdateSiteContentMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({
        key,
        data,
      }: {
        key: string;
        data: Record<string, unknown>;
      }) => api.siteContent.update(key, data),
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: queryKeys.siteContent }),
    });
  };

  const usePackages = () =>
    useQuery({ queryKey: queryKeys.packages, queryFn: api.packages.list });

  const useAdminPackages = () =>
    useQuery({
      queryKey: queryKeys.adminPackages,
      queryFn: api.packages.adminList,
    });

  const usePackage = (slug: string | undefined) =>
    useQuery({
      queryKey: queryKeys.studioPackage(slug ?? ''),
      queryFn: () => api.packages.get(slug as string),
      enabled: !!slug,
    });

  const useAdminPackageMutations = () => {
    const qc = useQueryClient();
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: queryKeys.packages });
      qc.invalidateQueries({ queryKey: queryKeys.adminPackages });
    };
    return {
      create: useMutation({
        mutationFn: (body: unknown) => api.packages.create(body),
        onSuccess: invalidate,
      }),
      update: useMutation({
        mutationFn: ({ id, body }: { id: string; body: unknown }) =>
          api.packages.update(id, body),
        onSuccess: invalidate,
      }),
      remove: useMutation({
        mutationFn: (id: string) => api.packages.remove(id),
        onSuccess: invalidate,
      }),
    };
  };

  const useMyWaiver = () =>
    useQuery({ queryKey: queryKeys.myWaiver, queryFn: api.waivers.mine });

  const useWaivers = () =>
    useQuery({ queryKey: queryKeys.waivers, queryFn: api.waivers.list });

  const useSubmitWaiverMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (body: Parameters<typeof api.waivers.submit>[0]) =>
        api.waivers.submit(body),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKeys.me });
        qc.invalidateQueries({ queryKey: queryKeys.myWaiver });
      },
    });
  };

  const useNotifications = () =>
    useQuery({
      queryKey: queryKeys.notifications,
      queryFn: api.notifications.list,
    });

  const useMarkNotificationReadMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => api.notifications.markRead(id),
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: queryKeys.notifications }),
    });
  };

  const useMarkAllNotificationsReadMutation = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: () => api.notifications.markAllRead(),
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: queryKeys.notifications }),
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
    useClassTemplateBySlug,
    useEvents,
    useAdminEvents,
    useEvent,
    useRsvpMutation,
    useAdminEventMutations,
    usePromotions,
    useAdminPromotions,
    usePromotion,
    useAdminPromotionMutations,
    useSiteContent,
    useUpdateSiteContentMutation,
    usePackages,
    useAdminPackages,
    usePackage,
    useAdminPackageMutations,
    useMyWaiver,
    useWaivers,
    useSubmitWaiverMutation,
    useNotifications,
    useMarkNotificationReadMutation,
    useMarkAllNotificationsReadMutation,
  };
}

export type Hooks = ReturnType<typeof makeHooks>;
