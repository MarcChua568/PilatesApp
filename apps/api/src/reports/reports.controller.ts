import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { Role } from '../common/enums/role.enum';

function parseDate(v?: string): Date | undefined {
  return v ? new Date(v) : undefined;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@RequirePermission('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('bookings-per-class')
  bookingsPerClass(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.bookingsPerClass(parseDate(from), parseDate(to));
  }

  @Get('attendance-rate')
  attendanceRate(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.attendanceRate(parseDate(from), parseDate(to));
  }

  @Get('no-show-rate')
  noShowRate(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.noShowRate(parseDate(from), parseDate(to));
  }
}
