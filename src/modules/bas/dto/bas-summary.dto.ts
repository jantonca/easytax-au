/**
 * DTO representing a BAS (Business Activity Statement) summary for a quarter.
 *
 * This contains the key fields needed for Simpler BAS reporting:
 * - G1: Total sales (including GST)
 * - 1A: GST collected on sales
 * - 1B: GST paid on purchases (claimable credits)
 *
 * All monetary values are in **cents** (integers).
 *
 * @example
 * ```json
 * {
 *   "quarter": "Q1",
 *   "financialYear": 2025,
 *   "periodStart": "2024-07-01",
 *   "periodEnd": "2024-09-30",
 *   "g1TotalSalesCents": 1100000,
 *   "label1aGstCollectedCents": 100000,
 *   "label1bGstPaidCents": 50000,
 *   "netGstPayableCents": 50000
 * }
 * ```
 */
export class BasSummaryDto {
  /**
   * The quarter (Q1, Q2, Q3, Q4).
   * @example "Q1"
   */
  quarter: string;

  /**
   * The Australian financial year.
   * FY2025 = July 2024 - June 2025.
   * @example 2025
   */
  financialYear: number;

  /**
   * Start date of the BAS period (inclusive).
   * @example "2024-07-01"
   */
  periodStart: string;

  /**
   * End date of the BAS period (inclusive).
   * @example "2024-09-30"
   */
  periodEnd: string;

  /**
   * G1: Total sales (including GST).
   * Sum of all income `total_cents` for the period.
   * @example 1100000 (represents $11,000.00)
   */
  g1TotalSalesCents: number;

  /**
   * 1A: GST collected on sales.
   * Sum of all income `gst_cents` for the period.
   * @example 100000 (represents $1,000.00)
   */
  label1aGstCollectedCents: number;

  /**
   * 1B: GST paid on purchases (claimable credits).
   * Sum of (expense.gst_cents × expense.biz_percent / 100)
   * for domestic providers only.
   * @example 50000 (represents $500.00)
   */
  label1bGstPaidCents: number;

  /**
   * Net GST payable (or refundable if negative).
   * Calculated as: 1A - 1B
   * Positive = you owe ATO, Negative = refund due.
   * @example 50000 (represents $500.00 payable)
   */
  netGstPayableCents: number;

  /**
   * Number of income records in the period.
   * Useful for verification.
   */
  incomeCount: number;

  /**
   * Number of expense records in the period.
   * Useful for verification.
   */
  expenseCount: number;
}
