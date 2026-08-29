import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CapacityService } from './capacity.service';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly capacityService: CapacityService,
    @InjectRepository(Booking)
    private readonly bookingsRepo: Repository<Booking>,
  ) {}

  @Post()
  book(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    // Only staff/admin may book on behalf of another member.
    const memberId =
      user.role === Role.STAFF || user.role === Role.ADMIN
        ? dto.memberId
        : undefined;
    return this.capacityService.book(user.id, { ...dto, memberId });
  }

  @Post(':id/accept-offer')
  acceptOffer(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.capacityService.acceptOffer(id, user.id);
  }

  @Delete(':id')
  cancel(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.capacityService.cancel(id, user.id);
  }

  @Get('me')
  myBookings(@CurrentUser() user: User) {
    return this.bookingsRepo.find({
      where: [{ memberId: user.id }, { bookedById: user.id }],
      order: { bookedAt: 'DESC' },
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @RequirePermission('schedule')
  @Get('class/:classInstanceId')
  roster(@Param('classInstanceId', ParseUUIDPipe) classInstanceId: string) {
    return this.bookingsRepo.find({
      where: { classInstanceId },
      order: { status: 'ASC', waitlistPosition: 'ASC', bookedAt: 'ASC' },
      relations: { spot: true, member: true },
    });
  }
}
