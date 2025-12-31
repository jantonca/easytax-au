import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Category } from '../../categories/entities/category.entity';

/**
 * Provider entity representing vendors you pay for business expenses.
 * The `isInternational` flag determines GST treatment (true = GST-Free).
 *
 * @example
 * ```typescript
 * const provider = new Provider();
 * provider.name = 'GitHub';
 * provider.isInternational = true;
 * provider.defaultCategory = softwareCategory;
 * ```
 */
@Entity('providers')
@Index('idx_providers_international', ['isInternational'])
export class Provider extends BaseEntity {
  /**
   * Provider/vendor name
   * @example "GitHub", "VentraIP", "iinet"
   */
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  /**
   * Whether the provider is international (non-Australian).
   * International providers are GST-Free for Australian tax purposes.
   */
  @Column({ name: 'is_international', type: 'boolean', default: false })
  isInternational!: boolean;

  /**
   * Optional default category for automatic expense categorization.
   * When an expense is created with this provider, it can auto-assign this category.
   */
  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_category_id' })
  defaultCategory?: Category;

  /**
   * Foreign key for the default category relationship.
   * Stored separately for easier querying without joins.
   */
  @Column({ name: 'default_category_id', type: 'uuid', nullable: true })
  defaultCategoryId?: string;

  /**
   * Australian Business Number or Australian Registered Number.
   * Required for Australian providers for GST credit claims.
   * Format: 11 digits for ABN, 9 digits for ARN.
   * @example "51824753556"
   */
  @Column({ name: 'abn_arn', type: 'varchar', length: 20, nullable: true })
  abnArn?: string;

  // Future: Uncomment when Expense entity is created
  // @OneToMany(() => Expense, (expense) => expense.provider)
  // expenses?: Expense[];
}
