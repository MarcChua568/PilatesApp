import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type CreditTransactionType =
  | 'purchase'
  | 'gift_sent'
  | 'gift_received'
  | 'redeemed'
  | 'refund';

/**
 * One row per balance change — never mutate User.creditBalance without
 * writing one of these in the same transaction. `amount` is always
 * positive; direction is implied by `type` (purchase/gift_received/refund
 * credit the account, gift_sent/redeemed debit it).
 */
@Entity('credit_transactions')
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar' })
  type: CreditTransactionType;

  @Column({ type: 'int' })
  amount: number;

  // The other party for a gift — who sent it, or who it was sent to.
  @Column({ name: 'counterparty_user_id', type: 'uuid', nullable: true })
  counterpartyUserId: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
