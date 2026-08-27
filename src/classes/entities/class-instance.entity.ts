import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClassTemplate } from './class-template.entity';
import { Instructor } from '../../instructors/entities/instructor.entity';
import { Room } from '../../rooms/entities/room.entity';
import { ClassType } from '../../common/enums/class-type.enum';
import { IntensityLevel } from '../../common/enums/intensity-level.enum';
import { ClassInstanceStatus } from '../../common/enums/class-instance-status.enum';

@Entity('class_instances')
@Index(['startTime'])
@Index(['instructorId', 'startTime'])
export class ClassInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ClassTemplate, { nullable: true })
  @JoinColumn({ name: 'template_id' })
  template: ClassTemplate | null;

  @Column({ name: 'template_id', type: 'uuid', nullable: true })
  templateId: string | null;

  @ManyToOne(() => Instructor)
  @JoinColumn({ name: 'instructor_id' })
  instructor: Instructor;

  @Column({ name: 'instructor_id', type: 'uuid' })
  instructorId: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @Column({ name: 'class_type', type: 'enum', enum: ClassType })
  classType: ClassType;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ name: 'intensity_level', type: 'enum', enum: IntensityLevel })
  intensityLevel: IntensityLevel;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime: Date;

  // Booking opens at this time; null = open as soon as the instance exists.
  @Column({ name: 'bookable_from', type: 'timestamptz', nullable: true })
  bookableFrom: Date | null;

  @Column({ type: 'int' })
  capacity: number;

  @Column({ name: 'booked_count', type: 'int', default: 0 })
  bookedCount: number;

  // Instructor differs from the template's for this occurrence — UI badges "sub".
  @Column({ type: 'boolean', default: false })
  substitute: boolean;

  @Column({
    type: 'enum',
    enum: ClassInstanceStatus,
    default: ClassInstanceStatus.SCHEDULED,
  })
  status: ClassInstanceStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
