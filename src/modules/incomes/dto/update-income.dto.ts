import { PartialType } from '@nestjs/mapped-types';
import { CreateIncomeDto } from './create-income.dto';

/**
 * DTO for updating an existing income record.
 *
 * All fields are optional - only provided fields will be updated.
 * If `subtotalCents` or `gstCents` changes, `totalCents` will be recalculated.
 *
 * @example
 * ```json
 * {
 *   "isPaid": true,
 *   "description": "Updated description"
 * }
 * ```
 */
export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {}
