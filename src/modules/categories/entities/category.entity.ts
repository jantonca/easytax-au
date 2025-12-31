import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Category entity for classifying expenses.
 *
 * Maps expense types to ATO BAS labels for tax reporting.
 * Each expense must belong to exactly one category.
 *
 * @example
 * ```typescript
 * const category = new Category();
 * category.name = 'Software';
 * category.basLabel = '1B';
 * category.isDeductible = true;
 * ```
 */
@Entity('categories')
export class Category extends BaseEntity {
  /**
   * Human-readable category name.
   * @example "Software", "Internet", "Hardware"
   */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /**
   * ATO BAS label for tax reporting.
   * Common values: "1B" (GST on purchases), "G10" (Capital purchases)
   * @example "1B", "G10", "G11"
   */
  @Column({ name: 'bas_label', type: 'varchar', length: 10 })
  basLabel: string;

  /**
   * Whether expenses in this category are tax-deductible.
   * @default true
   */
  @Column({ name: 'is_deductible', type: 'boolean', default: true })
  isDeductible: boolean;

  /**
   * Optional description or notes about the category.
   */
  @Column({ type: 'text', nullable: true })
  description: string | null;
}
