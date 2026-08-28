import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * A keyed blob of editorial content for the marketing pages (e.g. "about.hero",
 * "space.gallery"). The shape of `data` is owned by the frontend / admin
 * content schema — the API just stores and returns it.
 */
@Entity('site_content_blocks')
export class SiteContentBlock {
  @PrimaryColumn({ type: 'varchar' })
  key: string;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
