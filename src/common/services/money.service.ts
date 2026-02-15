import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';

/**
 * Australian GST rate as a decimal (10% = 0.10)
 */
const GST_RATE = new Decimal('0.10');

/**
 * Divisor for extracting GST from a GST-inclusive total (11 = 1 + 10%)
 */
const GST_DIVISOR = new Decimal('11');

/**
 * Service for handling all monetary and GST calculations.
 *
 * All amounts are in **cents** (integers) to avoid floating-point precision issues.
 * Internally uses decimal.js for precise arithmetic, returning integers.
 *
 * @example
 * ```typescript
 * // Calculate GST on $100.00 subtotal
 * const gst = moneyService.addGst(10000); // Returns 11000 (cents)
 *
 * // Extract GST from $110.00 total
 * const gstPortion = moneyService.calcGstFromTotal(11000); // Returns 1000 (cents)
 * ```
 *
 * @see AGENTS.md for currency handling guidelines
 */
@Injectable()
export class MoneyService {
  /**
   * Adds two amounts in cents.
   * Used for summing subtotal + GST to get total.
   *
   * @param amountACents - First amount in cents
   * @param amountBCents - Second amount in cents
   * @returns Sum in cents
   *
   * @example
   * addAmounts(100000, 10000) // $1,000.00 + $100.00 = $1,100.00 = 110000 cents
   */
  addAmounts(amountACents: number, amountBCents: number): number {
    return new Decimal(amountACents).plus(amountBCents).round().toNumber();
  }

  /**
   * Adds GST (10%) to a subtotal amount.
   *
   * @param subtotalCents - The pre-GST amount in cents
   * @returns The GST-inclusive total in cents
   *
   * @example
   * addGst(10000) // $100.00 → $110.00 = 11000 cents
   */
  addGst(subtotalCents: number): number {
    const subtotal = new Decimal(subtotalCents);
    const gst = subtotal.times(GST_RATE);
    return subtotal.plus(gst).round().toNumber();
  }

  /**
   * Calculates the GST component from a GST-inclusive total.
   * Uses the formula: GST = Total / 11
   *
   * @param totalCents - The GST-inclusive amount in cents
   * @returns The GST portion in cents
   *
   * @example
   * calcGstFromTotal(11000) // $110.00 → GST = $10.00 = 1000 cents
   */
  calcGstFromTotal(totalCents: number): number {
    const total = new Decimal(totalCents);
    return total.dividedBy(GST_DIVISOR).round().toNumber();
  }

  /**
   * Calculates the subtotal (ex-GST) from a GST-inclusive total.
   *
   * @param totalCents - The GST-inclusive amount in cents
   * @returns The subtotal (ex-GST) in cents
   *
   * @example
   * calcSubtotalFromTotal(11000) // $110.00 → Subtotal = $100.00 = 10000 cents
   */
  calcSubtotalFromTotal(totalCents: number): number {
    const gst = this.calcGstFromTotal(totalCents);
    return totalCents - gst;
  }

  /**
   * Applies a business use percentage to an amount.
   * Used for partial deductions (e.g., 50% business use for home internet).
   *
   * Uses FLOOR rounding (always round down) to match SQL behavior and
   * ensure tax-conservative calculations. This prevents claiming more
   * deductions than what the database reports.
   *
   * @param amountCents - The full amount in cents
   * @param bizPercent - The business use percentage (0-100)
   * @returns The deductible portion in cents (rounded DOWN)
   * @throws Error if bizPercent is outside 0-100 range
   *
   * @example
   * applyBizPercent(10000, 50) // $100.00 at 50% = $50.00 = 5000 cents
   * applyBizPercent(1001, 50.1) // 1001 * 0.501 = 501.501 → FLOOR → 501 cents
   */
  applyBizPercent(amountCents: number, bizPercent: number): number {
    if (bizPercent < 0 || bizPercent > 100) {
      throw new Error('Business percentage must be between 0 and 100');
    }

    const amount = new Decimal(amountCents);
    const percentage = new Decimal(bizPercent).dividedBy(100);
    return amount.times(percentage).floor().toNumber();
  }

  /**
   * Calculates the deductible GST amount considering business use percentage.
   * This is used for BAS 1B calculation.
   *
   * @param gstCents - The GST amount in cents
   * @param bizPercent - The business use percentage (0-100)
   * @returns The deductible GST in cents
   *
   * @example
   * calcDeductibleGst(1000, 50) // $10.00 GST at 50% biz = $5.00 = 500 cents
   */
  calcDeductibleGst(gstCents: number, bizPercent: number): number {
    return this.applyBizPercent(gstCents, bizPercent);
  }

  /**
   * Formats cents to a human-readable dollar string.
   * For display purposes only - not for calculations.
   *
   * @param cents - Amount in cents
   * @returns Formatted string (e.g., "$100.00")
   *
   * @example
   * formatCents(10050) // "$100.50"
   */
  formatCents(cents: number): string {
    const dollars = new Decimal(cents).dividedBy(100);
    return `$${dollars.toFixed(2)}`;
  }

  /**
   * Converts a dollar amount (with decimals) to cents.
   * Useful for parsing user input.
   *
   * @param dollars - Amount in dollars (e.g., 100.50)
   * @returns Amount in cents (e.g., 10050)
   *
   * @example
   * dollarsToCents(100.50) // 10050
   * dollarsToCents('100.50') // 10050
   */
  dollarsToCents(dollars: number | string): number {
    return new Decimal(dollars).times(100).round().toNumber();
  }

  /**
   * Converts cents to dollars.
   *
   * @param cents - Amount in cents
   * @returns Amount in dollars as Decimal for further calculations
   *
   * @example
   * centsToDollars(10050) // Decimal(100.50)
   */
  centsToDollars(cents: number): Decimal {
    return new Decimal(cents).dividedBy(100);
  }
}
