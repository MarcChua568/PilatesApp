import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { EventRsvp } from './entities/event-rsvp.entity';

describe('EventsService', () => {
  let service: EventsService;
  let dataSourceMock: { transaction: jest.Mock };

  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'e1', ...data })),
    delete: jest.fn(() => Promise.resolve({ affected: 1 })),
  };
  const rsvpRepoMock = { findOne: jest.fn() };

  // A manager that fakes the pessimistic-lock query builder + entity ops.
  function managerFor(event: Partial<Event>, existingRsvp: EventRsvp | null) {
    const saved: any[] = [];
    return {
      saved,
      createQueryBuilder: () => ({
        setLock: () => ({
          where: () => ({ getOne: () => Promise.resolve(event) }),
        }),
      }),
      findOne: jest.fn(() => Promise.resolve(existingRsvp)),
      create: (_e: unknown, data: object) => data,
      merge: (_e: unknown, a: object, b: object) => ({ ...a, ...b }),
      save: jest.fn((row: any) => {
        saved.push(row);
        return Promise.resolve({ id: 'r1', ...row });
      }),
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSourceMock = { transaction: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useValue: repoMock },
        { provide: getRepositoryToken(EventRsvp), useValue: rsvpRepoMock },
        { provide: DataSource, useValue: dataSourceMock },
      ],
    }).compile();
    service = moduleRef.get(EventsService);
  });

  it('findBySlug throws when the event is missing or unpublished', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.findBySlug('ghost')).rejects.toThrow(NotFoundException);
  });

  it('rsvp seats a member and bumps the count', async () => {
    const event = { id: 'e1', capacity: 2, rsvpCount: 0 } as Partial<Event>;
    const manager = managerFor(event, null);
    dataSourceMock.transaction.mockImplementation((cb: any) =>
      cb(manager),
    );

    await service.rsvp('e1', 'u1', 0);
    expect(event.rsvpCount).toBe(1);
  });

  it('rsvp rejects once the event is full', async () => {
    const event = { id: 'e1', capacity: 2, rsvpCount: 2 } as Partial<Event>;
    const manager = managerFor(event, null);
    dataSourceMock.transaction.mockImplementation((cb: any) =>
      cb(manager),
    );

    await expect(service.rsvp('e1', 'u3', 0)).rejects.toThrow(ConflictException);
    expect(event.rsvpCount).toBe(2);
  });

  it('rsvp adjusts the count when an existing rsvp changes guest size', async () => {
    const event = { id: 'e1', capacity: 10, rsvpCount: 1 } as Partial<Event>;
    const existing = { id: 'r1', eventId: 'e1', userId: 'u1', guests: 0 } as EventRsvp;
    const manager = managerFor(event, existing);
    dataSourceMock.transaction.mockImplementation((cb: any) =>
      cb(manager),
    );

    await service.rsvp('e1', 'u1', 2); // was 1 seat, now 3 → +2
    expect(event.rsvpCount).toBe(3);
  });
});
