import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // citext → case-insensitive uniqueness (per the design spec). The citext
  // extension is created in the CreateUsers migration.
  @Column({ type: 'citext', unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;

  // Admin-portal sections this user (when STAFF/ADMIN) is granted access to.
  // Ignored for SUPERADMIN, who implicitly has everything.
  @Column({ type: 'jsonb', default: [] })
  permissions: string[];

  // Purchasable/giftable credits, redeemable for classes. Never write this
  // directly — go through CreditsService so a CreditTransaction ledger row
  // is always written alongside it.
  @Column({ name: 'credit_balance', type: 'int', default: 0 })
  creditBalance: number;

  // Must be non-null before a member's first `booked` booking (first-visit gate).
  @Column({
    name: 'health_waiver_signed_at',
    type: 'timestamptz',
    nullable: true,
  })
  healthWaiverSignedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
