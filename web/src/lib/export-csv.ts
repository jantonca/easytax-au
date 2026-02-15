/**
 * CSV Export Utilities
 *
 * Exports expenses and incomes to CSV format for backup or analysis.
 */

import type { ExpenseResponseDto, IncomeResponseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';
import { downloadCsv } from '@/features/import/utils/generate-csv-template';

/**
 * Formats a date as DD/MM/YYYY
 */
function formatDate(date: string | Date): string {
  const dateStr = String(date);
  const isoDate = dateStr.slice(0, 10); // Get YYYY-MM-DD
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Escapes a CSV field value to handle commas, quotes, and newlines
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If the field contains comma, quote, or newline, wrap it in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Gets the provider name from an expense safely
 */
function getProviderName(expense: ExpenseResponseDto): string {
  const provider = (expense as unknown as { provider?: { name?: unknown } | null }).provider;
  const raw = provider?.name;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : '';
}

/**
 * Gets the category name from an expense safely
 */
function getCategoryName(expense: ExpenseResponseDto): string {
  const category = (expense as unknown as { category?: { name?: unknown } | null }).category;
  const raw = category?.name;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : '';
}

/**
 * Gets the description from an expense safely
 */
function getExpenseDescription(expense: ExpenseResponseDto): string {
  const raw = (expense as unknown as { description?: unknown }).description;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : '';
}

/**
 * Exports expenses to CSV format and triggers download
 */
export function exportExpensesToCsv(expenses: ExpenseResponseDto[]): void {
  const headers = [
    'Date',
    'Description',
    'Provider',
    'Category',
    'Amount',
    'GST',
    'Biz %',
    'Quarter',
    'Financial Year',
  ];

  const rows = expenses.map((expense) => {
    return [
      formatDate(expense.date),
      escapeCsvField(getExpenseDescription(expense)),
      escapeCsvField(getProviderName(expense)),
      escapeCsvField(getCategoryName(expense)),
      formatCents(expense.amountCents),
      formatCents(expense.gstCents),
      String(expense.bizPercent),
      escapeCsvField(expense.quarter),
      escapeCsvField(expense.fyLabel),
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(csv, `expenses-export-${timestamp}.csv`);
}

/**
 * Gets the description from an income safely
 */
function getIncomeDescription(income: IncomeResponseDto): string {
  const raw = (income as unknown as { description?: unknown }).description;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : '';
}

/**
 * Exports incomes to CSV format and triggers download
 */
export function exportIncomesToCsv(incomes: IncomeResponseDto[]): void {
  const headers = [
    'Date',
    'Client',
    'Invoice #',
    'Description',
    'Subtotal',
    'GST',
    'Total',
    'Paid Status',
  ];

  const rows = incomes.map((income) => {
    return [
      formatDate(income.date),
      escapeCsvField(income.client.name),
      escapeCsvField(income.invoiceNum || ''),
      escapeCsvField(getIncomeDescription(income)),
      formatCents(income.subtotalCents),
      formatCents(income.gstCents),
      formatCents(income.totalCents),
      income.isPaid ? 'Paid' : 'Unpaid',
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  downloadCsv(csv, `incomes-export-${timestamp}.csv`);
}
