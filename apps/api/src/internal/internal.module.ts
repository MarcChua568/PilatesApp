import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { AttendanceModule } from '../attendance/attendance.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [AttendanceModule, BookingsModule],
  controllers: [InternalController],
})
export class InternalModule {}
