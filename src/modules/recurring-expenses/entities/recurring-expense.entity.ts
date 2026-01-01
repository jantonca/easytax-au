import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EncryptedColumnTransformer } from '../../../common/transformers';
import { Provider } from '../../providers/entities/provider.entity';
import { Category } from '../../categories/entities/category.entity';

/**
 * Schedule frequency for recurring expenses.
 */
export enum RecurringSchedule {
  /** Generated once per month */
  MONTHLY = 'monthly',
  /** Generated once per quarter (every 3 months) */
  QUARTERLY = 'quarterly',
  /** Generated once per year */
  YEARLY = 'yearly',
}

/**
 * RecurringExpense entity representing expense templates for automatic generation.
 *
 * This entity stores templates for expenses that recur on a regular schedule
 * (monthly, quarterly, or yearly). The `generate` endpoint creates actual
 * Expense records based on these templates.
 *
 * All monetary values are stored as integers in cents to avoid floating-point errors.
 * The `description` field is encrypted at rest using AES-256-GCM.
 *
 * @example
 * ```typescript
 * const recurring = new RecurringExpense();
 * recurring.name = 'iinet Internet';
 * recurring.amountCents = 8999; // $89.99
 * recurring.gstCents = 818;     // $8.18 GST
 * recurring.bizPercent = 50;    // 50% business use
 * recurring.schedule = RecurringSchedule.MONTHLY;
 * recurring.dayOfMonth = 15;    // Due on 15th
 * recurring.provider = iinetProvider;
 * recurring.category = internetCategory;
 * ```
 *
 * @security
 * - `description` field is AES-256-GCM encrypted
 */
@Entity('recurring_expenses')
@Index('idx_recurring_expenses_provider', ['providerId'])
@Index('idx_recurring_expenses_category', ['categoryId'])
@Index('idx_recurring_expenses_active', ['isActive'])
@Index('idx_recurring_expenses_next_due', ['nextDueDate'])
export class RecurringExpense extends BaseEntity {
  /**
   * Human-readable name for this recurring expense.
   * @example "iinet Internet", "GitHub Copilot"
   */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /**
   * Description template for generated expenses (encrypted at rest).
   * @example "Monthly internet service"
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
   * @example 8999 (represents $89.99)
   */
  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents!: number;

  /**
   * GST component in cents.
   * Auto-set to 0 for international providers.
   * @example 818 (represents $8.18)
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
   * Schedule frequency for expense generation.
   */
  @Column({
    type: 'enum',
    enum: RecurringSchedule,
    default: RecurringSchedule.MONTHLY,
  })
  schedule!: RecurringSchedule;

  /**
   * Day of month when expense is due (1-28).
   * Limited to 28 to avoid month-end edge cases.
   * @example 1 (1st of month)
   * @example 15 (15th of month)
   */
  @Column({ name: 'day_of_month', type: 'integer', default: 1 })
  dayOfMonth!: number;

  /**
   * Date when recurring expense starts being active.
   * No expenses will be generated before this date.
   */
  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  /**
   * Optional end date for recurring expense.
   * No expenses will be generated after this date.
   */
  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date | null;

  /**
   * Whether this recurring expense is active.
   * Inactive templates are skipped during generation.
   */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  /**
   * Date of the last generated expense.
   * Used to prevent duplicate generation.
   */
  @Column({ name: 'last_generated_date', type: 'date', nullable: true })
  lastGeneratedDate?: Date | null;

  /**
   * Next date when an expense should be generated.
   * Computed and stored for efficient querying.
   */
  @Column({ name: 'next_due_date', type: 'date' })
  nextDueDate!: Date;

  /**
   * The provider/vendor for generated expenses.
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
   * The category for generated expenses (maps to BAS label).
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
