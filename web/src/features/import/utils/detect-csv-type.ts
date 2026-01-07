/**
 * CSV Type Detection Utility
 *
 * Analyzes CSV headers to automatically determine if the file contains
 * expense or income data based on column names.
 */

export type CsvType = 'expense' | 'income' | 'unknown';

/**
 * Detects whether a CSV file contains expense or income data based on headers.
 *
 * @param headers - Array of CSV column headers (case-insensitive)
 * @returns 'expense' | 'income' | 'unknown'
 *
 * @example
 * detectCsvType(['Date', 'Description', 'Amount']) // => 'expense'
 * detectCsvType(['date', 'client', 'subtotal', 'gst']) // => 'income'
 * detectCsvType(['foo', 'bar']) // => 'unknown'
 */
export function detectCsvType(headers: string[]): CsvType {
  if (headers.length === 0) {
    return 'unknown';
  }

  // Normalize headers: lowercase + trim whitespace
  const normalized = headers.map((h) => h.toLowerCase().trim());

  // Income detection: requires (client OR invoice) AND (subtotal OR total)
  const hasClient = normalized.includes('client');
  const hasInvoice = normalized.includes('invoice');
  const hasSubtotal = normalized.includes('subtotal');
  const hasTotal = normalized.includes('total');

  const isIncome = (hasClient || hasInvoice) && (hasSubtotal || hasTotal);

  if (isIncome) {
    return 'income';
  }

  // Expense detection: requires amount AND (description OR date)
  // Check for 'amount' or any column containing 'amount' (e.g., 'Debit Amount', 'Credit Amount')
  const hasAmount = normalized.some((h) => h.includes('amount'));
  const hasDescription = normalized.includes('description');
  const hasDate = normalized.includes('date');

  const isExpense = hasAmount && (hasDescription || hasDate);

  if (isExpense) {
    return 'expense';
  }

  return 'unknown';
}

/**
 * Parses the first line of CSV content to extract headers.
 *
 * Supports:
 * - Comma-separated (default)
 * - Tab-separated
 * - Semicolon-separated
 * - Quoted values
 * - BOM (Byte Order Mark) prefix
 *
 * @param csvContent - Raw CSV file content as string
 * @returns Array of header strings
 *
 * @example
 * parseFirstLine('Date,Description,Amount\n2024-01-01,Test,100') // => ['Date', 'Description', 'Amount']
 * parseFirstLine('"Date","Client","Total"') // => ['Date', 'Client', 'Total']
 */
export function parseFirstLine(csvContent: string): string[] {
  if (!csvContent || csvContent.trim().length === 0) {
    return [];
  }

  // Remove BOM if present
  let content = csvContent;
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  // Get first line (handle \r\n, \n, and \r)
  const firstLine = content.split(/\r?\n/)[0];

  if (!firstLine || firstLine.trim().length === 0) {
    return [];
  }

  // Detect delimiter: try comma, tab, semicolon
  let delimiter = ',';
  if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(';') && !firstLine.includes(',')) {
    delimiter = ';';
  }

  // Parse CSV headers (handle quoted values)
  const headers = firstLine.split(delimiter).map((header) => {
    // Remove surrounding quotes if present
    let cleaned = header.trim();
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1);
    }
    return cleaned;
  });

  return headers;
}

/**
 * Detects CSV type directly from file content.
 *
 * Convenience function that combines parseFirstLine() and detectCsvType().
 *
 * @param csvContent - Raw CSV file content as string
 * @returns 'expense' | 'income' | 'unknown'
 *
 * @example
 * detectCsvTypeFromContent('Date,Description,Amount\n2024-01-01,Test,100') // => 'expense'
 */
export function detectCsvTypeFromContent(csvContent: string): CsvType {
  const headers = parseFirstLine(csvContent);
  return detectCsvType(headers);
}
