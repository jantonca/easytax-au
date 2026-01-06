import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './layout';

describe('Layout', () => {
  it('renders skip link with correct href and accessible text', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>,
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink.tagName).toBe('A');
  });

  it('has main content region with matching ID', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>,
    );

    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent?.tagName).toBe('MAIN');
  });

  it('skip link is visually hidden by default (sr-only class)', () => {
    render(
      <BrowserRouter>
        <Layout />
      </BrowserRouter>,
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toHaveClass('sr-only');
  });
});
