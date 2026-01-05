import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ImportTabs } from './import-tabs';

describe('ImportTabs', () => {
  it('renders both tab links', () => {
    render(
      <MemoryRouter initialEntries={['/import/expenses']}>
        <ImportTabs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Incomes')).toBeInTheDocument();
  });

  it('highlights expenses tab when on expenses route', () => {
    render(
      <MemoryRouter initialEntries={['/import/expenses']}>
        <ImportTabs />
      </MemoryRouter>,
    );

    const expensesLink = screen.getByText('Expenses');
    const incomesLink = screen.getByText('Incomes');

    expect(expensesLink).toHaveClass('border-emerald-500');
    expect(expensesLink).toHaveClass('text-emerald-400');
    expect(incomesLink).toHaveClass('border-transparent');
    expect(incomesLink).toHaveClass('text-slate-400');
  });

  it('highlights incomes tab when on incomes route', () => {
    render(
      <MemoryRouter initialEntries={['/import/incomes']}>
        <ImportTabs />
      </MemoryRouter>,
    );

    const expensesLink = screen.getByText('Expenses');
    const incomesLink = screen.getByText('Incomes');

    expect(incomesLink).toHaveClass('border-emerald-500');
    expect(incomesLink).toHaveClass('text-emerald-400');
    expect(expensesLink).toHaveClass('border-transparent');
    expect(expensesLink).toHaveClass('text-slate-400');
  });

  it('renders navigation with correct accessibility attributes', () => {
    render(
      <MemoryRouter initialEntries={['/import/expenses']}>
        <ImportTabs />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation', { name: /import navigation/i });
    expect(nav).toBeInTheDocument();
  });

  it('creates correct links for navigation', () => {
    render(
      <MemoryRouter initialEntries={['/import/expenses']}>
        <ImportTabs />
      </MemoryRouter>,
    );

    const expensesLink = screen.getByText('Expenses').closest('a');
    const incomesLink = screen.getByText('Incomes').closest('a');

    expect(expensesLink).toHaveAttribute('href', '/import/expenses');
    expect(incomesLink).toHaveAttribute('href', '/import/incomes');
  });
});
