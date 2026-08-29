import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ProductCategory =
  | 'apparel'
  | 'grip-socks'
  | 'wellness'
  | 'merch'
  | 'other';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'apparel',
  'grip-socks',
  'wellness',
  'merch',
  'other',
];

/**
 * MILE Shop catalogue entry. Editorial lookbook, not checkout — `pricePhp`
 * and `externalUrl` are both optional so a piece can be shown as
 * "in-studio only" (price, no link) or "shop the MILI drop" (link out)
 * without forcing an e-commerce flow before one exists.
 */
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar', default: 'other' })
  category: ProductCategory;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ name: 'price_php', type: 'int', nullable: true })
  pricePhp: number | null;

  @Column({ name: 'image_url', type: 'varchar', nullable: true })
  imageUrl: string | null;

  @Column({ name: 'video_url', type: 'varchar', nullable: true })
  videoUrl: string | null;

  // Where "Shop now" points — e.g. the MILI storefront for a partnered piece.
  @Column({ name: 'external_url', type: 'varchar', nullable: true })
  externalUrl: string | null;

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
