import { ProviderMatch } from './provider-matcher.service';
import { Expense } from '../expenses/entities/expense.entity';

/**
 * Supported CSV column mappings for different sources.
 */
export interface CsvColumnMapping {
  /** Column name for transaction date */
  date: string;
  /** Column name for provider/vendor/item */
  item: string;
  /** Column name for total amount (GST-inclusive) */
  total: string;
  /** Column name for GST amount (optional) */
  gst?: string;
  /** Column name for business use percentage (optional) */
  bizPercent?: string;
  /** Column name for category (optional) */
  category?: string;
  /** Column name for description (optional) */
  description?: string;
}

/**
 * Parsed row from CSV before processing.
 */
export interface ParsedCsvRow {
  /** Row number in the CSV (1-indexed, excluding header) */
  rowNumber: number;
  /** Transaction date */
  date: Date;
  /** Provider/vendor name from CSV */
  itemName: string;
  /** Total amount in cents (GST-inclusive) */
  totalCents: number;
  /** GST amount in cents */
  gstCents: number;
  /** Business use percentage (0-100) */
  bizPercent: number;
  /** Category name from CSV (if provided) */
  categoryName?: string;
  /** Description from CSV (if provided) */
  description?: string;
}

/**
 * Result of processing a single CSV row.
 */
export interface CsvRowResult {
  /** Row number in the CSV */
  rowNumber: number;
  /** Whether the row was successfully processed */
  success: boolean;
  /** Error message (if failed) */
  error?: string;
  /** Whether this row was a duplicate */
  isDuplicate?: boolean;
  /** Provider match result */
  providerMatch: ProviderMatch | null;
  /** Category name that was matched */
  categoryName?: string;
  /** Expense data to be created */
  expenseData?: Partial<Expense>;
}

/**
 * Result of processing an entire CSV import.
 */
export interface CsvImportResult {
  /** Import job ID */
  importJobId: string;
  /** Total rows in CSV (excluding header and empty rows) */
  totalRows: number;
  /** Successfully processed rows */
  successCount: number;
  /** Failed rows */
  failedCount: number;
  /** Duplicate rows skipped */
  duplicateCount: number;
  /** Total amount in cents */
  totalAmountCents: number;
  /** Total GST in cents */
  totalGstCents: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Detailed results per row */
  rows: CsvRowResult[];
}

/**
 * Options for CSV import.
 */
export interface CsvImportOptions {
  /** Source format (custom, commbank, amex, etc.) */
  source?: string;
  /** Custom column mapping (overrides source) */
  mapping?: CsvColumnMapping;
  /** Provider matching threshold (0-1), default 0.6 */
  matchThreshold?: number;
  /** Skip duplicate detection */
  skipDuplicates?: boolean;
  /** Dry run - preview without creating expenses */
  dryRun?: boolean;
}

/**
 * Predefined column mappings for known CSV sources.
 */
export const CSV_COLUMN_MAPPINGS: Record<string, CsvColumnMapping> = {
  /** Custom spreadsheet format (Date,Item,Total,GST,Biz%,Category) */
  custom: {
    date: 'Date',
    item: 'Item',
    total: 'Total',
    gst: 'GST',
    bizPercent: 'Biz%',
    category: 'Category',
  },
  /** CommBank CSV export format */
  commbank: {
    date: 'Date',
    item: 'Description',
    total: 'Debit',
    description: 'Description',
  },
  /** Amex CSV export format */
  amex: {
    date: 'Date',
    item: 'Description',
    total: 'Amount',
    description: 'Description',
  },
};
