import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * Singleton row (id is always 1) holding studio-wide configuration.
 * Read/created via SettingsService.get(); never inserted directly elsewhere.
 */
@Entity('studio_settings')
export class StudioSettings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @Column({ name: 'cancellation_window_hours', type: 'int', default: 2 })
  cancellationWindowHours: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
