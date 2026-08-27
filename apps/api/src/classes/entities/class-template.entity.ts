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
import { Room } from '../../rooms/entities/room.entity';
import { ClassType } from '../../common/enums/class-type.enum';
import { IntensityLevel } from '../../common/enums/intensity-level.enum';

@Entity('class_templates')
export class ClassTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'class_type', type: 'enum', enum: ClassType })
  classType: ClassType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

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

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ name: 'intensity_level', type: 'enum', enum: IntensityLevel })
  intensityLevel: IntensityLevel;

  @Column({ type: 'int' })
  capacity: number;

  // JSON-encoded RecurrenceRuleDto
  @Column({ name: 'recurrence_rule', type: 'text' })
  recurrenceRule: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
