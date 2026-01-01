import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactElement } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';

function Boom(): ReactElement {
  throw new Error('Boom');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
