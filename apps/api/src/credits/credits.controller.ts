import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { PurchaseCreditsDto } from './dto/purchase-credits.dto';
import { GiftCreditsDto } from './dto/gift-credits.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('credits')
export class CreditsController {
  constructor(private readonly service: CreditsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: User) {
    const [balance, transactions] = await Promise.all([
      this.service.getBalance(user.id),
      this.service.getLedger(user.id),
    ]);
    return { balance, transactions };
  }

  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  async purchase(@CurrentUser() user: User, @Body() dto: PurchaseCreditsDto) {
    const balance = await this.service.purchase(user.id, dto.amount);
    return { balance };
  }

  @UseGuards(JwtAuthGuard)
  @Post('gift')
  async gift(@CurrentUser() user: User, @Body() dto: GiftCreditsDto) {
    await this.service.gift(user.id, dto);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('gift/:token/claim')
  async claim(@CurrentUser() user: User, @Param('token') token: string) {
    const balance = await this.service.claimGift(token, user.id);
    return { balance };
  }
}
