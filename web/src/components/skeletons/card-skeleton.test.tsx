import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardSkeleton } from './card-skeleton';

describe('CardSkeleton', () => {
  it('renders with default structure (label + value)', () => {
    const { container } = render(<CardSkeleton />);
    const section = container.querySelector('section');
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');

    expect(section).toBeInTheDocument();
    // Should have at least 2 skeletons (label + value)
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders with description when showDescription is true', () => {
    const { container } = render(<CardSkeleton showDescription={true} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');

    // Should have 3 skeletons (label + value + description)
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('does not render description when showDescription is false', () => {
    const { container } = render(<CardSkeleton showDescription={false} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');

    // Should have only 2 skeletons (label + value)
    expect(skeletons).toHaveLength(2);
  });

  it('renders with dark theme card styles', () => {
    const { container } = render(<CardSkeleton />);
    const section = container.querySelector('section');

    expect(section).toHaveClass('border-slate-800');
    expect(section).toHaveClass('bg-slate-900/60');
    expect(section).toHaveClass('rounded-lg');
  });

  it('has aria-label for accessibility', () => {
    render(<CardSkeleton ariaLabel="Loading card" />);
    const section = screen.getByLabelText('Loading card');

    expect(section).toBeInTheDocument();
  });

  it('uses default aria-label when not provided', () => {
    render(<CardSkeleton />);
    const section = screen.getByLabelText('Loading');

    expect(section).toBeInTheDocument();
  });

  it('mimics GstSummaryCard structure with correct spacing', () => {
    const { container } = render(<CardSkeleton showDescription={true} />);
    const section = container.querySelector('section');

    // Should have flex-col layout with gap
    expect(section).toHaveClass('flex');
    expect(section).toHaveClass('flex-col');
    expect(section).toHaveClass('gap-1');
  });

  it('can render multiple cards in a grid', () => {
    render(
      <div data-testid="card-grid" className="grid grid-cols-4 gap-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>,
    );

    const grid = screen.getByTestId('card-grid');
    expect(grid.children).toHaveLength(4);
  });
});
