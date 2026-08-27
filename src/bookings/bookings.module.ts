import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { CapacityService } from './capacity.service';
import { BookingsController } from './bookings.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), SettingsModule],
  providers: [CapacityService],
  controllers: [BookingsController],
  exports: [CapacityService],
})
export class BookingsModule {}
