import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NoShowSweepService } from './no-show-sweep.service';
import { Booking } from '../bookings/entities/booking.entity';
import { CapacityService } from '../bookings/capacity.service';
import { BookingStatus } from '../common/enums/booking-status.enum';

describe('NoShowSweepService', () => {
  let service: NoShowSweepService;
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };
  const repoMock = {
    createQueryBuilder: jest.fn(() => qb),
    update: jest.fn().mockResolvedValue({}),
  };
  const capacityServiceMock = { lapseExpiredOffers: jest.fn().mockResolvedValue(0) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NoShowSweepService,
        { provide: getRepositoryToken(Booking), useValue: repoMock },
        { provide: CapacityService, useValue: capacityServiceMock },
      ],
    }).compile();
    service = moduleRef.get(NoShowSweepService);
  });

  it('marks stale booked bookings as no-show', async () => {
    qb.getRawMany.mockResolvedValueOnce([{ id: 'b1' }, { id: 'b2' }]);
    const count = await service.sweepNoShows(new Date());
    expect(count).toBe(2);
    expect(repoMock.update).toHaveBeenCalledWith(
      expect.anything(),
      { status: BookingStatus.NO_SHOW },
    );
  });

  it('does nothing when there are no stale bookings', async () => {
    qb.getRawMany.mockResolvedValueOnce([]);
    const count = await service.sweepNoShows(new Date());
    expect(count).toBe(0);
    expect(repoMock.update).not.toHaveBeenCalled();
  });
});
