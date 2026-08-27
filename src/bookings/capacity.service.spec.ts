import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { SettingsService } from '../settings/settings.service';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { ClassInstanceStatus } from '../common/enums/class-instance-status.enum';

const SETTINGS = {
  cancellationWindowHours: 2,
  waitlistAutoPromoteCutoffHours: 2,
  waitlistOfferTtlMinutes: 30,
  maxSeatsPerBooking: 3,
};

const WAIVER_SIGNED = { id: 'm1', healthWaiverSignedAt: new Date('2020-01-01') };

function futureDate(hoursAhead: number): Date {
  return new Date(Date.now() + hoursAhead * 3_600_000);
}

/**
 * Builds an EntityManager mock. `queue` is a FIFO of return values for each
 * successive query-builder `.getOne()` / repo call in the order the service
 * makes them.
 */
function makeManager(opts: {
  classInstance?: unknown;
  booker?: unknown;
  existingBooking?: unknown;
  room?: unknown;
  lastWaitlisted?: unknown;
  nextWaitlisted?: unknown;
  bookingLookup?: unknown;
  takenSpotCount?: number;
  freeSpot?: unknown;
}) {
  const getOneQueue: unknown[] = [];
  // order the service calls getOne():
  //  book(): 1) lock class instance  2) lastWaitlisted (only if waitlisting)
  //  promote path: 1) next waitlisted
  if (opts.classInstance !== undefined) getOneQueue.push(opts.classInstance);
  if (opts.lastWaitlisted !== undefined) getOneQueue.push(opts.lastWaitlisted);

  const qb: Record<string, jest.Mock> = {
    setLock: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(() =>
      Promise.resolve(getOneQueue.length ? getOneQueue.shift() : null),
    ),
    getCount: jest.fn(() => Promise.resolve(opts.takenSpotCount ?? 0)),
    getRawMany: jest.fn(() => Promise.resolve([])),
  };

  const manager = {
    createQueryBuilder: jest.fn(() => qb),
    findOne: jest.fn((entity: { name: string }, _opts: unknown) => {
      const name = entity.name;
      if (name === 'User') return Promise.resolve(opts.booker ?? WAIVER_SIGNED);
      if (name === 'Room') return Promise.resolve(opts.room ?? null);
      if (name === 'Booking') {
        return Promise.resolve(
          opts.bookingLookup !== undefined
            ? opts.bookingLookup
            : opts.existingBooking ?? null,
        );
      }
      return Promise.resolve(null);
    }),
    find: jest.fn(() => Promise.resolve([])),
    create: jest.fn((_entity: unknown, data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    __qb: qb,
  };
  return manager;
}

describe('CapacityService', () => {
  let service: CapacityService;
  let dataSourceMock: { transaction: jest.Mock };
  const settingsMock = { get: jest.fn().mockResolvedValue(SETTINGS) };

  beforeEach(async () => {
    jest.clearAllMocks();
    settingsMock.get.mockResolvedValue(SETTINGS);
    dataSourceMock = { transaction: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CapacityService,
        { provide: DataSource, useValue: dataSourceMock },
        { provide: SettingsService, useValue: settingsMock },
      ],
    }).compile();
    service = moduleRef.get(CapacityService);
  });

  describe('book', () => {
    it('books a member when under capacity', async () => {
      const manager = makeManager({
        classInstance: {
          id: 'ci1',
          roomId: 'r1',
          capacity: 10,
          bookedCount: 5,
          status: ClassInstanceStatus.SCHEDULED,
          startTime: futureDate(24),
          bookableFrom: null,
        },
      });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      const [booking] = await service.book('m1', { classInstanceId: 'ci1' });

      expect(booking.status).toBe(BookingStatus.BOOKED);
      expect(booking.spotId).toBeNull();
    });

    it('waitlists a lone member when the class is full', async () => {
      const manager = makeManager({
        classInstance: {
          id: 'ci1',
          roomId: 'r1',
          capacity: 10,
          bookedCount: 10,
          status: ClassInstanceStatus.SCHEDULED,
          startTime: futureDate(24),
          bookableFrom: null,
        },
        lastWaitlisted: null,
      });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      const [booking] = await service.book('m1', { classInstanceId: 'ci1' });

      expect(booking.status).toBe(BookingStatus.WAITLISTED);
      expect(booking.waitlistPosition).toBe(1);
    });

    it('rejects a booking when the member has not signed the waiver', async () => {
      const manager = makeManager({
        classInstance: {
          id: 'ci1',
          roomId: 'r1',
          capacity: 10,
          bookedCount: 0,
          status: ClassInstanceStatus.SCHEDULED,
          startTime: futureDate(24),
          bookableFrom: null,
        },
        booker: { id: 'm1', healthWaiverSignedAt: null },
      });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.book('m1', { classInstanceId: 'ci1' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a duplicate active booking', async () => {
      const manager = makeManager({
        classInstance: {
          id: 'ci1',
          roomId: 'r1',
          capacity: 10,
          bookedCount: 0,
          status: ClassInstanceStatus.SCHEDULED,
          startTime: futureDate(24),
          bookableFrom: null,
        },
        existingBooking: { id: 'b0', status: BookingStatus.BOOKED },
      });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.book('m1', { classInstanceId: 'ci1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects booking before bookableFrom', async () => {
      const manager = makeManager({
        classInstance: {
          id: 'ci1',
          roomId: 'r1',
          capacity: 10,
          bookedCount: 0,
          status: ClassInstanceStatus.SCHEDULED,
          startTime: futureDate(48),
          bookableFrom: futureDate(24),
        },
      });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.book('m1', { classInstanceId: 'ci1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('404s for a missing class instance', async () => {
      const manager = makeManager({ classInstance: null });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.book('m1', { classInstanceId: 'missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a party that will not wholly fit', async () => {
      const manager = makeManager({
        classInstance: {
          id: 'ci1',
          roomId: 'r1',
          capacity: 10,
          bookedCount: 9,
          status: ClassInstanceStatus.SCHEDULED,
          startTime: futureDate(24),
          bookableFrom: null,
        },
      });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.book('m1', {
          classInstanceId: 'ci1',
          guests: [{ name: 'Guest A' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('requires a spot for every attendee in an assigned-spot room', async () => {
      const manager = makeManager({
        classInstance: {
          id: 'ci1',
          roomId: 'r1',
          capacity: 10,
          bookedCount: 0,
          status: ClassInstanceStatus.SCHEDULED,
          startTime: futureDate(24),
          bookableFrom: null,
        },
        room: { id: 'r1', hasAssignedSpots: true },
      });
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.book('m1', { classInstanceId: 'ci1' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('cancels a booked reservation and promotes the next waitlisted member (outside cutoff)', async () => {
      const classInstance = {
        id: 'ci1',
        roomId: 'r1',
        capacity: 10,
        bookedCount: 10,
        status: ClassInstanceStatus.SCHEDULED,
        startTime: futureDate(24),
      };
      const nextWaitlisted = {
        id: 'b2',
        status: BookingStatus.WAITLISTED,
        waitlistPosition: 1,
      };
      const qb: Record<string, jest.Mock> = {
        setLock: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getOne: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'b1',
            memberId: 'm1',
            bookedById: 'm1',
            classInstanceId: 'ci1',
            status: BookingStatus.BOOKED,
          })
          .mockResolvedValueOnce(classInstance)
          .mockResolvedValueOnce(nextWaitlisted),
      };
      const manager = {
        createQueryBuilder: jest.fn(() => qb),
        findOne: jest.fn((e: { name: string }) =>
          Promise.resolve(e.name === 'Room' ? { id: 'r1', hasAssignedSpots: false } : null),
        ),
        save: jest.fn((d: unknown) => Promise.resolve(d)),
      };
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      const result = await service.cancel('b1', 'm1');

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.wasLateCancellation).toBe(false);
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'b2',
          status: BookingStatus.BOOKED,
          waitlistPosition: null,
        }),
      );
    });

    it('flags a cancellation inside the window as late but still cancels', async () => {
      const classInstance = {
        id: 'ci1',
        roomId: 'r1',
        capacity: 10,
        bookedCount: 10,
        status: ClassInstanceStatus.SCHEDULED,
        startTime: futureDate(0.5),
      };
      const qb: Record<string, jest.Mock> = {
        setLock: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getOne: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'b1',
            memberId: 'm1',
            bookedById: 'm1',
            classInstanceId: 'ci1',
            status: BookingStatus.BOOKED,
          })
          .mockResolvedValueOnce(classInstance)
          .mockResolvedValueOnce(null), // no waitlist
      };
      const manager = {
        createQueryBuilder: jest.fn(() => qb),
        findOne: jest.fn(() => Promise.resolve(null)),
        save: jest.fn((d: unknown) => Promise.resolve(d)),
      };
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      const result = await service.cancel('b1', 'm1');
      expect(result.wasLateCancellation).toBe(true);
    });
  });

  describe('recordNoShow', () => {
    it('frees the spot and auto-seats the next waitlisted member (outside the offer cutoff)', async () => {
      const classInstance = {
        id: 'ci1',
        roomId: 'r1',
        capacity: 10,
        bookedCount: 10,
        status: ClassInstanceStatus.SCHEDULED,
        startTime: futureDate(24),
      };
      const qb: Record<string, jest.Mock> = {
        setLock: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getOne: jest
          .fn()
          .mockResolvedValueOnce(classInstance)
          .mockResolvedValueOnce({
            id: 'b2',
            status: BookingStatus.WAITLISTED,
            waitlistPosition: 1,
          }),
      };
      const manager = {
        createQueryBuilder: jest.fn(() => qb),
        findOne: jest.fn((e: { name: string }) => {
          if (e.name === 'Booking')
            return Promise.resolve({ id: 'b1', status: BookingStatus.BOOKED });
          if (e.name === 'Room')
            return Promise.resolve({ id: 'r1', hasAssignedSpots: false });
          return Promise.resolve(null);
        }),
        save: jest.fn((d: unknown) => Promise.resolve(d)),
      };
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      const result = await service.recordNoShow('b1', 'staff1');
      expect(result.status).toBe(BookingStatus.NO_SHOW);
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'b2', status: BookingStatus.BOOKED }),
      );
    });

    it('does not free the spot when the class has already started', async () => {
      const classInstance = {
        id: 'ci1',
        roomId: 'r1',
        capacity: 10,
        bookedCount: 10,
        status: ClassInstanceStatus.SCHEDULED,
        startTime: futureDate(-1),
      };
      const qb: Record<string, jest.Mock> = {
        setLock: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn().mockResolvedValueOnce(classInstance),
      };
      const manager = {
        createQueryBuilder: jest.fn(() => qb),
        findOne: jest.fn(() =>
          Promise.resolve({ id: 'b1', status: BookingStatus.BOOKED }),
        ),
        save: jest.fn((d: unknown) => Promise.resolve(d)),
      };
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await service.recordNoShow('b1', 'staff1');
      expect(manager.save).toHaveBeenCalledTimes(1);
    });

    it('rejects a no-show for a booking that is not currently booked', async () => {
      const manager = {
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(() =>
          Promise.resolve({ id: 'b1', status: BookingStatus.WAITLISTED }),
        ),
        save: jest.fn(),
      };
      dataSourceMock.transaction.mockImplementation((cb) => cb(manager));

      await expect(service.recordNoShow('b1', 'staff1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
