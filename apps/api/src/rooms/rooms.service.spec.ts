import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';

describe('RoomsService', () => {
  let service: RoomsService;
  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'r1', ...data })),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RoomsService,
        { provide: getRepositoryToken(Room), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(RoomsService);
  });

  it('creates a room', async () => {
    const result = await service.create({ name: 'Studio A' });
    expect(result.name).toBe('Studio A');
  });

  it('throws NotFoundException when the room does not exist', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
