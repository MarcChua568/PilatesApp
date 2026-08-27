import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';

export interface BookingsPerClassRow {
  classInstanceId: string;
  className: string;
  startTime: Date;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  attendedCount: number;
  noShowCount: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Booking)
    private readonly repo: Repository<Booking>,
  ) {}

  async bookingsPerClass(
    from?: Date,
    to?: Date,
  ): Promise<BookingsPerClassRow[]> {
    const rows = await this.repo.query(
      `
      SELECT
        ci.id AS "classInstanceId",
        ci.name AS "className",
        ci.start_time AS "startTime",
        ci.capacity AS "capacity",
        ci.booked_count AS "bookedCount",
        COUNT(b.*) FILTER (WHERE b.status = 'waitlisted') AS "waitlistCount",
        COUNT(b.*) FILTER (WHERE b.status = 'attended')   AS "attendedCount",
        COUNT(b.*) FILTER (WHERE b.status = 'no_show')    AS "noShowCount"
      FROM class_instances ci
      LEFT JOIN bookings b ON b.class_instance_id = ci.id
      WHERE ($1::timestamptz IS NULL OR ci.start_time >= $1)
        AND ($2::timestamptz IS NULL OR ci.start_time <= $2)
      GROUP BY ci.id
      ORDER BY ci.start_time DESC
      `,
      [from ?? null, to ?? null],
    );
    return rows.map((r: Record<string, string>) => ({
      classInstanceId: r.classInstanceId,
      className: r.className,
      startTime: new Date(r.startTime),
      capacity: Number(r.capacity),
      bookedCount: Number(r.bookedCount),
      waitlistCount: Number(r.waitlistCount),
      attendedCount: Number(r.attendedCount),
      noShowCount: Number(r.noShowCount),
    }));
  }

  private async resolvedCounts(
    from?: Date,
    to?: Date,
  ): Promise<{ attended: number; noShow: number }> {
    const rows = await this.repo.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE status = 'attended') AS attended,
        COUNT(*) FILTER (WHERE status = 'no_show')  AS no_show
      FROM bookings
      WHERE ($1::timestamptz IS NULL OR booked_at >= $1)
        AND ($2::timestamptz IS NULL OR booked_at <= $2)
      `,
      [from ?? null, to ?? null],
    );
    return {
      attended: Number(rows[0].attended),
      noShow: Number(rows[0].no_show),
    };
  }

  async attendanceRate(
    from?: Date,
    to?: Date,
  ): Promise<{ attended: number; totalResolved: number; rate: number }> {
    const { attended, noShow } = await this.resolvedCounts(from, to);
    const totalResolved = attended + noShow;
    return {
      attended,
      totalResolved,
      rate: totalResolved === 0 ? 0 : attended / totalResolved,
    };
  }

  async noShowRate(
    from?: Date,
    to?: Date,
  ): Promise<{ noShow: number; totalResolved: number; rate: number }> {
    const { attended, noShow } = await this.resolvedCounts(from, to);
    const totalResolved = attended + noShow;
    return {
      noShow,
      totalResolved,
      rate: totalResolved === 0 ? 0 : noShow / totalResolved,
    };
  }
}
