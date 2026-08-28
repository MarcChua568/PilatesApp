import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const repoMock = {
    create: jest.fn((d) => d),
    save: jest.fn((d) => Promise.resolve({ id: 'n1', ...d })),
    find: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  it('create persists a notification for the user', async () => {
    const n = await service.create('u1', 'booked', "You're booked", 'Reformer Flow');
    expect(n).toMatchObject({ userId: 'u1', type: 'booked' });
  });

  it('safeCreate swallows repository failures', async () => {
    repoMock.save.mockRejectedValueOnce(new Error('db down'));
    await expect(
      service.safeCreate('u1', 'welcome', 'Welcome', 'Hi'),
    ).resolves.toBeUndefined();
  });

  it('listForUser caps at 50 newest-first', async () => {
    repoMock.find.mockResolvedValueOnce([]);
    await service.listForUser('u1');
    expect(repoMock.find).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  });
});
