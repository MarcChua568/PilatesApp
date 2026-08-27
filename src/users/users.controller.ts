import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }

  @Post('me/waiver')
  signWaiver(@CurrentUser() user: User) {
    return this.usersService.signWaiver(user.id).then(({ passwordHash, ...safe }) => {
      void passwordHash;
      return safe;
    });
  }
}
