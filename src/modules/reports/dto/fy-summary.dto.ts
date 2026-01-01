import { ApiProperty } from '@nestjs/swagger';

/**
 * Expense breakdown by category for FY reporting.
 */
export class CategoryExpenseDto {
  /**
   * Category ID.
   * @example 1
   */
  @ApiProperty({ description: 'Category ID', example: 1 })
  categoryId: number;

  /**
   * Category name.
   * @example "Software"
   */
  @ApiProperty({ description: 'Category name', example: 'Software' })
  name: string;

  /**
   * ATO BAS label for this category.
   * @example "1B"
   */
  @ApiProperty({ description: 'BAS label', example: '1B' })
  basLabel: string;

  /**
   * Total expense amount in cents (before GST adjustment).
   * @example 500000
   */
  @ApiProperty({ description: 'Total expenses in cents', example: 500000 })
  totalCents: number;

  /**
   * Total GST paid in cents (claimable, after biz_percent).
   * @example 45454
   */
  @ApiProperty({ description: 'GST paid in cents (claimable)', example: 45454 })
  gstCents: number;

  /**
   * Number of expenses in this category.
   * @example 24
   */
  @ApiProperty({ description: 'Number of expenses', example: 24 })
  count: number;
}

/**
 * Income summary section of FY report.
 */
export class FYIncomeSummaryDto {
  /**
   * Total income in cents (including GST).
   * @example 5500000
   */
  @ApiProperty({ description: 'Total income in cents (inc GST)', example: 5500000 })
  totalIncomeCents: number;

  /**
   * Total income from paid invoices only.
   * @example 5000000
   */
  @ApiProperty({ description: 'Total paid income in cents', example: 5000000 })
  paidIncomeCents: number;

  /**
   * Total income from unpaid invoices.
   * @example 500000
   */
  @ApiProperty({ description: 'Total unpaid income in cents', example: 500000 })
  unpaidIncomeCents: number;

  /**
   * Total GST collected in cents.
   * @example 500000
   */
  @ApiProperty({ description: 'GST collected in cents', example: 500000 })
  gstCollectedCents: number;

  /**
   * Number of invoices.
   * @example 45
   */
  @ApiProperty({ description: 'Number of invoices', example: 45 })
  count: number;
}

/**
 * Expense summary section of FY report.
 */
export class FYExpenseSummaryDto {
  /**
   * Total expenses in cents.
   * @example 2200000
   */
  @ApiProperty({ description: 'Total expenses in cents', example: 2200000 })
  totalExpensesCents: number;

  /**
   * Total claimable GST in cents (after biz_percent, domestic only).
   * @example 200000
   */
  @ApiProperty({ description: 'Total claimable GST in cents', example: 200000 })
  gstPaidCents: number;

  /**
   * Number of expenses.
   * @example 156
   */
  @ApiProperty({ description: 'Number of expenses', example: 156 })
  count: number;

  /**
   * Expenses broken down by category.
   */
  @ApiProperty({
    description: 'Expenses by category',
    type: [CategoryExpenseDto],
  })
  byCategory: CategoryExpenseDto[];
}

/**
 * DTO representing a Financial Year summary for tax return preparation.
 *
 * Australian Financial Year runs from 1 July to 30 June.
 * Example: FY2026 = 1 July 2025 to 30 June 2026.
 *
 * All monetary values are in **cents** (integers).
 *
 * @example
 * ```json
 * {
 *   "financialYear": 2026,
 *   "periodStart": "2025-07-01",
 *   "periodEnd": "2026-06-30",
 *   "income": {
 *     "totalIncomeCents": 5500000,
 *     "paidIncomeCents": 5000000,
 *     "unpaidIncomeCents": 500000,
 *     "gstCollectedCents": 500000,
 *     "count": 45
 *   },
 *   "expenses": {
 *     "totalExpensesCents": 2200000,
 *     "gstPaidCents": 200000,
 *     "count": 156,
 *     "byCategory": [...]
 *   },
 *   "netProfitCents": 3300000,
 *   "netGstPayableCents": 300000
 * }
 * ```
 */
export class FYSummaryDto {
  /**
   * The Australian financial year.
   * FY2026 = July 2025 - June 2026.
   * @example 2026
   */
  @ApiProperty({ description: 'Financial year', example: 2026 })
  financialYear: number;

  /**
   * FY label for display.
   * @example "FY2026"
   */
  @ApiProperty({ description: 'FY label', example: 'FY2026' })
  fyLabel: string;

  /**
   * Start date of the FY period (inclusive).
   * @example "2025-07-01"
   */
  @ApiProperty({ description: 'Period start date', example: '2025-07-01' })
  periodStart: string;

  /**
   * End date of the FY period (inclusive).
   * @example "2026-06-30"
   */
  @ApiProperty({ description: 'Period end date', example: '2026-06-30' })
  periodEnd: string;

  /**
   * Income summary for the FY.
   */
  @ApiProperty({ description: 'Income summary', type: FYIncomeSummaryDto })
  income: FYIncomeSummaryDto;

  /**
   * Expense summary for the FY.
   */
  @ApiProperty({ description: 'Expense summary', type: FYExpenseSummaryDto })
  expenses: FYExpenseSummaryDto;

  /**
   * Net profit/loss in cents (income - expenses).
   * Negative value indicates a loss.
   * @example 3300000
   */
  @ApiProperty({ description: 'Net profit in cents', example: 3300000 })
  netProfitCents: number;

  /**
   * Net GST position for the FY in cents.
   * GST collected minus GST paid (claimable).
   * Positive = owes ATO, Negative = refund due.
   * @example 300000
   */
  @ApiProperty({ description: 'Net GST payable in cents', example: 300000 })
  netGstPayableCents: number;
}
