import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FYSummary } from './fy-summary';
import type { FYSummaryDto } from '@/lib/api-client';

function createMockFYSummary(overrides?: Partial<FYSummaryDto>): FYSummaryDto {
  return {
    financialYear: 2026,
    fyLabel: 'FY2026',
    periodStart: '2025-07-01',
    periodEnd: '2026-06-30',
    income: {
      totalIncomeCents: 5500000,
      paidIncomeCents: 5000000,
      unpaidIncomeCents: 500000,
      gstCollectedCents: 500000,
      count: 45,
    },
    expenses: {
      totalExpensesCents: 2200000,
      gstPaidCents: 200000,
      count: 156,
      byCategory: [
        {
          categoryId: 1,
          name: 'Software',
          basLabel: '1B',
          totalCents: 1200000,
          gstCents: 109090,
          count: 50,
        },
        {
          categoryId: 2,
          name: 'Hosting',
          basLabel: '1B',
          totalCents: 1000000,
          gstCents: 90910,
          count: 106,
        },
      ],
    },
    netProfitCents: 3300000,
    netGstPayableCents: 300000,
    ...overrides,
  };
}

describe('FYSummary', () => {
  it('renders period dates correctly', () => {
    const mockData = createMockFYSummary();
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Financial Year Period')).toBeInTheDocument();
    expect(screen.getByText('1 Jul 2025 - 30 Jun 2026')).toBeInTheDocument();
  });

  it('displays income summary metrics', () => {
    const mockData = createMockFYSummary();
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Income Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(screen.getAllByText('$55,000.00')[0]).toBeInTheDocument(); // totalIncomeCents

    expect(screen.getByText('Paid Income')).toBeInTheDocument();
    expect(screen.getAllByText('$50,000.00')[0]).toBeInTheDocument(); // paidIncomeCents

    expect(screen.getByText('Unpaid Income')).toBeInTheDocument();
    expect(screen.getAllByText('$5,000.00')[0]).toBeInTheDocument(); // unpaidIncomeCents

    expect(screen.getByText('GST Collected')).toBeInTheDocument();
    expect(screen.getByText(/45 invoices/)).toBeInTheDocument();
  });

  it('displays expense summary metrics', () => {
    const mockData = createMockFYSummary();
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Expenses Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(screen.getByText('$22,000.00')).toBeInTheDocument(); // totalExpensesCents

    expect(screen.getByText('GST Paid')).toBeInTheDocument();
    expect(screen.getByText('$2,000.00')).toBeInTheDocument(); // gstPaidCents

    expect(screen.getByText(/156 expenses/)).toBeInTheDocument();
    expect(screen.getByText(/2 categories used/)).toBeInTheDocument();
  });

  it('displays net profit when profitable', () => {
    const mockData = createMockFYSummary({ netProfitCents: 3300000 });
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Net Profit')).toBeInTheDocument();
    expect(screen.getByText('$33,000.00')).toBeInTheDocument();
    expect(screen.getByText('Total income minus total expenses')).toBeInTheDocument();
  });

  it('displays net loss when unprofitable', () => {
    const mockData = createMockFYSummary({ netProfitCents: -1500000 });
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Net Loss')).toBeInTheDocument();
    expect(screen.getByText('$15,000.00')).toBeInTheDocument(); // Absolute value
    expect(screen.getByText('Loss for the financial year')).toBeInTheDocument();
  });

  it('displays net GST payable when owing to ATO', () => {
    const mockData = createMockFYSummary({ netGstPayableCents: 300000 });
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Net GST Payable')).toBeInTheDocument();
    expect(screen.getByText('$3,000.00')).toBeInTheDocument();
    expect(screen.getByText('GST payable to ATO')).toBeInTheDocument();
  });

  it('displays net GST refund when expecting refund from ATO', () => {
    const mockData = createMockFYSummary({ netGstPayableCents: -150000 });
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Net GST Refund')).toBeInTheDocument();
    expect(screen.getByText('$1,500.00')).toBeInTheDocument(); // Absolute value
    expect(screen.getByText('GST refund expected from ATO')).toBeInTheDocument();
  });

  it('handles zero unpaid income', () => {
    const mockData = createMockFYSummary({
      income: {
        totalIncomeCents: 5000000,
        paidIncomeCents: 5000000,
        unpaidIncomeCents: 0,
        gstCollectedCents: 454545,
        count: 50,
      },
    });
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText('Unpaid Income')).toBeInTheDocument();
    expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0);
  });

  it('handles single invoice correctly (singular text)', () => {
    const mockData = createMockFYSummary({
      income: {
        totalIncomeCents: 11000,
        paidIncomeCents: 11000,
        unpaidIncomeCents: 0,
        gstCollectedCents: 1000,
        count: 1,
      },
    });
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText(/1 invoice/)).toBeInTheDocument();
  });

  it('handles single expense correctly (singular text)', () => {
    const mockData = createMockFYSummary({
      expenses: {
        totalExpensesCents: 11000,
        gstPaidCents: 1000,
        count: 1,
        byCategory: [
          {
            categoryId: 1,
            name: 'Software',
            basLabel: '1B',
            totalCents: 11000,
            gstCents: 1000,
            count: 1,
          },
        ],
      },
    });
    render(<FYSummary fy={mockData} />);

    expect(screen.getByText(/1 expense/)).toBeInTheDocument();
    expect(screen.getByText(/1 category used/)).toBeInTheDocument();
  });

  it('has proper ARIA sections for accessibility', () => {
    const mockData = createMockFYSummary();
    render(<FYSummary fy={mockData} />);

    expect(screen.getByRole('region', { name: 'Income Summary' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Expenses Summary' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Net Position Summary' })).toBeInTheDocument();
  });
});
