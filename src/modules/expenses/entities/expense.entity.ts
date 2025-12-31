import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EncryptedColumnTransformer } from '../../../common/transformers';
import { Provider } from '../../providers/entities/provider.entity';
import { Category } from '../../categories/entities/category.entity';

/**
 * Expense entity representing business purchases.
 *
 * All monetary values are stored as integers in cents to avoid floating-point errors.
 * The `description` field is encrypted at rest using AES-256-GCM.
 *
 * @example
 * ```typescript
 * const expense = new Expense();
 * expense.date = new Date('2024-01-15');
 * expense.amountCents = 11000; // $110.00
 * expense.gstCents = 1000;     // $10.00 GST
 * expense.bizPercent = 100;    // 100% business use
 * expense.provider = githubProvider;
 * expense.category = softwareCategory;
 * ```
 *
 * @security
 * - `description` field is AES-256-GCM encrypted
 */
@Entity('expenses')
@Index('idx_expenses_date', ['date'])
@Index('idx_expenses_category', ['categoryId'])
@Index('idx_expenses_provider', ['providerId'])
export class Expense extends BaseEntity {
  /**
   * Transaction date.
   * @example "2024-01-15"
   */
  @Column({ type: 'date' })
  date!: Date;

  /**
   * Description of what was purchased (encrypted at rest).
   * @example "GitHub Copilot subscription - January 2024"
   * @security Encrypted with AES-256-GCM
   */
  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptedColumnTransformer(),
  })
  description?: string | null;

  /**
   * Total amount in cents (including GST).
   * @example 11000 (represents $110.00)
   */
  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents!: number;

  /**
   * GST component in cents.
   * Auto-set to 0 for international providers.
   * @example 1000 (represents $10.00)
   */
  @Column({ name: 'gst_cents', type: 'integer' })
  gstCents!: number;

  /**
   * Business use percentage (0-100).
   * Only this percentage of GST is claimable.
   * @example 100 (100% business use)
   * @example 50 (50% business use, e.g., home internet)
   */
  @Column({ name: 'biz_percent', type: 'integer', default: 100 })
  bizPercent!: number;

  /**
   * Currency code (ISO 4217).
   * @default "AUD"
   */
  @Column({ type: 'varchar', length: 3, default: 'AUD' })
  currency!: string;

  /**
   * Optional reference to receipt file.
   * @example "receipt-github-2024-01.pdf"
   */
  @Column({ name: 'file_ref', type: 'varchar', length: 255, nullable: true })
  fileRef?: string | null;

  /**
   * The provider/vendor for this expense.
   */
  @ManyToOne(() => Provider, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'provider_id' })
  provider!: Provider;

  /**
   * Foreign key for provider relationship.
   */
  @Column({ name: 'provider_id', type: 'uuid' })
  providerId!: string;

  /**
   * The category for this expense (maps to BAS label).
   */
  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  /**
   * Foreign key for category relationship.
   */
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;
}
