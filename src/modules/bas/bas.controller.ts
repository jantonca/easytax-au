import { Controller, Get, Param } from '@nestjs/common';
import { BasService } from './bas.service';
import { BasSummaryDto } from './dto/bas-summary.dto';

/**
 * Controller for BAS (Business Activity Statement) operations.
 *
 * Provides endpoints for generating quarterly BAS summaries
 * following Australian Tax Office requirements.
 *
 * @example
 * GET /bas/Q1/2025 - Get BAS summary for Q1 FY2025
 * GET /bas/quarters/2025 - Get all quarter date ranges for FY2025
 */
@Controller('bas')
export class BasController {
  constructor(private readonly basService: BasService) {}

  /**
   * Retrieves a BAS summary for a specific quarter and financial year.
   *
   * Australian Financial Year quarters:
   * - Q1: July - September
   * - Q2: October - December
   * - Q3: January - March
   * - Q4: April - June
   *
   * @param quarter - The quarter (Q1, Q2, Q3, Q4)
   * @param year - The financial year (e.g., 2025 for FY2024-25)
   * @returns BAS summary with G1, 1A, 1B calculations
   *
   * @example
   * // Request: GET /bas/Q1/2025
   * // Response:
   * // {
   * //   "quarter": "Q1",
   * //   "financialYear": 2025,
   * //   "periodStart": "2024-07-01",
   * //   "periodEnd": "2024-09-30",
   * //   "g1TotalSalesCents": 110000,
   * //   "label1aGstCollectedCents": 10000,
   * //   "label1bGstPaidCents": 3000,
   * //   "netGstPayableCents": 7000,
   * //   "incomeCount": 5,
   * //   "expenseCount": 12
   * // }
   */
  @Get(':quarter/:year')
  async getSummary(
    @Param('quarter') quarter: string,
    @Param('year') year: string,
  ): Promise<BasSummaryDto> {
    return this.basService.getSummary(quarter.toUpperCase(), parseInt(year, 10));
  }

  /**
   * Retrieves all quarter date ranges for a financial year.
   *
   * Useful for building UI selectors or understanding period boundaries.
   *
   * @param year - The financial year
   * @returns Array of quarter objects with start and end dates
   *
   * @example
   * // Request: GET /bas/quarters/2025
   * // Response:
   * // [
   * //   { "quarter": "Q1", "start": "2024-07-01", "end": "2024-09-30" },
   * //   { "quarter": "Q2", "start": "2024-10-01", "end": "2024-12-31" },
   * //   { "quarter": "Q3", "start": "2025-01-01", "end": "2025-03-31" },
   * //   { "quarter": "Q4", "start": "2025-04-01", "end": "2025-06-30" }
   * // ]
   */
  @Get('quarters/:year')
  getQuarters(@Param('year') year: string): Array<{
    quarter: string;
    start: string;
    end: string;
  }> {
    return this.basService.getQuartersForYear(parseInt(year, 10));
  }
}
