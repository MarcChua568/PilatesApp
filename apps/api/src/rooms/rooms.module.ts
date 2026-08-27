import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { RoomSpot } from './entities/room-spot.entity';
import { RoomsService } from './rooms.service';
import { RoomSpotsService } from './room-spots.service';
import { RoomsController } from './rooms.controller';
import { RoomSpotsController } from './room-spots.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Room, RoomSpot])],
  providers: [RoomsService, RoomSpotsService],
  controllers: [RoomsController, RoomSpotsController],
  exports: [RoomsService, RoomSpotsService],
})
export class RoomsModule {}
