import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, Matches } from 'class-validator';

/**
 * Request body for marking an income as paid.
 *
 * The receipt date is mandatory: cash-basis BAS attributes income to the
 * period in which payment was received (ATO cash accounting), so no date is
 * ever inferred from the invoice date or the current date.
 */
export class MarkIncomePaidDto {
  /**
   * Date the payment was received (YYYY-MM-DD).
   * @example "2026-07-02"
   */
  @ApiProperty({
    description: 'Date the payment was received (YYYY-MM-DD)',
    example: '2026-07-02',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Payment date must be a date-only string (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'Payment date must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Payment date is required' })
  paymentDate!: string;
}
