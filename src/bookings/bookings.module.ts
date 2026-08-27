import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { RoomSpot } from '../rooms/entities/room-spot.entity';
import { CapacityService } from './capacity.service';
import { BookingsController } from './bookings.controller';
import { SpotMapController } from './spot-map.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, RoomSpot]), SettingsModule],
  providers: [CapacityService],
  controllers: [BookingsController, SpotMapController],
  exports: [CapacityService],
})
export class BookingsModule {}
