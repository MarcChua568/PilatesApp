import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * The liability waiver + health intake a client completes at onboarding. One
 * row per submission; submitting also stamps users.health_waiver_signed_at.
 */
@Entity('waiver_submissions')
export class WaiverSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({ name: 'emergency_contact_name' })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone' })
  emergencyContactPhone: string;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medicalNotes: string | null;

  @Column({ name: 'accepted_terms', type: 'boolean', default: false })
  acceptedTerms: boolean;

  // Typed full name, standing in for a signature.
  @Column()
  signature: string;

  @CreateDateColumn({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt: Date;
}
