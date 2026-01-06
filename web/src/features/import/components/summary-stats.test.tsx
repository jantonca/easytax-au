import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryStats } from './summary-stats';

describe('SummaryStats', () => {
  it('renders all four stat cards', () => {
    const data = {
      totalRows: 100,
      successCount: 85,
      failedCount: 10,
      duplicateCount: 5,
    };

    render(<SummaryStats data={data} />);

    expect(screen.getByText('Total Rows')).toBeInTheDocument();
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    expect(screen.getByText('Duplicates')).toBeInTheDocument();
  });

  it('displays correct counts for each stat', () => {
    const data = {
      totalRows: 150,
      successCount: 120,
      failedCount: 25,
      duplicateCount: 5,
    };

    render(<SummaryStats data={data} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('applies correct color classes to stat cards', () => {
    const data = {
      totalRows: 10,
      successCount: 8,
      failedCount: 1,
      duplicateCount: 1,
    };

    render(<SummaryStats data={data} />);

    const totalCard = screen.getByText('Total Rows').closest('div');
    const validCard = screen.getByText('Valid').closest('div');
    const errorsCard = screen.getByText('Errors').closest('div');
    const duplicatesCard = screen.getByText('Duplicates').closest('div');

    // Total Rows - slate colors
    expect(totalCard).toHaveClass('dark:border-slate-800');
    expect(totalCard).toHaveClass('dark:bg-slate-900/40');

    // Valid - emerald colors
    expect(validCard).toHaveClass('dark:border-emerald-800');
    expect(validCard).toHaveClass('dark:bg-emerald-950/40');

    // Errors - red colors
    expect(errorsCard).toHaveClass('dark:border-red-800');
    expect(errorsCard).toHaveClass('dark:bg-red-950/40');

    // Duplicates - amber colors
    expect(duplicatesCard).toHaveClass('dark:border-amber-800');
    expect(duplicatesCard).toHaveClass('dark:bg-amber-950/40');
  });

  it('handles zero counts gracefully', () => {
    const data = {
      totalRows: 0,
      successCount: 0,
      failedCount: 0,
      duplicateCount: 0,
    };

    render(<SummaryStats data={data} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(4);
  });

  it('applies correct text colors to stat values', () => {
    const data = {
      totalRows: 100,
      successCount: 85,
      failedCount: 10,
      duplicateCount: 5,
    };

    render(<SummaryStats data={data} />);

    const validValue = screen.getByText('85');
    const errorsValue = screen.getByText('10');
    const duplicatesValue = screen.getByText('5');

    expect(validValue).toHaveClass('dark:text-emerald-400');
    expect(errorsValue).toHaveClass('dark:text-red-400');
    expect(duplicatesValue).toHaveClass('dark:text-amber-400');
  });
});
