import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClassInstance } from '../../classes/entities/class-instance.entity';
import { RoomSpot } from '../../rooms/entities/room-spot.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';

@Entity('bookings')
@Index('IDX_booking_class_instance', ['classInstanceId'])
@Index('IDX_booking_member', ['memberId'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The attendee, when the attendee is a member. Null for a guest attendee.
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'member_id' })
  member: User | null;

  @Column({ name: 'member_id', type: 'uuid', nullable: true })
  memberId: string | null;

  // The account that created the booking and is responsible for it (= member_id
  // for a self-booking; the booking member for a guest booking).
  @ManyToOne(() => User)
  @JoinColumn({ name: 'booked_by_id' })
  bookedBy: User;

  @Column({ name: 'booked_by_id', type: 'uuid' })
  bookedById: string;

  @Column({ name: 'guest_name', type: 'text', nullable: true })
  guestName: string | null;

  @Column({ name: 'guest_email', type: 'text', nullable: true })
  guestEmail: string | null;

  @ManyToOne(() => ClassInstance)
  @JoinColumn({ name: 'class_instance_id' })
  classInstance: ClassInstance;

  @Column({ name: 'class_instance_id', type: 'uuid' })
  classInstanceId: string;

  // Required when the class's room hasAssignedSpots; null otherwise (and null
  // while waitlisted — a spot is assigned on promotion/acceptance).
  @ManyToOne(() => RoomSpot, { nullable: true })
  @JoinColumn({ name: 'spot_id' })
  spot: RoomSpot | null;

  @Column({ name: 'spot_id', type: 'uuid', nullable: true })
  spotId: string | null;

  @Column({ type: 'enum', enum: BookingStatus })
  status: BookingStatus;

  @Column({ name: 'waitlist_position', type: 'int', nullable: true })
  waitlistPosition: number | null;

  // Set when a waitlisted booking is *offered* a freed spot (inside the
  // auto-promote cutoff) instead of being auto-seated.
  @Column({ name: 'promotion_offered_at', type: 'timestamptz', nullable: true })
  promotionOfferedAt: Date | null;

  @Column({
    name: 'promotion_offer_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  promotionOfferExpiresAt: Date | null;

  @Column({ name: 'booked_at', type: 'timestamptz' })
  bookedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checked_in_by' })
  checkedInBy: User | null;

  @Column({ name: 'checked_in_by', type: 'uuid', nullable: true })
  checkedInById: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
