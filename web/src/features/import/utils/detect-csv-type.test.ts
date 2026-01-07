import { describe, it, expect } from 'vitest';
import { detectCsvType, parseFirstLine } from './detect-csv-type';

describe('detectCsvType', () => {
  describe('Happy Paths - Expense Detection', () => {
    it('detects CommBank expense format', () => {
      const headers = ['Date', 'Description', 'Debit Amount', 'Credit Amount'];
      expect(detectCsvType(headers)).toBe('expense');
    });

    it('detects Amex expense format', () => {
      const headers = ['Date', 'Description', 'Amount'];
      expect(detectCsvType(headers)).toBe('expense');
    });

    it('detects custom expense format', () => {
      const headers = ['date', 'description', 'amount', 'provider'];
      expect(detectCsvType(headers)).toBe('expense');
    });

    it('detects custom expense format with minimal columns', () => {
      const headers = ['date', 'description', 'amount'];
      expect(detectCsvType(headers)).toBe('expense');
    });
  });

  describe('Happy Paths - Income Detection', () => {
    it('detects custom income format with subtotal', () => {
      const headers = ['date', 'client', 'invoice', 'subtotal', 'gst'];
      expect(detectCsvType(headers)).toBe('income');
    });

    it('detects custom income format with total instead of subtotal', () => {
      const headers = ['date', 'client', 'invoice', 'total'];
      expect(detectCsvType(headers)).toBe('income');
    });

    it('detects income format with client and subtotal', () => {
      const headers = ['date', 'client', 'subtotal', 'gst'];
      expect(detectCsvType(headers)).toBe('income');
    });

    it('detects income format with invoice and total', () => {
      const headers = ['date', 'invoice', 'total'];
      expect(detectCsvType(headers)).toBe('income');
    });
  });

  describe('Edge Cases', () => {
    it('returns unknown for empty header array', () => {
      const headers: string[] = [];
      expect(detectCsvType(headers)).toBe('unknown');
    });

    it('returns unknown for malformed CSV with random headers', () => {
      const headers = ['foo', 'bar', 'baz'];
      expect(detectCsvType(headers)).toBe('unknown');
    });

    it('handles case-insensitive detection (uppercase)', () => {
      const headers = ['DATE', 'DESCRIPTION', 'AMOUNT'];
      expect(detectCsvType(headers)).toBe('expense');
    });

    it('handles case-insensitive detection (mixed case)', () => {
      const headers = ['Date', 'Client', 'SubTotal', 'GST'];
      expect(detectCsvType(headers)).toBe('income');
    });

    it('trims whitespace from headers', () => {
      const headers = [' date ', '  description  ', ' amount '];
      expect(detectCsvType(headers)).toBe('expense');
    });

    it('handles CSV with many columns (expense)', () => {
      const headers = ['Date', 'Description', 'Amount', 'Balance', 'Category', 'Notes'];
      expect(detectCsvType(headers)).toBe('expense');
    });

    it('handles CSV with many columns (income)', () => {
      const headers = ['Date', 'Client', 'Invoice', 'Subtotal', 'GST', 'Total', 'Paid'];
      expect(detectCsvType(headers)).toBe('income');
    });
  });

  describe('Error Scenarios', () => {
    it('returns unknown when only one header present', () => {
      const headers = ['date'];
      expect(detectCsvType(headers)).toBe('unknown');
    });

    it('returns unknown for ambiguous headers', () => {
      // Has 'amount' but no description or date
      const headers = ['amount', 'foo', 'bar'];
      expect(detectCsvType(headers)).toBe('unknown');
    });
  });
});

describe('parseFirstLine', () => {
  it('parses CSV headers from file content', () => {
    const csvContent = 'Date,Description,Amount\n2024-01-01,Test,100.00';
    const headers = parseFirstLine(csvContent);
    expect(headers).toEqual(['Date', 'Description', 'Amount']);
  });

  it('handles CSV with quoted headers', () => {
    const csvContent = '"Date","Description","Amount"\n"2024-01-01","Test","100.00"';
    const headers = parseFirstLine(csvContent);
    expect(headers).toEqual(['Date', 'Description', 'Amount']);
  });

  it('handles CSV with BOM (Byte Order Mark)', () => {
    const csvContent = '\uFEFFDate,Description,Amount\n2024-01-01,Test,100.00';
    const headers = parseFirstLine(csvContent);
    expect(headers).toEqual(['Date', 'Description', 'Amount']);
  });

  it('handles empty CSV content', () => {
    const csvContent = '';
    const headers = parseFirstLine(csvContent);
    expect(headers).toEqual([]);
  });

  it('handles CSV with only headers (no data rows)', () => {
    const csvContent = 'Date,Description,Amount';
    const headers = parseFirstLine(csvContent);
    expect(headers).toEqual(['Date', 'Description', 'Amount']);
  });

  it('handles CSV with tabs as delimiter', () => {
    const csvContent = 'Date\tDescription\tAmount\n2024-01-01\tTest\t100.00';
    const headers = parseFirstLine(csvContent);
    expect(headers).toEqual(['Date', 'Description', 'Amount']);
  });

  it('handles CSV with semicolon delimiter', () => {
    const csvContent = 'Date;Description;Amount\n2024-01-01;Test;100.00';
    const headers = parseFirstLine(csvContent);
    expect(headers).toEqual(['Date', 'Description', 'Amount']);
  });
});
