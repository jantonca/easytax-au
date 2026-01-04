import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { YearSelector } from './year-selector';

// Mock getFYInfo to return a predictable current FY
vi.mock('@/lib/fy', () => ({
  getFYInfo: () => ({
    financialYear: 2026,
    quarter: 'Q2',
    fyLabel: 'FY2026',
    quarterLabel: 'Q2 FY2026',
  }),
}));

describe('YearSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders year selector with available years', () => {
    render(<YearSelector value={2026} onChange={mockOnChange} />);

    const select = screen.getByLabelText('Financial Year');
    expect(select).toBeInTheDocument();

    // Should show current FY + last 3 years (4 options total)
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(4);

    expect(screen.getByRole('option', { name: /FY2026/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /FY2025/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /FY2024/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /FY2023/ })).toBeInTheDocument();
  });

  it('displays correct year labels with periods', () => {
    render(<YearSelector value={2026} onChange={mockOnChange} />);

    expect(
      screen.getByRole('option', { name: 'FY2026 (Jul 2025 - Jun 2026)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'FY2025 (Jul 2024 - Jun 2025)' }),
    ).toBeInTheDocument();
  });

  it('shows current period indicator when current FY is selected', () => {
    render(<YearSelector value={2026} onChange={mockOnChange} />);

    expect(screen.getByText('Current Period')).toBeInTheDocument();
  });

  it('does not show current period indicator for past years', () => {
    render(<YearSelector value={2025} onChange={mockOnChange} />);

    expect(screen.queryByText('Current Period')).not.toBeInTheDocument();
  });

  it('calls onChange when year is selected', async () => {
    const user = userEvent.setup();

    render(<YearSelector value={2026} onChange={mockOnChange} />);

    const select = screen.getByLabelText('Financial Year');
    await user.selectOptions(select, '2025');

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(2025);
  });

  it('displays selected year correctly', () => {
    render(<YearSelector value={2024} onChange={mockOnChange} />);

    const select = screen.getByLabelText('Financial Year');
    expect(select.value).toBe('2024');
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<YearSelector value={2026} onChange={mockOnChange} />);

    const section = screen.getByRole('region', { name: 'Financial year selector' });
    expect(section).toBeInTheDocument();

    const select = screen.getByLabelText('Financial Year');
    expect(select).toHaveAttribute('id', 'fy-select');
  });

  it('allows selecting each available year', async () => {
    const user = userEvent.setup();

    render(<YearSelector value={2026} onChange={mockOnChange} />);

    const select = screen.getByLabelText('Financial Year');

    const years = [2026, 2025, 2024, 2023];
    for (const year of years) {
      await user.selectOptions(select, year.toString());
      expect(mockOnChange).toHaveBeenCalledWith(year);
    }

    expect(mockOnChange).toHaveBeenCalledTimes(4);
  });
});
