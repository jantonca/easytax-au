import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Receipt } from 'lucide-react';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(<EmptyState title="No data" description="Add some data to get started" />);

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Add some data to get started')).toBeInTheDocument();
  });

  it('renders action button when actionLabel and onAction provided', () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No data"
        description="Add some data"
        actionLabel="Add Item"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('calls onAction when button clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No data"
        description="Add some data"
        actionLabel="Add Item"
        onAction={onAction}
      />,
    );

    const button = screen.getByRole('button', { name: 'Add Item' });
    await user.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="No data"
        description="Add some data"
        icon={<Receipt data-testid="receipt-icon" />}
      />,
    );

    expect(screen.getByTestId('receipt-icon')).toBeInTheDocument();
  });

  it('uses semantic HTML with proper structure', () => {
    render(<EmptyState title="No data" description="Add some data" />);

    const section = screen.getByRole('status');
    expect(section).toBeInTheDocument();
    expect(section.tagName).toBe('SECTION');

    const heading = screen.getByText('No data');
    expect(heading.tagName).toBe('H3');

    const description = screen.getByText('Add some data');
    expect(description.tagName).toBe('P');
  });

  it('does not render button when actionLabel is omitted', () => {
    const onAction = vi.fn();
    render(<EmptyState title="No data" description="Add some data" onAction={onAction} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not render button when onAction is omitted', () => {
    render(<EmptyState title="No data" description="Add some data" actionLabel="Add Item" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles long description text gracefully', () => {
    const longDescription =
      'This is a very long description that explains in great detail what the user should do when there is no data available in the system. It provides helpful guidance and context.';

    render(<EmptyState title="No data" description={longDescription} />);

    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <EmptyState
        title="No data"
        description="Add some data"
        actionLabel="Add Item"
        onAction={onAction}
      />,
    );

    const button = screen.getByRole('button', { name: 'Add Item' });

    // Tab to button
    await user.tab();
    expect(button).toHaveFocus();

    // Press Enter
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
