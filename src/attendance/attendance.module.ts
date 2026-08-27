import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { NoShowSweepService } from './no-show-sweep.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), BookingsModule],
  providers: [AttendanceService, NoShowSweepService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
