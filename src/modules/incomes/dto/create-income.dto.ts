import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for creating a new income record.
 *
 * All monetary values are in cents. The `totalCents` is auto-calculated
 * as `subtotalCents + gstCents` by the service layer.
 *
 * @example
 * ```json
 * {
 *   "date": "2024-01-15",
 *   "clientId": "uuid-here",
 *   "subtotalCents": 100000,
 *   "gstCents": 10000,
 *   "invoiceNum": "INV-2024-001",
 *   "description": "Website development",
 *   "isPaid": false
 * }
 * ```
 */
export class CreateIncomeDto {
  /**
   * Invoice date (ISO 8601 format).
   * @example "2024-01-15"
   */
  @ApiProperty({ description: 'Invoice date (YYYY-MM-DD)', example: '2024-01-15' })
  @IsDateString({}, { message: 'Date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Date is required' })
  date!: string;

  /**
   * UUID of the client who paid for this work.
   */
  @ApiProperty({ description: 'Client UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4', { message: 'Client ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Client ID is required' })
  clientId!: string;

  /**
   * Your invoice number (optional).
   * @example "INV-2024-001"
   */
  @ApiPropertyOptional({ description: 'Invoice number', example: 'INV-2024-001', maxLength: 50 })
  @IsString({ message: 'Invoice number must be a string' })
  @MaxLength(50, { message: 'Invoice number must be 50 characters or less' })
  @IsOptional()
  invoiceNum?: string;

  /**
   * Description of the work performed.
   * This field is encrypted at rest.
   * @example "Website development - Phase 1"
   */
  @ApiPropertyOptional({
    description: 'Work description (encrypted at rest)',
    example: 'Website development',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: 'Description must be 500 characters or less' })
  @IsOptional()
  description?: string;

  /**
   * Subtotal amount in cents (before GST).
   * Must be a non-negative integer.
   * @example 100000 (represents $1,000.00)
   */
  @ApiProperty({ description: 'Subtotal in cents (ex-GST)', example: 100000, minimum: 0 })
  @IsInt({ message: 'Subtotal must be an integer (cents)' })
  @Min(0, { message: 'Subtotal cannot be negative' })
  subtotalCents!: number;

  /**
   * GST collected in cents.
   * Must be a non-negative integer.
   * @example 10000 (represents $100.00)
   */
  @ApiProperty({ description: 'GST collected in cents', example: 10000, minimum: 0 })
  @IsInt({ message: 'GST must be an integer (cents)' })
  @Min(0, { message: 'GST cannot be negative' })
  gstCents!: number;

  /**
   * Whether payment has been received.
   * @default false
   */
  @ApiPropertyOptional({ description: 'Payment received', default: false })
  @IsBoolean({ message: 'isPaid must be a boolean' })
  @IsOptional()
  isPaid?: boolean;

  /**
   * Date the payment was received (YYYY-MM-DD).
   * Required when `isPaid` is true — cash-basis BAS attributes income to the
   * period in which payment was received (ATO cash accounting). Explicit
   * null is accepted by validation and carries meaning in the update
   * contract (deliberately re-entering the "receipt date unknown" state);
   * the service layer rejects null/absent dates where the transition
   * requires one.
   */
  @ApiPropertyOptional({
    description: 'Date the payment was received (YYYY-MM-DD); required when isPaid is true',
    example: '2026-07-02',
    type: String,
    format: 'date',
    nullable: true,
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Payment date must be a date-only string (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'Payment date must be a valid ISO 8601 date string' })
  @IsOptional()
  paymentDate?: string | null;
}
