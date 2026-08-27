import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { Booking } from '../bookings/entities/booking.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  const repoMock = { query: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(Booking), useValue: repoMock },
      ],
    }).compile();
    service = moduleRef.get(ReportsService);
  });

  it('computes attendance rate from attended and no_show counts', async () => {
    repoMock.query.mockResolvedValueOnce([{ attended: '8', no_show: '2' }]);
    const result = await service.attendanceRate();
    expect(result).toEqual({ attended: 8, totalResolved: 10, rate: 0.8 });
  });

  it('returns a zero rate when there is no resolved data', async () => {
    repoMock.query.mockResolvedValueOnce([{ attended: '0', no_show: '0' }]);
    const result = await service.attendanceRate();
    expect(result).toEqual({ attended: 0, totalResolved: 0, rate: 0 });
  });

  it('computes no-show rate from the same counts', async () => {
    repoMock.query.mockResolvedValueOnce([{ attended: '8', no_show: '2' }]);
    const result = await service.noShowRate();
    expect(result).toEqual({ noShow: 2, totalResolved: 10, rate: 0.2 });
  });
});
