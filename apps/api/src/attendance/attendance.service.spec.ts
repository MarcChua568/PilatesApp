import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Booking } from '../bookings/entities/booking.entity';
import { CapacityService } from '../bookings/capacity.service';
import { BookingStatus } from '../common/enums/booking-status.enum';

describe('AttendanceService', () => {
  let service: AttendanceService;
  const repoMock = {
    findOne: jest.fn(),
    save: jest.fn((data) => Promise.resolve(data)),
  };
  const capacityServiceMock = { recordNoShow: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getRepositoryToken(Booking), useValue: repoMock },
        { provide: CapacityService, useValue: capacityServiceMock },
      ],
    }).compile();
    service = moduleRef.get(AttendanceService);
  });

  it('checks in a booked member', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'b1',
      status: BookingStatus.BOOKED,
    });
    const result = await service.checkIn('b1', 'staff1');
    expect(result.status).toBe(BookingStatus.ATTENDED);
    expect(result.checkedInById).toBe('staff1');
  });

  it('rejects checking in a waitlisted booking', async () => {
    repoMock.findOne.mockResolvedValueOnce({
      id: 'b1',
      status: BookingStatus.WAITLISTED,
    });
    await expect(service.checkIn('b1', 'staff1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws NotFoundException for a missing booking on check-in', async () => {
    repoMock.findOne.mockResolvedValueOnce(null);
    await expect(service.checkIn('missing', 'staff1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('delegates no-show marking to CapacityService.recordNoShow', async () => {
    capacityServiceMock.recordNoShow.mockResolvedValueOnce({
      id: 'b1',
      status: BookingStatus.NO_SHOW,
      checkedInById: 'staff1',
    });
    const result = await service.markNoShow('b1', 'staff1');
    expect(capacityServiceMock.recordNoShow).toHaveBeenCalledWith('b1', 'staff1');
    expect(result.status).toBe(BookingStatus.NO_SHOW);
  });
});
