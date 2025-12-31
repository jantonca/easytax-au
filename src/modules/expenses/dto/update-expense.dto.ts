import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto } from './create-expense.dto';

/**
 * DTO for updating an existing expense.
 *
 * All fields are optional - only provided fields will be updated.
 * If providerId changes to an international provider, gstCents will be reset to 0.
 *
 * @example
 * ```json
 * {
 *   "amountCents": 12100,
 *   "description": "Updated description"
 * }
 * ```
 */
export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
