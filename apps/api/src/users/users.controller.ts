import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { ListUsersDto } from './dto/list-users.dto';

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

  @Post('me/waiver')
  async signWaiver(@CurrentUser() user: User) {
    return toPublic(await this.usersService.signWaiver(user.id));
  }

  @UseGuards(RolesGuard)
  @Roles(Role.STAFF, Role.ADMIN)
  @Get()
  async list(@Query() dto: ListUsersDto) {
    const { data, total } = await this.usersService.list(dto);
    return { data: data.map(toPublic), total };
  }
}
