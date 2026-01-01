import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RecurringSchedule } from '../entities/recurring-expense.entity';

/**
 * DTO for creating a new recurring expense template.
 *
 * All monetary values are in cents. GST is auto-calculated if not provided:
 * - Domestic provider: GST = amount_cents / 11 (rounded)
 * - International provider: GST = 0 (overrides any provided value)
 *
 * @example
 * ```json
 * {
 *   "name": "iinet Internet",
 *   "amountCents": 8999,
 *   "providerId": "uuid-here",
 *   "categoryId": "uuid-here",
 *   "schedule": "monthly",
 *   "dayOfMonth": 15,
 *   "startDate": "2025-07-01",
 *   "bizPercent": 50
 * }
 * ```
 */
export class CreateRecurringExpenseDto {
  /**
   * Human-readable name for this recurring expense.
   * @example "iinet Internet"
   */
  @ApiProperty({
    description: 'Name for this recurring expense',
    example: 'iinet Internet',
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  /**
   * Description template for generated expenses.
   * @example "Monthly internet service"
   */
  @ApiPropertyOptional({
    description: 'Description template for generated expenses',
    example: 'Monthly internet service',
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  description?: string;

  /**
   * Total amount in cents (including GST).
   * Must be a positive integer.
   * @example 8999 (represents $89.99)
   */
  @ApiProperty({
    description: 'Amount in cents (inc GST)',
    example: 8999,
    minimum: 1,
  })
  @IsInt({ message: 'Amount must be an integer (cents)' })
  @Min(1, { message: 'Amount must be at least 1 cent' })
  amountCents!: number;

  /**
   * GST component in cents.
   * Optional - if not provided:
   * - Domestic provider: auto-calculated as amount / 11
   * - International provider: set to 0
   * @example 818 (represents $8.18)
   */
  @ApiPropertyOptional({
    description: 'GST in cents (auto-calculated if not provided)',
    example: 818,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: 'GST must be an integer (cents)' })
  @Min(0, { message: 'GST cannot be negative' })
  gstCents?: number;

  /**
   * Business use percentage (0-100).
   * Default: 100 (fully business use)
   * @example 50 (50% business use)
   */
  @ApiPropertyOptional({
    description: 'Business use percentage (0-100)',
    example: 100,
    minimum: 0,
    maximum: 100,
    default: 100,
  })
  @IsOptional()
  @IsInt({ message: 'Business percentage must be an integer' })
  @Min(0, { message: 'Business percentage cannot be negative' })
  @Max(100, { message: 'Business percentage cannot exceed 100' })
  bizPercent?: number;

  /**
   * Currency code (ISO 4217).
   * @default "AUD"
   */
  @ApiPropertyOptional({
    description: 'Currency code (ISO 4217)',
    example: 'AUD',
    default: 'AUD',
  })
  @IsOptional()
  @IsString({ message: 'Currency must be a string' })
  @MaxLength(3, { message: 'Currency must be 3 characters' })
  currency?: string;

  /**
   * Schedule frequency for expense generation.
   * @example "monthly"
   */
  @ApiProperty({
    description: 'Schedule frequency',
    enum: RecurringSchedule,
    example: RecurringSchedule.MONTHLY,
  })
  @IsEnum(RecurringSchedule, {
    message: 'Schedule must be monthly, quarterly, or yearly',
  })
  schedule!: RecurringSchedule;

  /**
   * Day of month when expense is due (1-28).
   * @example 15
   */
  @ApiPropertyOptional({
    description: 'Day of month (1-28)',
    example: 1,
    minimum: 1,
    maximum: 28,
    default: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Day of month must be an integer' })
  @Min(1, { message: 'Day of month must be at least 1' })
  @Max(28, { message: 'Day of month cannot exceed 28' })
  dayOfMonth?: number;

  /**
   * Date when recurring expense starts being active (ISO 8601).
   * @example "2025-07-01"
   */
  @ApiProperty({
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-07-01',
  })
  @IsDateString({}, { message: 'Start date must be a valid ISO 8601 date' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate!: string;

  /**
   * Optional end date for recurring expense (ISO 8601).
   * @example "2026-06-30"
   */
  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD)',
    example: '2026-06-30',
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO 8601 date' })
  endDate?: string;

  /**
   * Whether this recurring expense is active.
   * @default true
   */
  @ApiPropertyOptional({
    description: 'Whether template is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  /**
   * Provider ID for this recurring expense.
   */
  @ApiProperty({
    description: 'Provider UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Provider ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Provider ID is required' })
  providerId!: string;

  /**
   * Category ID for this recurring expense.
   */
  @ApiProperty({
    description: 'Category UUID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Category ID is required' })
  categoryId!: string;
}
