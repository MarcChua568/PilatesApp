import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { CapacityService } from '../bookings/capacity.service';
import { BookingStatus } from '../common/enums/booking-status.enum';

@Injectable()
export class NoShowSweepService {
  private readonly logger = new Logger(NoShowSweepService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
    private readonly capacityService: CapacityService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron(): Promise<void> {
    const noShows = await this.sweepNoShows();
    const lapsed = await this.capacityService.lapseExpiredOffers();
    if (noShows || lapsed) {
      this.logger.log(
        `Sweep: ${noShows} booking(s) marked no-show, ${lapsed} waitlist offer(s) lapsed`,
      );
    }
  }

  /**
   * Any `booked` booking whose class ended (start + duration) without a check-in
   * becomes a `no_show`. The class has already happened, so no capacity is freed
   * and there is no concurrency concern — a plain bulk update via the repository.
   * Returns the number of rows transitioned.
   */
  async sweepNoShows(now: Date = new Date()): Promise<number> {
    const stale = await this.bookingsRepo
      .createQueryBuilder('b')
      .innerJoin('class_instances', 'ci', 'ci.id = b.class_instance_id')
      .where('b.status = :status', { status: BookingStatus.BOOKED })
      .andWhere('b.checked_in_at IS NULL')
      .andWhere(
        `ci.start_time + (ci.duration_minutes || ' minutes')::interval < :now`,
        { now },
      )
      .select('b.id', 'id')
      .getRawMany<{ id: string }>();

    if (stale.length === 0) return 0;

    await this.bookingsRepo.update(
      { id: In(stale.map((r) => r.id)) },
      { status: BookingStatus.NO_SHOW },
    );
    return stale.length;
  }
}
