import {
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@RequirePermission('schedule')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Patch(':bookingId/check-in')
  checkIn(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.checkIn(bookingId, user.id);
  }

  @Patch(':bookingId/no-show')
  noShow(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user: User,
  ) {
    return this.attendanceService.markNoShow(bookingId, user.id);
  }
}
