import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { Announcement } from './entities/announcement.entity';

describe('AnnouncementsService', () => {
  let service: AnnouncementsService;
  const repoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 'a1', ...data })),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: getRepositoryToken(Announcement), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(AnnouncementsService);
  });

  it('stores the creating user id', async () => {
    const result = await service.create(
      { title: 'Closed Monday', body: 'Studio closed for the holiday' },
      'staff1',
    );
    expect(result.createdById).toBe('staff1');
  });

  it('throws NotFoundException for a missing announcement', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});
