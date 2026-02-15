/**
 * CSV Template Generator
 *
 * Generates downloadable CSV templates with example rows for:
 * - Expense imports (CommBank, Generic/Custom, Amex formats)
 * - Income imports (Standard format)
 *
 * All templates follow Australian date format (DD/MM/YYYY) and GST rules (10%).
 */

export type TemplateFormat = 'commbank' | 'custom' | 'amex' | 'income';

/**
 * Formats a date as DD/MM/YYYY
 */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a number as currency with 2 decimal places
 */
function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Generates expense CSV template for the specified format.
 *
 * @param format - Template format: 'commbank', 'custom', or 'amex'
 * @returns CSV string with headers and example rows
 */
export function generateExpenseTemplate(format: TemplateFormat): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  switch (format) {
    case 'commbank':
      return [
        'Date,Description,Debit,Credit,Balance',
        `${formatDate(lastWeek)},GITHUB INC,29.95,,5234.56`,
        `${formatDate(yesterday)},VENTRAIP PTY LTD,165.00,,5069.56`,
        `${formatDate(today)},IINET LIMITED,89.95,,4979.61`,
      ].join('\n');

    case 'custom':
      // Custom format with full control over GST and business percentage
      // Example 1: International provider (no GST), 100% business
      // Example 2: Domestic provider with GST, 100% business
      // Example 3: Domestic provider with GST, 50% business (mixed use)
      return [
        'Date,Item,Total,GST,Biz%,Category',
        `${formatDate(lastWeek)},GitHub,29.95,0.00,100,Software`,
        `${formatDate(yesterday)},VentraIP,${formatCurrency(16500)},${formatCurrency(1500)},100,Hosting`,
        `${formatDate(today)},iinet,${formatCurrency(8995)},${formatCurrency(818)},50,Internet`,
      ].join('\n');

    case 'amex':
      return [
        'Date,Description,Amount',
        `${formatDate(lastWeek)},GITHUB INC,29.95`,
        `${formatDate(yesterday)},JETBRAINS,199.00`,
        `${formatDate(today)},GOOGLE WORKSPACE,18.00`,
      ].join('\n');

    default:
      throw new Error(`Unsupported template format: ${format}`);
  }
}

/**
 * Generates income CSV template.
 *
 * @returns CSV string with headers and example rows showing GST calculations
 */
export function generateIncomeTemplate(): string {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Example 1: $5000 + $500 GST = $5500 total
  const example1Subtotal = 500000; // cents
  const example1Gst = 50000; // cents (10%)
  const example1Total = 550000; // cents

  // Example 2: $2500 + $250 GST = $2750 total
  const example2Subtotal = 250000; // cents
  const example2Gst = 25000; // cents (10%)
  const example2Total = 275000; // cents

  return [
    'Client,Invoice #,Subtotal,GST,Total,Date,Description',
    `Acme Corp,INV-001,${formatCurrency(example1Subtotal)},${formatCurrency(example1Gst)},${formatCurrency(example1Total)},${formatDate(lastMonth)},Website development`,
    `Tech Startup Pty Ltd,INV-002,${formatCurrency(example2Subtotal)},${formatCurrency(example2Gst)},${formatCurrency(example2Total)},${formatDate(today)},Mobile app consultation`,
  ].join('\n');
}

/**
 * Downloads a CSV file to the user's browser.
 *
 * @param content - CSV content as string
 * @param filename - Downloaded filename (e.g., 'expense-template-commbank.csv')
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
