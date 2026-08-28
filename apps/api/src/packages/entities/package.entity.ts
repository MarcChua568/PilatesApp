import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PackageKind =
  | 'intro'
  | 'single'
  | 'pack'
  | 'membership'
  | 'workshop';

export const PACKAGE_KINDS: PackageKind[] = [
  'intro',
  'single',
  'pack',
  'membership',
  'workshop',
];

/**
 * A purchasable pricing option shown on /pricing. Staff-editable. No payment is
 * taken yet — checkout is a preview — but the catalogue is real data.
 */
@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  kind: PackageKind;

  @Column({ name: 'price_php', type: 'int' })
  pricePhp: number;

  // null for unlimited memberships.
  @Column({ type: 'int', nullable: true })
  credits: number | null;

  @Column({ name: 'validity_days', type: 'int', nullable: true })
  validityDays: number | null;

  @Column({ type: 'text', default: '' })
  blurb: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  perks: string[];

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
