import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type PendingGiftStatus = 'pending' | 'claimed' | 'refunded';

/**
 * A gift sent to an email address that isn't a MILE member yet. The
 * sender's credits are debited immediately (see CreditsService.gift); this
 * row is what a claim link resolves against once they sign up. Unclaimed
 * gifts should be refunded to the sender after `expiresAt` — see
 * CreditsService.refundExpiredGifts (not yet wired to a cron; run it from
 * the sweep endpoint or a scheduled job when this ships for real).
 */
@Entity('pending_gifts')
export class PendingGift {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({ name: 'recipient_email', type: 'citext' })
  recipientEmail: string;

  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: PendingGiftStatus;

  @Column({ name: 'claimed_by_user_id', type: 'uuid', nullable: true })
  claimedByUserId: string | null;

  @Column({ name: 'claimed_at', type: 'timestamptz', nullable: true })
  claimedAt: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
