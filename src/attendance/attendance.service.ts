import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { CapacityService } from '../bookings/capacity.service';
import { BookingStatus } from '../common/enums/booking-status.enum';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
    private readonly capacityService: CapacityService,
  ) {}

  async checkIn(bookingId: string, staffUserId: string): Promise<Booking> {
    const booking = await this.repo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.BOOKED) {
      throw new BadRequestException('Only a booked reservation can be checked in');
    }
    booking.status = BookingStatus.ATTENDED;
    booking.checkedInAt = new Date();
    booking.checkedInById = staffUserId;
    return this.repo.save(booking);
  }

  // Delegates to CapacityService so the "only this module mutates bookedCount"
  // invariant holds — a pre-class no-show frees the spot and promotes the waitlist.
  markNoShow(bookingId: string, staffUserId: string): Promise<Booking> {
    return this.capacityService.recordNoShow(bookingId, staffUserId);
  }
}
