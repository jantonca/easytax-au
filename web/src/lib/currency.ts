export type Currency = {
  cents: number;
};

const formatter = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(amountInCents: number): string {
  const dollars = amountInCents / 100;
  return formatter.format(dollars);
}

export function parseCurrency(input: string): Currency {
  const normalized = input.replace(/[^0-9.-]/g, '');
  const value = Number.parseFloat(normalized || '0');

  if (Number.isNaN(value)) {
    throw new Error('Invalid currency value');
  }

  return { cents: Math.round(value * 100) };
}

/**
 * Format date in Australian format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}/${month}/${year}`;
}
