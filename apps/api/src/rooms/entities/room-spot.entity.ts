import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Room } from './room.entity';

/**
 * A bookable position within a room (a reformer, a mat spot, a bike…).
 * A class instance whose room `hasAssignedSpots` requires each attendee to hold
 * one of these.
 */
@Entity('room_spots')
@Unique('UQ_room_spot_label', ['roomId', 'label'])
@Index('IDX_room_spot_room', ['roomId'])
export class RoomSpot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ type: 'text' })
  label: string;

  @Column({ name: 'position_group', type: 'text', nullable: true })
  positionGroup: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  bookable: boolean;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
