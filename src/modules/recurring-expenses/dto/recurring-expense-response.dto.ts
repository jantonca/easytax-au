import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringSchedule } from '../entities/recurring-expense.entity';

/**
 * Response DTO for recurring expense with formatted values.
 */
export class RecurringExpenseResponseDto {
  @ApiProperty({ description: 'Recurring expense UUID' })
  id!: string;

  @ApiProperty({ description: 'Name of recurring expense' })
  name!: string;

  @ApiPropertyOptional({ description: 'Description template' })
  description?: string | null;

  @ApiProperty({ description: 'Amount in cents' })
  amountCents!: number;

  @ApiProperty({ description: 'GST in cents' })
  gstCents!: number;

  @ApiProperty({ description: 'Business use percentage' })
  bizPercent!: number;

  @ApiProperty({ description: 'Currency code' })
  currency!: string;

  @ApiProperty({ description: 'Schedule frequency', enum: RecurringSchedule })
  schedule!: RecurringSchedule;

  @ApiProperty({ description: 'Day of month (1-28)' })
  dayOfMonth!: number;

  @ApiProperty({ description: 'Start date' })
  startDate!: string;

  @ApiPropertyOptional({ description: 'End date' })
  endDate?: string | null;

  @ApiProperty({ description: 'Whether template is active' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Date of last generated expense' })
  lastGeneratedDate?: string | null;

  @ApiProperty({ description: 'Next due date' })
  nextDueDate!: string;

  @ApiProperty({ description: 'Provider ID' })
  providerId!: string;

  @ApiPropertyOptional({ description: 'Provider name' })
  providerName?: string;

  @ApiProperty({ description: 'Category ID' })
  categoryId!: string;

  @ApiPropertyOptional({ description: 'Category name' })
  categoryName?: string;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt!: Date;
}

/**
 * Response DTO for generate endpoint.
 */
export class GenerateExpensesResultDto {
  @ApiProperty({ description: 'Number of expenses generated' })
  generated!: number;

  @ApiProperty({ description: 'Number of templates skipped (already generated)' })
  skipped!: number;

  @ApiProperty({
    description: 'List of generated expense IDs',
    type: [String],
  })
  expenseIds!: string[];

  @ApiProperty({
    description: 'Details of each generated expense',
    type: 'array',
  })
  details!: Array<{
    recurringExpenseId: string;
    recurringExpenseName: string;
    expenseId: string;
    date: string;
    amountCents: number;
  }>;
}
