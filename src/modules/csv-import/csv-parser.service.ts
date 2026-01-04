import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import Decimal from 'decimal.js';
import { CsvColumnMapping, ParsedCsvRow, CSV_COLUMN_MAPPINGS } from './csv-import.types';

/**
 * Service for parsing CSV files into structured data.
 * Handles various date formats, currency parsing, and column mapping.
 */
@Injectable()
export class CsvParserService {
  /**
   * Parse a CSV buffer into structured rows.
   *
   * @param buffer - CSV file content
   * @param mapping - Column mapping configuration
   * @returns Array of parsed rows
   */
  parseBuffer(buffer: Buffer, mapping: CsvColumnMapping): ParsedCsvRow[] {
    const content = buffer.toString('utf-8');
    return this.parseString(content, mapping);
  }

  /**
   * Parse a CSV string into structured rows.
   *
   * @param content - CSV content as string
   * @param mapping - Column mapping configuration
   * @returns Array of parsed rows
   */
  parseString(content: string, mapping: CsvColumnMapping): ParsedCsvRow[] {
    // csv-parse/sync returns unknown, cast to our expected type
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as Record<string, string>[];

    const results: ParsedCsvRow[] = [];
    let rowNumber = 0;

    for (const record of records) {
      rowNumber++;

      // Skip rows without required fields
      const itemValue = record[mapping.item] as string | undefined;
      const totalValue = record[mapping.total] as string | undefined;
      const dateValue = record[mapping.date] as string | undefined;

      if (!itemValue || !totalValue || !dateValue) {
        continue;
      }

      // Skip summary/total rows
      if (this.isSummaryRow(itemValue, totalValue)) {
        continue;
      }

      try {
        const parsed = this.parseRow(record, mapping, rowNumber);
        if (parsed) {
          results.push(parsed);
        }
      } catch {
        // Skip rows that fail to parse (will be handled by import service)
        continue;
      }
    }

    return results;
  }

  /**
   * Parse a single CSV row into structured data.
   */
  private parseRow(
    record: Record<string, string>,
    mapping: CsvColumnMapping,
    rowNumber: number,
  ): ParsedCsvRow | null {
    const dateValue = record[mapping.date];
    const itemValue = record[mapping.item];
    const totalValue = record[mapping.total];
    const gstValue = mapping.gst ? record[mapping.gst] : undefined;
    const bizPercentValue = mapping.bizPercent ? record[mapping.bizPercent] : undefined;
    const categoryValue = mapping.category ? record[mapping.category] : undefined;
    const descriptionValue = mapping.description ? record[mapping.description] : undefined;

    // Parse date
    const date = this.parseDate(dateValue);
    if (!date) {
      return null;
    }

    // Parse total amount
    const totalCents = this.parseCurrency(totalValue);
    if (totalCents === null || totalCents <= 0) {
      return null;
    }

    // Parse GST (defaults to 0 if not provided - will be calculated by import service)
    const gstCents = gstValue ? (this.parseCurrency(gstValue) ?? 0) : 0;

    // Parse business percentage (defaults to 100)
    const bizPercent = bizPercentValue ? this.parsePercentage(bizPercentValue) : 100;

    return {
      rowNumber,
      date,
      itemName: itemValue.trim(),
      totalCents,
      gstCents,
      bizPercent,
      categoryName: categoryValue?.trim() || undefined,
      description: descriptionValue?.trim() || undefined,
    };
  }

  /**
   * Check if a row appears to be a summary/total row.
   */
  private isSummaryRow(item: string, total: string): boolean {
    const lowerItem = item.toLowerCase();
    const lowerTotal = total.toLowerCase();

    return (
      lowerItem.includes('total') || lowerTotal.includes('total') || item === '' || total === ''
    );
  }

  /**
   * Parse a date string in various formats.
   * Supports: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, D/M/YYYY
   */
  parseDate(value: string): Date | null {
    if (!value || value.trim() === '') {
      return null;
    }

    const trimmed = value.trim();

    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    // Try DD/MM/YYYY or D/M/YYYY (Australian format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('/').map(Number);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return new Date(year, month - 1, day);
      }
    }

    // Try DD-MM-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('-').map(Number);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return new Date(year, month - 1, day);
      }
    }

    return null;
  }

  /**
   * Parse a currency string into cents.
   * Handles: $1,234.56, 1234.56, -$50.00, ($50.00)
   */
  parseCurrency(value: string): number | null {
    if (!value || value.trim() === '') {
      return null;
    }

    let trimmed = value.trim();

    // Check for parentheses (negative in accounting format)
    const isNegative =
      (trimmed.startsWith('(') && trimmed.endsWith(')')) || trimmed.startsWith('-');

    // Remove currency symbols, commas, parentheses, and spaces
    trimmed = trimmed
      .replace(/[$£€¥]/g, '')
      .replace(/,/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/-/g, '')
      .trim();

    if (trimmed === '' || trimmed === '0' || trimmed === '0.00') {
      return 0;
    }

    try {
      const decimal = new Decimal(trimmed);
      const cents = decimal.times(100).round().toNumber();
      return isNegative ? -cents : cents;
    } catch {
      return null;
    }
  }

  /**
   * Parse a percentage value (0-100).
   * Handles: 50, 50%, 0.5
   */
  parsePercentage(value: string): number {
    if (!value || value.trim() === '') {
      return 100;
    }

    const trimmed = value.trim().replace('%', '');

    try {
      const num = parseFloat(trimmed);

      // If value is between 0 and 1, treat as decimal (0.5 = 50%)
      if (num > 0 && num <= 1) {
        return Math.round(num * 100);
      }

      // Clamp to 0-100
      return Math.max(0, Math.min(100, Math.round(num)));
    } catch {
      return 100;
    }
  }

  /**
   * Get column mapping for a known source.
   */
  getMapping(source: string): CsvColumnMapping | undefined {
    return CSV_COLUMN_MAPPINGS[source.toLowerCase()];
  }

  /**
   * Auto-detect column mapping from CSV headers.
   */
  detectMapping(headers: string[]): CsvColumnMapping | null {
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim());

    // Look for date column
    const dateCol = headers.find((_, i) =>
      ['date', 'transaction date', 'trans date'].includes(lowerHeaders[i]),
    );

    // Look for item/description column
    const itemCol = headers.find((_, i) =>
      ['item', 'description', 'merchant', 'vendor', 'payee'].includes(lowerHeaders[i]),
    );

    // Look for amount column
    const totalCol = headers.find((_, i) =>
      ['total', 'amount', 'debit', 'value', 'price'].includes(lowerHeaders[i]),
    );

    if (!dateCol || !itemCol || !totalCol) {
      return null;
    }

    // Optional columns
    const gstCol = headers.find((_, i) => ['gst', 'tax', 'vat'].includes(lowerHeaders[i]));

    const bizCol = headers.find((_, i) =>
      ['biz%', 'biz', 'business', 'business%', 'business use'].includes(lowerHeaders[i]),
    );

    const catCol = headers.find((_, i) => ['category', 'cat', 'type'].includes(lowerHeaders[i]));

    return {
      date: dateCol,
      item: itemCol,
      total: totalCol,
      gst: gstCol,
      bizPercent: bizCol,
      category: catCol,
    };
  }

  /**
   * Extract headers from CSV content.
   */
  extractHeaders(content: string): string[] {
    const firstLine = content.split('\n')[0];
    if (!firstLine) {
      return [];
    }

    const records = parse(firstLine, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    });

    return records[0] || [];
  }
}
