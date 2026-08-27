import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { RoomSpot } from '../rooms/entities/room-spot.entity';
import { ClassInstance } from '../classes/entities/class-instance.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

type SpotState = 'open' | 'taken' | 'mine' | 'blocked';

@UseGuards(JwtAuthGuard)
@Controller('class-instances')
export class SpotMapController {
  constructor(
    @InjectRepository(RoomSpot)
    private readonly spotsRepo: Repository<RoomSpot>,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
  ) {}

  /** Every spot in the class's room plus its state for the calling member. */
  @Get(':id/spots')
  async spotMap(
    @Param('id', ParseUUIDPipe) classInstanceId: string,
    @CurrentUser() user: User,
  ) {
    const instance = await this.spotsRepo.manager.findOne(ClassInstance, {
      where: { id: classInstanceId },
    });
    if (!instance) return [];

    const spots = await this.spotsRepo.find({
      where: { roomId: instance.roomId },
      order: { sortOrder: 'ASC', label: 'ASC' },
    });
    const booked = await this.bookingsRepo.find({
      where: { classInstanceId, status: BookingStatus.BOOKED },
    });
    const takenBy = new Map(
      booked.filter((b) => b.spotId).map((b) => [b.spotId as string, b]),
    );

    return spots.map((spot) => {
      let state: SpotState = 'open';
      if (!spot.active || !spot.bookable) state = 'blocked';
      else if (takenBy.has(spot.id)) {
        const b = takenBy.get(spot.id)!;
        state = b.memberId === user.id || b.bookedById === user.id ? 'mine' : 'taken';
      }
      return {
        id: spot.id,
        label: spot.label,
        positionGroup: spot.positionGroup,
        sortOrder: spot.sortOrder,
        state,
      };
    });
  }
}
