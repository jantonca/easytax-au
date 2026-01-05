import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('renders with default styles', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toBeInTheDocument();
    expect(skeleton.tagName).toBe('DIV');
  });

  it('accepts custom className prop', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('custom-class');
  });

  it('renders with correct base classes for animation', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    // Should have animation and background classes
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('bg-gray-200');
    expect(skeleton).toHaveClass('rounded');
  });

  it('supports different variants via className', () => {
    const { container: circularContainer } = render(
      <Skeleton className="rounded-full w-12 h-12" />,
    );
    const circular = circularContainer.firstChild as HTMLElement;

    expect(circular).toHaveClass('rounded-full');
    expect(circular).toHaveClass('w-12');
    expect(circular).toHaveClass('h-12');
  });

  it('renders with aria-hidden for accessibility', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('can render multiple skeletons', () => {
    render(
      <div data-testid="skeleton-container">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>,
    );

    const container = screen.getByTestId('skeleton-container');
    expect(container.children).toHaveLength(3);
  });
});
