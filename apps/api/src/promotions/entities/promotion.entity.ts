import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A marketing offer or notice. The first active one flagged showInTopBar drives
 * the site-wide announcement bar; any active one can be featured as a homepage
 * card and/or given its own landing page via landingSlug.
 */
@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  headline: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'cta_label', type: 'varchar', default: 'Learn more' })
  ctaLabel: string;

  @Column({ name: 'cta_href', type: 'varchar', default: '/pricing' })
  ctaHref: string;

  @Column({ name: 'landing_slug', type: 'varchar', nullable: true, unique: true })
  landingSlug: string | null;

  @Column({ name: 'show_in_top_bar', type: 'boolean', default: false })
  showInTopBar: boolean;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
