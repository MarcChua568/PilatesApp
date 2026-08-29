import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { WaiversService } from './waivers.service';
import { SubmitWaiverDto } from './dto/submit-waiver.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RequirePermission } from '../common/decorators/permission.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('waivers')
export class WaiversController {
  constructor(private readonly service: WaiversService) {}

  @Post()
  submit(@Body() dto: SubmitWaiverDto, @CurrentUser() user: User) {
    return this.service.submit(user.id, dto);
  }

  @Get('me')
  mine(@CurrentUser() user: User) {
    return this.service.getMine(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @RequirePermission('waivers')
  @Get()
  list() {
    return this.service.list();
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @RequirePermission('waivers')
  @Get(':userId')
  getForUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.getForUser(userId);
  }
}
