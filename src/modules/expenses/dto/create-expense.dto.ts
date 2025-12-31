import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for creating a new expense.
 *
 * All monetary values are in cents. GST is auto-calculated if not provided:
 * - Domestic provider: GST = amount_cents / 11 (rounded)
 * - International provider: GST = 0 (overrides any provided value)
 *
 * @example
 * ```json
 * {
 *   "date": "2024-01-15",
 *   "amountCents": 11000,
 *   "providerId": "uuid-here",
 *   "categoryId": "uuid-here",
 *   "description": "GitHub Copilot subscription",
 *   "bizPercent": 100
 * }
 * ```
 */
export class CreateExpenseDto {
  /**
   * Transaction date (ISO 8601 format).
   * @example "2024-01-15"
   */
  @IsDateString({}, { message: 'Date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Date is required' })
  date!: string;

  /**
   * Total amount in cents (including GST).
   * Must be a positive integer.
   * @example 11000 (represents $110.00)
   */
  @IsInt({ message: 'Amount must be an integer (cents)' })
  @Min(1, { message: 'Amount must be at least 1 cent' })
  amountCents!: number;

  /**
   * GST component in cents.
   * Optional - if not provided:
   * - Domestic provider: auto-calculated as amount / 11
   * - International provider: set to 0
   * @example 1000 (represents $10.00)
   */
  @IsInt({ message: 'GST must be an integer (cents)' })
  @Min(0, { message: 'GST cannot be negative' })
  @IsOptional()
  gstCents?: number;

  /**
   * Business use percentage (0-100).
   * @default 100
   * @example 100 (100% business use)
   * @example 50 (50% business use, e.g., home internet)
   */
  @IsInt({ message: 'Business percent must be an integer' })
  @Min(0, { message: 'Business percent must be at least 0' })
  @Max(100, { message: 'Business percent cannot exceed 100' })
  @IsOptional()
  bizPercent?: number;

  /**
   * UUID of the provider/vendor.
   */
  @IsUUID('4', { message: 'Provider ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Provider ID is required' })
  providerId!: string;

  /**
   * UUID of the expense category.
   */
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId!: string;

  /**
   * Description of what was purchased.
   * This field is encrypted at rest.
   * @example "GitHub Copilot subscription - January 2024"
   */
  @IsString()
  @MaxLength(500, { message: 'Description must be 500 characters or less' })
  @IsOptional()
  description?: string;

  /**
   * Optional reference to receipt file.
   * @example "receipt-github-2024-01.pdf"
   */
  @IsString()
  @MaxLength(255, { message: 'File reference must be 255 characters or less' })
  @IsOptional()
  fileRef?: string;
}
