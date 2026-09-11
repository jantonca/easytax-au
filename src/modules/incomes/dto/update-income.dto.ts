import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';
import { CreateIncomeDto } from './create-income.dto';

/**
 * DTO for updating an existing income record.
 *
 * All fields are optional - only provided fields will be updated.
 * If `subtotalCents` or `gstCents` changes, `totalCents` will be recalculated.
 *
 * `paymentDate` is redeclared explicitly: `PartialType` (from
 * `@nestjs/mapped-types`) does not copy Swagger property metadata, so without
 * this declaration the nullable update contract would not appear in the
 * OpenAPI document (U01).
 *
 * @example
 * ```json
 * {
 *   "isPaid": true,
 *   "paymentDate": "2026-07-02",
 *   "description": "Updated description"
 * }
 * ```
 */
export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {
  /**
   * Date the payment was received (YYYY-MM-DD). Semantics of the update
   * contract (docs/core/CASH-BASIS-DESIGN.md):
   * - newly marking an unpaid income paid requires a non-null date;
   * - an already-paid income may send explicit null to re-enter the
   *   documented "receipt date unknown" state;
   * - `isPaid: false` clears the date server-side.
   */
  @ApiPropertyOptional({
    description:
      'Date the payment was received (YYYY-MM-DD). Explicit null on an already-paid income re-enters the "receipt date unknown" state.',
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
