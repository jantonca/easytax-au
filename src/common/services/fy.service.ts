import { Injectable } from '@nestjs/common';

/**
 * Valid Australian Financial Year quarters.
 * Q1: Jul-Sep, Q2: Oct-Dec, Q3: Jan-Mar, Q4: Apr-Jun
 */
export type AustralianQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

/**
 * Result of FY/Quarter calculation
 */
export interface FYInfo {
  /**
   * Financial Year (e.g., 2026 for FY2025-26, which runs Jul 2025 - Jun 2026)
   * The FY number is the calendar year in which the FY ends.
   */
  financialYear: number;

  /**
   * Quarter within the FY (Q1-Q4)
   */
  quarter: AustralianQuarter;

  /**
   * Human-readable FY label (e.g., "FY2026")
   */
  fyLabel: string;

  /**
   * Human-readable quarter label (e.g., "Q1 FY2026")
   */
  quarterLabel: string;
}

/**
 * Quarter date boundaries
 */
export interface QuarterDateRange {
  /**
   * Start date of the quarter (inclusive)
   */
  startDate: Date;

  /**
   * End date of the quarter (inclusive)
   */
  endDate: Date;
}

/**
 * Service for Australian Financial Year (FY) calculations.
 *
 * Australian FY runs from 1 July to 30 June.
 * - FY2026 = 1 July 2025 to 30 June 2026
 *
 * Quarters (for BAS purposes):
 * - Q1: July - September
 * - Q2: October - December
 * - Q3: January - March
 * - Q4: April - June
 *
 * @example
 * ```typescript
 * const fyService = new FYService();
 *
 * // Get FY info for a date
 * fyService.getFYInfo(new Date('2025-08-15'));
 * // Returns: { financialYear: 2026, quarter: 'Q1', fyLabel: 'FY2026', quarterLabel: 'Q1 FY2026' }
 *
 * // Get just the FY number
 * fyService.getFYFromDate(new Date('2025-06-30')); // Returns: 2025
 * fyService.getFYFromDate(new Date('2025-07-01')); // Returns: 2026
 * ```
 */
@Injectable()
export class FYService {
  /**
   * Month when Australian FY starts (July = 6 in 0-indexed months)
   */
  private readonly FY_START_MONTH = 6; // July (0-indexed)

  /**
   * Gets the Financial Year number for a given date.
   * The FY number is the calendar year in which the FY ends.
   *
   * @param date - The date to check
   * @returns The financial year number (e.g., 2026 for dates between Jul 2025 - Jun 2026)
   *
   * @example
   * getFYFromDate(new Date('2025-06-30')) // Returns 2025 (still in FY2025)
   * getFYFromDate(new Date('2025-07-01')) // Returns 2026 (now in FY2026)
   * getFYFromDate(new Date('2026-01-15')) // Returns 2026 (Q3 of FY2026)
   */
  getFYFromDate(date: Date): number {
    const month = date.getMonth(); // 0-indexed (0 = January, 6 = July)
    const year = date.getFullYear();

    // If month is July (6) or later, we're in the FY that ends next calendar year
    if (month >= this.FY_START_MONTH) {
      return year + 1;
    }

    // If month is before July, we're in the FY that ends this calendar year
    return year;
  }

  /**
   * Gets the Australian BAS quarter for a given date.
   *
   * @param date - The date to check
   * @returns The quarter (Q1, Q2, Q3, or Q4)
   *
   * @example
   * getQuarterFromDate(new Date('2025-07-15')) // Returns 'Q1'
   * getQuarterFromDate(new Date('2025-10-01')) // Returns 'Q2'
   * getQuarterFromDate(new Date('2026-01-31')) // Returns 'Q3'
   * getQuarterFromDate(new Date('2026-04-15')) // Returns 'Q4'
   */
  getQuarterFromDate(date: Date): AustralianQuarter {
    const month = date.getMonth(); // 0-indexed

    // Q1: July (6), August (7), September (8)
    if (month >= 6 && month <= 8) {
      return 'Q1';
    }

    // Q2: October (9), November (10), December (11)
    if (month >= 9 && month <= 11) {
      return 'Q2';
    }

    // Q3: January (0), February (1), March (2)
    if (month >= 0 && month <= 2) {
      return 'Q3';
    }

    // Q4: April (3), May (4), June (5)
    return 'Q4';
  }

  /**
   * Gets complete FY information for a given date.
   *
   * @param date - The date to analyze
   * @returns Complete FY info including year, quarter, and labels
   *
   * @example
   * getFYInfo(new Date('2025-08-15'))
   * // Returns: {
   * //   financialYear: 2026,
   * //   quarter: 'Q1',
   * //   fyLabel: 'FY2026',
   * //   quarterLabel: 'Q1 FY2026'
   * // }
   */
  getFYInfo(date: Date): FYInfo {
    const financialYear = this.getFYFromDate(date);
    const quarter = this.getQuarterFromDate(date);

    return {
      financialYear,
      quarter,
      fyLabel: `FY${financialYear}`,
      quarterLabel: `${quarter} FY${financialYear}`,
    };
  }

  /**
   * Gets the date range for a specific quarter in a financial year.
   *
   * @param quarter - The quarter (Q1, Q2, Q3, Q4)
   * @param financialYear - The financial year number
   * @returns The start and end dates of the quarter
   *
   * @example
   * getQuarterDateRange('Q1', 2026)
   * // Returns: { startDate: 2025-07-01, endDate: 2025-09-30 }
   *
   * getQuarterDateRange('Q3', 2026)
   * // Returns: { startDate: 2026-01-01, endDate: 2026-03-31 }
   */
  getQuarterDateRange(quarter: AustralianQuarter, financialYear: number): QuarterDateRange {
    // FY starts in July of the previous calendar year
    const fyStartYear = financialYear - 1;

    switch (quarter) {
      case 'Q1':
        return {
          startDate: new Date(fyStartYear, 6, 1), // July 1
          endDate: new Date(fyStartYear, 8, 30), // September 30
        };
      case 'Q2':
        return {
          startDate: new Date(fyStartYear, 9, 1), // October 1
          endDate: new Date(fyStartYear, 11, 31), // December 31
        };
      case 'Q3':
        return {
          startDate: new Date(financialYear, 0, 1), // January 1
          endDate: new Date(financialYear, 2, 31), // March 31
        };
      case 'Q4':
        return {
          startDate: new Date(financialYear, 3, 1), // April 1
          endDate: new Date(financialYear, 5, 30), // June 30
        };
    }
  }

  /**
   * Checks if a date falls within a specific quarter.
   *
   * @param date - The date to check
   * @param quarter - The quarter to check against
   * @param financialYear - The financial year
   * @returns True if the date is within the quarter
   */
  isDateInQuarter(date: Date, quarter: AustralianQuarter, financialYear: number): boolean {
    const range = this.getQuarterDateRange(quarter, financialYear);
    return date >= range.startDate && date <= range.endDate;
  }

  /**
   * Gets all valid quarters for a given financial year.
   * Useful for generating dropdown options or reports.
   *
   * @param financialYear - The financial year
   * @returns Array of quarter info with date ranges
   */
  getAllQuartersForFY(
    financialYear: number,
  ): Array<{ quarter: AustralianQuarter; range: QuarterDateRange }> {
    const quarters: AustralianQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters.map((quarter) => ({
      quarter,
      range: this.getQuarterDateRange(quarter, financialYear),
    }));
  }

  /**
   * Gets the current FY info based on today's date.
   *
   * @returns FY info for the current date
   */
  getCurrentFYInfo(): FYInfo {
    return this.getFYInfo(new Date());
  }
}
