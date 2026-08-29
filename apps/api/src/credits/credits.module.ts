import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { PendingGift } from './entities/pending-gift.entity';
import { CreditsService } from './credits.service';
import { CreditsController } from './credits.controller';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CreditTransaction, PendingGift]),
    EmailModule,
    NotificationsModule,
  ],
  providers: [CreditsService],
  controllers: [CreditsController],
  exports: [CreditsService],
})
export class CreditsModule {}
