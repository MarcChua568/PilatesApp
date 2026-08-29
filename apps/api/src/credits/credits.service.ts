import { BadRequestException, GoneException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { PendingGift } from './entities/pending-gift.entity';
import { User } from '../users/entities/user.entity';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GiftCreditsDto } from './dto/gift-credits.dto';

const GIFT_EXPIRY_DAYS = 30;

@Injectable()
export class CreditsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
    @Optional() private readonly notifications?: NotificationsService,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.dataSource.manager.findOne(User, {
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.creditBalance;
  }

  getLedger(userId: string): Promise<CreditTransaction[]> {
    return this.dataSource.manager.find(CreditTransaction, {
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * "Preview checkout" — same pattern as the pricing page: credits the
   * account immediately with no real payment taken. Swap for a real PH
   * payment gateway (e.g. PayMongo) before launch.
   */
  async purchase(userId: string, amount: number): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(User, { where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');
      user.creditBalance += amount;
      await manager.save(user);
      await manager.save(
        manager.create(CreditTransaction, {
          userId,
          type: 'purchase',
          amount,
        }),
      );
      return user.creditBalance;
    });
  }

  /**
   * Sends credits to `recipientEmail`. If that email belongs to an existing
   * member, the transfer is immediate. Otherwise the sender's credits are
   * held against a PendingGift claim token and an invite email goes out —
   * claiming it (via `claimGift`) after they register credits their new
   * account.
   */
  async gift(senderId: string, dto: GiftCreditsDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const sender = await manager.findOne(User, { where: { id: senderId } });
      if (!sender) throw new NotFoundException('User not found');
      if (sender.creditBalance < dto.amount) {
        throw new BadRequestException('Not enough credits');
      }

      sender.creditBalance -= dto.amount;
      await manager.save(sender);

      const recipient = await manager.findOne(User, {
        where: { email: dto.recipientEmail },
      });

      await manager.save(
        manager.create(CreditTransaction, {
          userId: senderId,
          type: 'gift_sent',
          amount: dto.amount,
          counterpartyUserId: recipient?.id ?? null,
          note: dto.message ?? null,
        }),
      );

      if (recipient) {
        recipient.creditBalance += dto.amount;
        await manager.save(recipient);
        await manager.save(
          manager.create(CreditTransaction, {
            userId: recipient.id,
            type: 'gift_received',
            amount: dto.amount,
            counterpartyUserId: senderId,
            note: dto.message ?? null,
          }),
        );
        await this.notifications?.safeCreate(
          recipient.id,
          'gift_received',
          'You received credits',
          `${sender.fullName} sent you ${dto.amount} credit${dto.amount === 1 ? '' : 's'}.`,
        );
        await this.emailService.giftReceived(
          recipient.email,
          sender.fullName,
          dto.amount,
        );
        return;
      }

      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + GIFT_EXPIRY_DAYS * 86_400_000);
      await manager.save(
        manager.create(PendingGift, {
          token,
          senderId,
          recipientEmail: dto.recipientEmail,
          amount: dto.amount,
          message: dto.message ?? null,
          status: 'pending',
          expiresAt,
        }),
      );
      const webUrl =
        process.env.WEB_APP_URL || process.env.CORS_ORIGINS?.split(',')[0] || '';
      const claimUrl = `${webUrl}/gift/${token}`;
      await this.emailService.giftInvite(
        dto.recipientEmail,
        sender.fullName,
        dto.amount,
        claimUrl,
      );
    });
  }

  /** Applies a pending gift to the now-registered claimant. */
  async claimGift(token: string, claimantId: string): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const gift = await manager.findOne(PendingGift, { where: { token } });
      if (!gift) throw new NotFoundException('Gift not found');
      if (gift.status !== 'pending') {
        throw new GoneException('This gift has already been claimed');
      }
      if (gift.expiresAt.getTime() < Date.now()) {
        throw new GoneException('This gift has expired');
      }

      const claimant = await manager.findOne(User, {
        where: { id: claimantId },
      });
      if (!claimant) throw new NotFoundException('User not found');

      claimant.creditBalance += gift.amount;
      await manager.save(claimant);
      await manager.save(
        manager.create(CreditTransaction, {
          userId: claimant.id,
          type: 'gift_received',
          amount: gift.amount,
          counterpartyUserId: gift.senderId,
          note: gift.message,
        }),
      );

      gift.status = 'claimed';
      gift.claimedByUserId = claimant.id;
      gift.claimedAt = new Date();
      await manager.save(gift);

      return claimant.creditBalance;
    });
  }

  /**
   * Not wired to a cron yet — call this from a scheduled job (or the
   * existing /internal/sweep pattern) once this ships for real, so
   * unclaimed gifts don't sit as a permanent debit against the sender.
   */
  async refundExpiredGifts(): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const expired = await manager
        .createQueryBuilder(PendingGift, 'g')
        .where('g.status = :status', { status: 'pending' })
        .andWhere('g.expires_at < now()')
        .getMany();

      for (const gift of expired) {
        const sender = await manager.findOne(User, {
          where: { id: gift.senderId },
        });
        if (sender) {
          sender.creditBalance += gift.amount;
          await manager.save(sender);
          await manager.save(
            manager.create(CreditTransaction, {
              userId: sender.id,
              type: 'refund',
              amount: gift.amount,
              note: `Unclaimed gift to ${gift.recipientEmail} expired`,
            }),
          );
        }
        gift.status = 'refunded';
        await manager.save(gift);
      }
      return expired.length;
    });
  }
}
