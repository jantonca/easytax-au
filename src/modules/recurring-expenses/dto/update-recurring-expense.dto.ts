import { PartialType } from '@nestjs/swagger';
import { CreateRecurringExpenseDto } from './create-recurring-expense.dto';

/**
 * DTO for updating an existing recurring expense template.
 *
 * All fields are optional. Only provided fields will be updated.
 * Changing provider may recalculate GST (international providers = 0).
 *
 * @example
 * ```json
 * {
 *   "amountCents": 9999,
 *   "bizPercent": 75
 * }
 * ```
 */
export class UpdateRecurringExpenseDto extends PartialType(CreateRecurringExpenseDto) {}
