import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Instructor } from '../../instructors/entities/instructor.entity';

/**
 * A one-off happening at the studio — workshop, community class, pop-up.
 * Distinct from a recurring class: no template, no room capacity model, an
 * events-specific RSVP count guarded the same way class bookings are.
 */
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'cover_image_url', type: 'varchar', nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @ManyToOne(() => Instructor, { nullable: true })
  @JoinColumn({ name: 'host_instructor_id' })
  hostInstructor: Instructor | null;

  @Column({ name: 'host_instructor_id', type: 'uuid', nullable: true })
  hostInstructorId: string | null;

  // 0 = free.
  @Column({ name: 'price_php', type: 'int', default: 0 })
  pricePhp: number;

  // null = uncapped.
  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ name: 'rsvp_count', type: 'int', default: 0 })
  rsvpCount: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
