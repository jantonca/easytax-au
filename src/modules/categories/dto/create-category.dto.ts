import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * DTO for creating a new category.
 *
 * @example
 * ```json
 * {
 *   "name": "Software",
 *   "basLabel": "1B",
 *   "isDeductible": true,
 *   "description": "Software subscriptions and licenses"
 * }
 * ```
 */
export class CreateCategoryDto {
  /**
   * Human-readable category name.
   * Must be non-empty and max 100 characters.
   * @example "Software"
   */
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MaxLength(100, { message: 'Category name must be 100 characters or less' })
  name: string;

  /**
   * ATO BAS label for tax reporting.
   * Must match pattern like "1B", "G10", "G11", etc.
   * @example "1B"
   */
  @IsString()
  @IsNotEmpty({ message: 'BAS label is required' })
  @MaxLength(10, { message: 'BAS label must be 10 characters or less' })
  @Matches(/^[A-Z0-9]+$/i, {
    message: 'BAS label must contain only letters and numbers (e.g., "1B", "G10")',
  })
  basLabel: string;

  /**
   * Whether expenses in this category are tax-deductible.
   * @default true
   */
  @IsBoolean()
  @IsOptional()
  isDeductible?: boolean = true;

  /**
   * Optional description or notes about the category.
   */
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description must be 500 characters or less' })
  description?: string;
}
