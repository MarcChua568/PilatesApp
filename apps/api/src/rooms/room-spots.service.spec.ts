import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { RoomSpotsService } from './room-spots.service';
import { RoomSpot } from './entities/room-spot.entity';
import { RoomsService } from './rooms.service';

describe('RoomSpotsService', () => {
  let service: RoomSpotsService;
  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 's1', ...data })),
    delete: jest.fn(),
  };
  const roomsServiceMock = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RoomSpotsService,
        { provide: getRepositoryToken(RoomSpot), useValue: repoMock },
        { provide: RoomsService, useValue: roomsServiceMock },
      ],
    }).compile();
    service = moduleRef.get(RoomSpotsService);
  });

  it('creates a spot under an existing room', async () => {
    roomsServiceMock.findOne.mockResolvedValueOnce({ id: 'r1' });
    const result = await service.create('r1', { label: '12' });
    expect(result.label).toBe('12');
    expect(result.roomId).toBe('r1');
  });

  it('propagates NotFoundException when the room is missing', async () => {
    roomsServiceMock.findOne.mockRejectedValueOnce(new NotFoundException());
    await expect(service.create('missing', { label: '1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws NotFoundException for a missing spot', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
