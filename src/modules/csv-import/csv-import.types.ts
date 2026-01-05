import { ProviderMatch } from './provider-matcher.service';
import { Expense } from '../expenses/entities/expense.entity';
import { Income } from '../incomes/entities/income.entity';

// =============================================================================
// EXPENSE CSV TYPES (existing)
// =============================================================================

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

// =============================================================================
// INCOME CSV TYPES
// =============================================================================

/**
 * Column mapping for income CSV files.
 * Format: Client, Invoice #, Subtotal, GST, Total
 */
export interface IncomeCsvColumnMapping {
  /** Column name for client name */
  client: string;
  /** Column name for invoice number (optional) */
  invoiceNum?: string;
  /** Column name for subtotal (before GST) */
  subtotal: string;
  /** Column name for GST amount */
  gst: string;
  /** Column name for total (subtotal + GST) */
  total: string;
  /** Column name for date (optional - defaults to import date) */
  date?: string;
  /** Column name for description (optional) */
  description?: string;
}

/**
 * Client match result from fuzzy matching.
 */
export interface ClientMatch {
  /** Matched client ID */
  clientId: string;
  /** Matched client name */
  clientName: string;
  /** Similarity score (0-1) */
  score: number;
  /** Type of match: exact, fuzzy, or partial */
  matchType: 'exact' | 'fuzzy' | 'partial';
}

/**
 * Parsed row from income CSV before processing.
 */
export interface ParsedIncomeCsvRow {
  /** Row number in the CSV (1-indexed, excluding header) */
  rowNumber: number;
  /** Client name from CSV */
  clientName: string;
  /** Invoice number from CSV (if provided) */
  invoiceNum?: string;
  /** Subtotal amount in cents (before GST) */
  subtotalCents: number;
  /** GST amount in cents */
  gstCents: number;
  /** Total amount in cents from CSV */
  totalCentsFromCsv: number;
  /** Calculated total (subtotalCents + gstCents) */
  calculatedTotalCents: number;
  /** Whether CSV total matches calculated total */
  totalMatches: boolean;
  /** Invoice date (if provided) */
  date?: Date;
  /** Description from CSV (if provided) */
  description?: string;
}

/**
 * Result of processing a single income CSV row.
 */
export interface IncomeCsvRowResult {
  /** Row number in the CSV */
  rowNumber: number;
  /** Whether the row was successfully processed */
  success: boolean;
  /** Error message (if failed) */
  error?: string;
  /** Warning message (e.g., total mismatch) */
  warning?: string;
  /** Whether this row was a duplicate */
  isDuplicate?: boolean;
  /** Client match result */
  clientMatch: ClientMatch | null;
  /** Income data to be created */
  incomeData?: Partial<Income>;
}

/**
 * Result of processing an entire income CSV import.
 */
export interface IncomeCsvImportResult {
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
  /** Rows with warnings (e.g., total mismatch) */
  warningCount: number;
  /** Total subtotal in cents */
  totalSubtotalCents: number;
  /** Total GST collected in cents */
  totalGstCents: number;
  /** Total amount in cents */
  totalAmountCents: number;
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Detailed results per row */
  rows: IncomeCsvRowResult[];
}

/**
 * Options for income CSV import.
 */
export interface IncomeCsvImportOptions {
  /** Source format (custom, etc.) */
  source?: string;
  /** Custom column mapping (overrides source) */
  mapping?: IncomeCsvColumnMapping;
  /** Client matching threshold (0-1), default 0.6 */
  matchThreshold?: number;
  /** Skip duplicate detection */
  skipDuplicates?: boolean;
  /** Dry run - preview without creating incomes */
  dryRun?: boolean;
  /** Default date if not in CSV (defaults to today) */
  defaultDate?: Date;
  /** Mark all imported incomes as paid */
  markAsPaid?: boolean;
}

/**
 * Predefined column mappings for income CSV sources.
 */
export const INCOME_CSV_COLUMN_MAPPINGS: Record<string, IncomeCsvColumnMapping> = {
  /** Custom spreadsheet format (Client, Invoice #, Subtotal, GST, Total, Date, Description) */
  custom: {
    client: 'Client',
    invoiceNum: 'Invoice #',
    subtotal: 'Subtotal',
    gst: 'GST',
    total: 'Total',
    date: 'Date',
    description: 'Description',
  },
};
