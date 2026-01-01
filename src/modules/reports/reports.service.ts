import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Income } from '../incomes/entities/income.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Category } from '../categories/entities/category.entity';
import { FYService } from '../../common/services/fy.service';
import { MoneyService } from '../../common/services/money.service';
import {
  FYSummaryDto,
  FYIncomeSummaryDto,
  FYExpenseSummaryDto,
  CategoryExpenseDto,
} from './dto/fy-summary.dto';

/**
 * Service for generating financial reports.
 *
 * Provides FY (Financial Year) summaries for tax return preparation.
 * Uses repository injection to avoid circular dependencies.
 *
 * @see AGENTS.md for circular dependency rules
 */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Income)
    private readonly incomeRepository: Repository<Income>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly fyService: FYService,
    private readonly moneyService: MoneyService,
  ) {}

  /**
   * Generates a complete FY summary for tax return preparation.
   *
   * @param financialYear - The financial year (e.g., 2026 for FY2025-26)
   * @returns Complete FY summary with income, expenses, and net position
   * @throws BadRequestException if year is invalid
   *
   * @example
   * // Get FY2026 summary (July 2025 - June 2026)
   * const summary = await reportsService.getFYSummary(2026);
   */
  async getFYSummary(financialYear: number): Promise<FYSummaryDto> {
    // Validate year is reasonable (not too old or too far in future)
    const currentYear = new Date().getFullYear();
    if (financialYear < 2000 || financialYear > currentYear + 2) {
      throw new BadRequestException(
        `Invalid financial year "${financialYear}". Must be between 2000 and ${currentYear + 2}.`,
      );
    }

    // Get FY date range
    const { start, end } = this.getFYDateRange(financialYear);

    // Calculate all summaries in parallel
    const [incomeSummary, expenseSummary] = await Promise.all([
      this.calculateIncomeSummary(start, end),
      this.calculateExpenseSummary(start, end),
    ]);

    // Calculate net profit (income - expenses)
    const netProfitCents = this.moneyService.addAmounts(
      incomeSummary.totalIncomeCents,
      -expenseSummary.totalExpensesCents,
    );

    // Calculate net GST (collected - paid)
    const netGstPayableCents = this.moneyService.addAmounts(
      incomeSummary.gstCollectedCents,
      -expenseSummary.gstPaidCents,
    );

    return {
      financialYear,
      fyLabel: `FY${financialYear}`,
      periodStart: start,
      periodEnd: end,
      income: incomeSummary,
      expenses: expenseSummary,
      netProfitCents,
      netGstPayableCents,
    };
  }

  /**
   * Gets the date range for a financial year.
   *
   * @param financialYear - The FY number (e.g., 2026)
   * @returns Start and end dates as ISO strings
   */
  private getFYDateRange(financialYear: number): { start: string; end: string } {
    // FY2026 starts July 2025, ends June 2026
    const fyStartYear = financialYear - 1;

    return {
      start: `${fyStartYear}-07-01`,
      end: `${financialYear}-06-30`,
    };
  }

  /**
   * Calculates income summary for the FY period.
   *
   * @param startDate - Period start (YYYY-MM-DD)
   * @param endDate - Period end (YYYY-MM-DD)
   * @returns Income summary with paid/unpaid breakdown
   */
  private async calculateIncomeSummary(
    startDate: string,
    endDate: string,
  ): Promise<FYIncomeSummaryDto> {
    // Get total income (all invoices)
    const totalResult = await this.incomeRepository
      .createQueryBuilder('income')
      .select('COALESCE(SUM(income.total_cents), 0)', 'total')
      .addSelect('COALESCE(SUM(income.gst_cents), 0)', 'gst')
      .addSelect('COUNT(income.id)', 'count')
      .where('income.date >= :startDate', { startDate })
      .andWhere('income.date <= :endDate', { endDate })
      .getRawOne<{ total: string; gst: string; count: string }>();

    // Get paid income only
    const paidResult = await this.incomeRepository
      .createQueryBuilder('income')
      .select('COALESCE(SUM(income.total_cents), 0)', 'total')
      .where('income.date >= :startDate', { startDate })
      .andWhere('income.date <= :endDate', { endDate })
      .andWhere('income.is_paid = :isPaid', { isPaid: true })
      .getRawOne<{ total: string }>();

    const totalIncomeCents = parseInt(totalResult?.total ?? '0', 10);
    const paidIncomeCents = parseInt(paidResult?.total ?? '0', 10);

    return {
      totalIncomeCents,
      paidIncomeCents,
      unpaidIncomeCents: totalIncomeCents - paidIncomeCents,
      gstCollectedCents: parseInt(totalResult?.gst ?? '0', 10),
      count: parseInt(totalResult?.count ?? '0', 10),
    };
  }

  /**
   * Calculates expense summary for the FY period.
   *
   * @param startDate - Period start (YYYY-MM-DD)
   * @param endDate - Period end (YYYY-MM-DD)
   * @returns Expense summary with category breakdown
   */
  private async calculateExpenseSummary(
    startDate: string,
    endDate: string,
  ): Promise<FYExpenseSummaryDto> {
    // Get total expenses
    const totalResult = await this.expenseRepository
      .createQueryBuilder('expense')
      .select('COALESCE(SUM(expense.amount_cents), 0)', 'total')
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.date >= :startDate', { startDate })
      .andWhere('expense.date <= :endDate', { endDate })
      .getRawOne<{ total: string; count: string }>();

    // Get claimable GST (domestic providers only, with biz_percent)
    const gstResult = await this.expenseRepository
      .createQueryBuilder('expense')
      .innerJoin('expense.provider', 'provider')
      .select('COALESCE(SUM(FLOOR(expense.gst_cents * expense.biz_percent / 100)), 0)', 'gstPaid')
      .where('expense.date >= :startDate', { startDate })
      .andWhere('expense.date <= :endDate', { endDate })
      .andWhere('provider.is_international = :isInternational', { isInternational: false })
      .getRawOne<{ gstPaid: string }>();

    // Get breakdown by category
    const byCategory = await this.calculateExpensesByCategory(startDate, endDate);

    return {
      totalExpensesCents: parseInt(totalResult?.total ?? '0', 10),
      gstPaidCents: parseInt(gstResult?.gstPaid ?? '0', 10),
      count: parseInt(totalResult?.count ?? '0', 10),
      byCategory,
    };
  }

  /**
   * Calculates expense breakdown by category.
   *
   * @param startDate - Period start (YYYY-MM-DD)
   * @param endDate - Period end (YYYY-MM-DD)
   * @returns Array of expenses grouped by category
   */
  private async calculateExpensesByCategory(
    startDate: string,
    endDate: string,
  ): Promise<CategoryExpenseDto[]> {
    // Query expenses grouped by category with GST calculation
    const results = await this.expenseRepository
      .createQueryBuilder('expense')
      .innerJoin('expense.category', 'category')
      .leftJoin('expense.provider', 'provider')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'name')
      .addSelect('category.bas_label', 'basLabel')
      .addSelect('COALESCE(SUM(expense.amount_cents), 0)', 'totalCents')
      .addSelect(
        `COALESCE(SUM(
          CASE 
            WHEN provider.is_international = false 
            THEN FLOOR(expense.gst_cents * expense.biz_percent / 100) 
            ELSE 0 
          END
        ), 0)`,
        'gstCents',
      )
      .addSelect('COUNT(expense.id)', 'count')
      .where('expense.date >= :startDate', { startDate })
      .andWhere('expense.date <= :endDate', { endDate })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.bas_label')
      .orderBy('totalCents', 'DESC')
      .getRawMany<{
        categoryId: number;
        name: string;
        basLabel: string;
        totalCents: string;
        gstCents: string;
        count: string;
      }>();

    return results.map((row) => ({
      categoryId: row.categoryId,
      name: row.name,
      basLabel: row.basLabel,
      totalCents: parseInt(row.totalCents, 10),
      gstCents: parseInt(row.gstCents, 10),
      count: parseInt(row.count, 10),
    }));
  }
}
