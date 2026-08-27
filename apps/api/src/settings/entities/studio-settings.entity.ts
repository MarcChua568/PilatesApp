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

  // Within this many hours of class start, a freed spot is *offered* to the next
  // waitlisted member (promotion_offered_at) rather than auto-assigned.
  @Column({
    name: 'waitlist_auto_promote_cutoff_hours',
    type: 'int',
    default: 2,
  })
  waitlistAutoPromoteCutoffHours: number;

  // How long a waitlist offer stays open before lapsing to the next person.
  @Column({ name: 'waitlist_offer_ttl_minutes', type: 'int', default: 30 })
  waitlistOfferTtlMinutes: number;

  // 1 = no guests; >1 lets a member book that many attendees (self + guests) at once.
  @Column({ name: 'max_seats_per_booking', type: 'int', default: 1 })
  maxSeatsPerBooking: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
