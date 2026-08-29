import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { ListUsersDto } from './dto/list-users.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateAccessDto } from './dto/update-access.dto';

function toPublic({ passwordHash, ...safe }: User) {
  void passwordHash;
  return safe;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return toPublic(user);
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return toPublic(await this.usersService.updateProfile(user.id, dto));
  }

  @Post('me/waiver')
  async signWaiver(@CurrentUser() user: User) {
    return toPublic(await this.usersService.signWaiver(user.id));
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPERADMIN)
  @Get()
  async list(@Query() dto: ListUsersDto) {
    const { data, total } = await this.usersService.list(dto);
    return { data: data.map(toPublic), total };
  }

  // --- Team access management — superadmin only. ---

  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Post('staff')
  async createStaff(@Body() dto: CreateStaffDto) {
    return toPublic(await this.usersService.createStaff(dto));
  }

  @UseGuards(RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Patch(':id/access')
  async updateAccess(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccessDto,
  ) {
    return toPublic(await this.usersService.updateAccess(id, dto));
  }
}
