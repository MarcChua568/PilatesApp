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
