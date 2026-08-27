import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SettingsService } from './settings.service';
import { StudioSettings } from './entities/studio-settings.entity';

describe('SettingsService', () => {
  let service: SettingsService;
  const repoMock = {
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn((data) => Promise.resolve({ id: 1, ...data })),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.CANCELLATION_WINDOW_HOURS_DEFAULT = '2';
    const moduleRef = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: getRepositoryToken(StudioSettings), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(SettingsService);
  });

  it('creates the singleton row with the env default when missing', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    const settings = await service.get();
    expect(settings.cancellationWindowHours).toBe(2);
  });

  it('returns the existing row without creating a new one', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 1,
      cancellationWindowHours: 3,
    });
    const settings = await service.get();
    expect(settings.cancellationWindowHours).toBe(3);
    expect(repoMock.save).not.toHaveBeenCalled();
  });

  it('updates the cancellation window', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 1,
      cancellationWindowHours: 2,
    });
    const settings = await service.update({ cancellationWindowHours: 4 });
    expect(settings.cancellationWindowHours).toBe(4);
  });

  it('updates multiple settings at once and leaves others untouched', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 1,
      cancellationWindowHours: 2,
      maxSeatsPerBooking: 1,
    });
    const settings = await service.update({
      maxSeatsPerBooking: 5,
      waitlistOfferTtlMinutes: 20,
    });
    expect(settings.maxSeatsPerBooking).toBe(5);
    expect(settings.waitlistOfferTtlMinutes).toBe(20);
    expect(settings.cancellationWindowHours).toBe(2);
  });
});
