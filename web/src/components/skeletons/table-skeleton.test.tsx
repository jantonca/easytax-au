import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TableSkeleton } from './table-skeleton';

describe('TableSkeleton', () => {
  it('renders with default 5 rows', () => {
    const { container } = render(<TableSkeleton columns={3} />);
    const rows = container.querySelectorAll('tbody tr');

    expect(rows).toHaveLength(5);
  });

  it('renders custom number of rows', () => {
    const { container } = render(<TableSkeleton columns={3} rows={10} />);
    const rows = container.querySelectorAll('tbody tr');

    expect(rows).toHaveLength(10);
  });

  it('renders correct number of columns per row', () => {
    const { container } = render(<TableSkeleton columns={8} rows={3} />);
    const firstRow = container.querySelector('tbody tr');
    const cells = firstRow?.querySelectorAll('td');

    expect(cells).toHaveLength(8);
  });

  it('renders table with proper semantic HTML', () => {
    const { container } = render(<TableSkeleton columns={3} />);
    const table = container.querySelector('table');
    const thead = container.querySelector('thead');
    const tbody = container.querySelector('tbody');

    expect(table).toBeInTheDocument();
    expect(thead).toBeInTheDocument();
    expect(tbody).toBeInTheDocument();
  });

  it('renders header row with correct number of columns', () => {
    const { container } = render(<TableSkeleton columns={5} />);
    const headerCells = container.querySelectorAll('thead th');

    expect(headerCells).toHaveLength(5);
  });

  it('renders with dark theme classes', () => {
    const { container } = render(<TableSkeleton columns={3} />);
    const section = container.querySelector('section');

    expect(section).toHaveClass('border-slate-800');
    expect(section).toHaveClass('bg-slate-900/60');
  });

  it('has aria-label for accessibility', () => {
    render(<TableSkeleton columns={3} ariaLabel="Loading expenses" />);
    const section = screen.getByLabelText('Loading expenses');

    expect(section).toBeInTheDocument();
  });

  it('uses default aria-label when not provided', () => {
    render(<TableSkeleton columns={3} />);
    const section = screen.getByLabelText('Loading data');

    expect(section).toBeInTheDocument();
  });

  it('renders skeleton components in each cell', () => {
    const { container } = render(<TableSkeleton columns={2} rows={2} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');

    // Should have skeletons in header (2) + body cells (2 rows * 2 cols = 4) = 6 total
    expect(skeletons.length).toBeGreaterThanOrEqual(6);
  });
});
