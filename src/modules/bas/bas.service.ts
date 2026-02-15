import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from '../incomes/entities/income.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { BasSummaryDto } from './dto/bas-summary.dto';
import { MoneyService } from '../../common/services/money.service';

/**
 * Valid quarter identifiers for Australian financial year.
 */
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/**
 * Accounting basis for BAS reporting.
 * - CASH: Only include paid income (income.is_paid = true)
 * - ACCRUAL: Include all income regardless of payment status
 */
export type AccountingBasis = 'CASH' | 'ACCRUAL';

/**
 * Service for generating BAS (Business Activity Statement) summaries.
 *
 * This service calculates:
 * - G1: Total sales (including GST)
 * - 1A: GST collected on sales
 * - 1B: GST paid on purchases (claimable credits)
 *
 * **Important**: This service injects repositories directly, not other services,
 * to avoid circular dependencies per project guidelines.
 *
 * @see AGENTS.md for circular dependency rules
 * @see ARCHITECTURE.md for BAS calculation formulas
 */
@Injectable()
export class BasService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    private readonly moneyService: MoneyService,
  ) {}

  /**
   * Generates a BAS summary for a given quarter and financial year.
   *
   * Australian Financial Year quarters:
   * - Q1: July - September (start of FY)
   * - Q2: October - December
   * - Q3: January - March
   * - Q4: April - June (end of FY)
   *
   * @param quarter - The quarter (Q1, Q2, Q3, Q4)
   * @param financialYear - The financial year (e.g., 2025 for FY2025)
   * @param basis - Accounting basis (CASH or ACCRUAL). Defaults to ACCRUAL.
   * @returns BAS summary with G1, 1A, 1B calculations
   * @throws BadRequestException if quarter or basis is invalid
   *
   * @example
   * // Get Q1 FY2025 (July-Sep 2024) on cash basis
   * const summary = await basService.getSummary('Q1', 2025, 'CASH');
   */
  async getSummary(
    quarter: string,
    financialYear: number,
    basis: string = 'ACCRUAL',
  ): Promise<BasSummaryDto> {
    // Normalize quarter and basis to uppercase
    const normalizedQuarter = quarter.toUpperCase();
    const normalizedBasis = basis.toUpperCase() as AccountingBasis;

    // Validate quarter
    if (!this.isValidQuarter(normalizedQuarter)) {
      throw new BadRequestException(`Invalid quarter "${quarter}". Must be Q1, Q2, Q3, or Q4.`);
    }

    // Validate accounting basis
    if (!this.isValidBasis(normalizedBasis)) {
      throw new BadRequestException(
        `Invalid accounting basis "${basis}". Must be CASH or ACCRUAL.`,
      );
    }

    // Get date range for the quarter
    const { start, end } = this.getQuarterDateRange(normalizedQuarter as Quarter, financialYear);

    // Calculate all BAS fields
    const [incomeData, expenseData, g10Data, g11Data] = await Promise.all([
      this.calculateIncomeTotals(start, end, normalizedBasis),
      this.calculateExpenseTotals(start, end),
      this.calculatePurchasesByBasLabel(start, end, 'G10'),
      this.calculatePurchasesByBasLabel(start, end, 'G11'),
    ]);

    // Net GST = GST Collected (1A) - GST Paid (1B)
    const netGstPayableCents = this.moneyService.addAmounts(
      incomeData.gstCollectedCents,
      -expenseData.gstPaidCents,
    );

    return {
      quarter: normalizedQuarter,
      financialYear,
      periodStart: start,
      periodEnd: end,
      g1TotalSalesCents: incomeData.totalSalesCents,
      label1aGstCollectedCents: incomeData.gstCollectedCents,
      label1bGstPaidCents: expenseData.gstPaidCents,
      netGstPayableCents,
      g10CapitalPurchasesCents: g10Data.totalPurchasesCents,
      g11NonCapitalPurchasesCents: g11Data.totalPurchasesCents,
      incomeCount: incomeData.count,
      expenseCount: expenseData.count,
    };
  }

  /**
   * Validates if a string is a valid quarter identifier (already uppercase).
   */
  private isValidQuarter(quarter: string): boolean {
    return ['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter);
  }

  /**
   * Validates if a string is a valid accounting basis (already uppercase).
   */
  private isValidBasis(basis: string): basis is AccountingBasis {
    return basis === 'CASH' || basis === 'ACCRUAL';
  }

  /**
   * Gets the start and end dates for a quarter in the Australian financial year.
   *
   * Returns ISO date strings (YYYY-MM-DD) to avoid timezone issues.
   *
   * @param quarter - Q1, Q2, Q3, or Q4
   * @param financialYear - The FY (e.g., 2025 = July 2024 - June 2025)
   * @returns Object with start and end date strings
   */
  private getQuarterDateRange(
    quarter: Quarter,
    financialYear: number,
  ): { start: string; end: string } {
    // FY2025 starts July 2024, ends June 2025
    const fyStartYear = financialYear - 1;

    switch (quarter) {
      case 'Q1':
        // July - September (FY start year)
        return {
          start: `${fyStartYear}-07-01`,
          end: `${fyStartYear}-09-30`,
        };
      case 'Q2':
        // October - December (FY start year)
        return {
          start: `${fyStartYear}-10-01`,
          end: `${fyStartYear}-12-31`,
        };
      case 'Q3':
        // January - March (FY end year)
        return {
          start: `${financialYear}-01-01`,
          end: `${financialYear}-03-31`,
        };
      case 'Q4':
        // April - June (FY end year)
        return {
          start: `${financialYear}-04-01`,
          end: `${financialYear}-06-30`,
        };
    }
  }

  /**
   * Calculates income totals for BAS G1 and 1A.
   *
   * @param startDate - Period start date string (YYYY-MM-DD, inclusive)
   * @param endDate - Period end date string (YYYY-MM-DD, inclusive)
   * @param basis - Accounting basis (CASH = only paid income, ACCRUAL = all income)
   * @returns G1 (total sales), 1A (GST collected), and count
   */
  private async calculateIncomeTotals(
    startDate: string,
    endDate: string,
    basis: AccountingBasis = 'ACCRUAL',
  ): Promise<{ totalSalesCents: number; gstCollectedCents: number; count: number }> {
    const query = this.incomeRepository
      .createQueryBuilder('income')
      .select('COALESCE(SUM(income.total_cents), 0)', 'totalSales')
      .addSelect('COALESCE(SUM(income.gst_cents), 0)', 'gstCollected')
      .addSelect('COUNT(income.id)', 'count')
      .where('income.date >= :startDate', { startDate })
      .andWhere('income.date <= :endDate', { endDate });

    // Cash basis: only include paid income
    if (basis === 'CASH') {
      query.andWhere('income.is_paid = :isPaid', { isPaid: true });
    }

    const result = await query.getRawOne<{
      totalSales: string;
      gstCollected: string;
      count: string;
    }>();

    return {
      totalSalesCents: parseInt(result?.totalSales ?? '0', 10),
      gstCollectedCents: parseInt(result?.gstCollected ?? '0', 10),
      count: parseInt(result?.count ?? '0', 10),
    };
  }

  /**
   * Calculates expense totals for BAS 1B.
   *
   * Only includes GST from **domestic** providers.
   * Applies `biz_percent` to each expense's GST.
   *
   * Formula: SUM(gst_cents * biz_percent / 100) WHERE provider.is_international = false
   *
   * @param startDate - Period start date string (YYYY-MM-DD, inclusive)
   * @param endDate - Period end date string (YYYY-MM-DD, inclusive)
   * @returns 1B (GST paid/claimable) and count
   */
  private async calculateExpenseTotals(
    startDate: string,
    endDate: string,
  ): Promise<{ gstPaidCents: number; count: number }> {
    // Get claimable GST: only domestic providers, with biz_percent applied
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .innerJoin('expense.provider', 'provider')
      .select('COALESCE(SUM(FLOOR(expense.gst_cents * expense.biz_percent / 100)), 0)', 'gstPaid')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.date >= :startDate', { startDate })
      .andWhere('expense.date <= :endDate', { endDate })
      .andWhere('provider.is_international = :isInternational', { isInternational: false })
      .getRawOne<{ gstPaid: string; count: string }>();

    return {
      gstPaidCents: parseInt(result?.gstPaid ?? '0', 10),
      count: parseInt(result?.count ?? '0', 10),
    };
  }

  /**
   * Calculates expense totals for a specific BAS label (G10 or G11).
   *
   * Used for Full BAS reporting:
   * - G10: Capital purchases (> $1,000, depreciable assets)
   * - G11: Non-capital purchases (< $1,000, operating expenses)
   *
   * Formula: SUM(expense.total_cents) WHERE category.basLabel = label
   *
   * @param startDate - Period start date string (YYYY-MM-DD, inclusive)
   * @param endDate - Period end date string (YYYY-MM-DD, inclusive)
   * @param basLabel - The BAS label to filter by ('G10' or 'G11')
   * @returns Total purchases for this BAS label
   */
  private async calculatePurchasesByBasLabel(
    startDate: string,
    endDate: string,
    basLabel: string,
  ): Promise<{ totalPurchasesCents: number }> {
    const result = await this.expenseRepository
      .createQueryBuilder('expense')
      .innerJoin('expense.category', 'category')
      .select('COALESCE(SUM(expense.total_cents), 0)', 'totalPurchases')
      .where('expense.date >= :startDate', { startDate })
      .andWhere('expense.date <= :endDate', { endDate })
      .andWhere('category.bas_label = :basLabel', { basLabel })
      .getRawOne<{ totalPurchases: string }>();

    return {
      totalPurchasesCents: parseInt(result?.totalPurchases ?? '0', 10),
    };
  }

  /**
   * Gets all valid quarters for a financial year with their date ranges.
   * Useful for generating a full year view.
   *
   * @param financialYear - The financial year
   * @returns Array of quarter info with dates
   */
  getQuartersForYear(
    financialYear: number,
  ): Array<{ quarter: Quarter; start: string; end: string }> {
    const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map((quarter) => {
      const { start, end } = this.getQuarterDateRange(quarter, financialYear);
      return {
        quarter,
        start,
        end,
      };
    });
  }
}
