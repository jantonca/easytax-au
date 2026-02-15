import { describe, it, expect } from 'vitest';
import {
  generateExpenseTemplate,
  generateIncomeTemplate,
  type TemplateFormat,
} from './generate-csv-template';

describe('generateExpenseTemplate', () => {
  it('generates CommBank format template with correct headers', () => {
    const csv = generateExpenseTemplate('commbank');
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Date,Description,Debit,Credit,Balance');
    expect(lines.length).toBeGreaterThan(1); // Has example rows
  });

  it('generates CommBank format template with example rows', () => {
    const csv = generateExpenseTemplate('commbank');
    const lines = csv.split('\n');

    // Should have at least 2 example rows
    expect(lines.length).toBeGreaterThanOrEqual(3); // Header + 2 examples

    // Example row format: DD/MM/YYYY,Description,Amount,,Balance
    const exampleRow = lines[1];
    const columns = exampleRow.split(',');

    expect(columns.length).toBe(5);
    expect(columns[0]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/); // Date: DD/MM/YYYY
    expect(columns[1]).toBeTruthy(); // Description exists
    expect(columns[2]).toMatch(/^\d+\.\d{2}$/); // Debit: decimal number
  });

  it('generates Generic/Custom format template with correct headers', () => {
    const csv = generateExpenseTemplate('custom');
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Date,Item,Total,GST,Biz%,Category');
    expect(lines.length).toBeGreaterThan(1); // Has example rows
  });

  it('generates Generic format template with example rows showing different business percentages', () => {
    const csv = generateExpenseTemplate('custom');
    const lines = csv.split('\n');

    // Should have at least 3 example rows (100%, 100%, 50%)
    expect(lines.length).toBeGreaterThanOrEqual(4); // Header + 3 examples

    // Check first two examples: 100% business use
    const example1 = lines[1].split(',');
    expect(example1[4]).toBe('100'); // Biz% = 100

    const example2 = lines[2].split(',');
    expect(example2[4]).toBe('100'); // Biz% = 100

    // Check third example: partial business use (50%)
    const example3 = lines[3].split(',');
    expect(example3[4]).toBe('50'); // Biz% = 50 (less than 100%)
  });

  it('generates Generic format with valid GST calculations', () => {
    const csv = generateExpenseTemplate('custom');
    const lines = csv.split('\n');

    // First row is international (GitHub) - no GST
    const example1 = lines[1].split(',');
    expect(parseFloat(example1[3])).toBe(0.00); // GST = 0 for international

    // Second row is domestic (VentraIP) - has GST
    const example2 = lines[2].split(',');
    const total2 = parseFloat(example2[2]);
    const gst2 = parseFloat(example2[3]);
    const expectedGst2 = total2 / 11; // Reverse GST calculation
    expect(gst2).toBeCloseTo(expectedGst2, 2);
  });

  it('generates Amex format template with correct headers', () => {
    const csv = generateExpenseTemplate('amex');
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Date,Description,Amount');
    expect(lines.length).toBeGreaterThan(1); // Has example rows
  });

  it('throws error for unsupported expense format', () => {
    expect(() => {
      generateExpenseTemplate('invalid' as TemplateFormat);
    }).toThrow('Unsupported template format: invalid');
  });
});

describe('generateIncomeTemplate', () => {
  it('generates Income format template with correct headers', () => {
    const csv = generateIncomeTemplate();
    const lines = csv.split('\n');

    expect(lines[0]).toBe('Client,Invoice #,Subtotal,GST,Total,Date,Description');
    expect(lines.length).toBeGreaterThan(1); // Has example rows
  });

  it('generates Income template with example rows', () => {
    const csv = generateIncomeTemplate();
    const lines = csv.split('\n');

    // Should have at least 2 example rows
    expect(lines.length).toBeGreaterThanOrEqual(3); // Header + 2 examples

    const exampleRow = lines[1].split(',');
    expect(exampleRow.length).toBe(7);
    expect(exampleRow[0]).toBeTruthy(); // Client name exists
    expect(exampleRow[1]).toMatch(/^INV-\d+$/); // Invoice format: INV-001
  });

  it('generates Income template with correct GST calculations', () => {
    const csv = generateIncomeTemplate();
    const lines = csv.split('\n');

    const exampleRow = lines[1].split(',');
    const subtotal = parseFloat(exampleRow[2]);
    const gst = parseFloat(exampleRow[3]);
    const total = parseFloat(exampleRow[4]);

    // GST should be 10% of subtotal
    expect(gst).toBeCloseTo(subtotal * 0.1, 2);

    // Total should equal subtotal + GST
    expect(total).toBeCloseTo(subtotal + gst, 2);
  });

  it('generates Income template with valid date format', () => {
    const csv = generateIncomeTemplate();
    const lines = csv.split('\n');

    const exampleRow = lines[1].split(',');
    const date = exampleRow[5];

    // Date should be DD/MM/YYYY format
    expect(date).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});
