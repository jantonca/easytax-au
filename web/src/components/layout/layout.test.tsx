import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './layout';
import { ThemeProvider } from '@/hooks/use-theme';

vi.mock('@/hooks/use-version', () => ({
  useVersion: () => ({
    data: {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'test',
    },
    isLoading: false,
    isError: false,
  }),
}));

describe('Layout', () => {
  it('renders skip link with correct href and accessible text', () => {
    render(
      <ThemeProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </ThemeProvider>,
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(skipLink.tagName).toBe('A');
  });

  it('has main content region with matching ID', () => {
    render(
      <ThemeProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </ThemeProvider>,
    );

    const mainContent = document.getElementById('main-content');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent?.tagName).toBe('MAIN');
  });

  it('skip link is visually hidden by default (sr-only class)', () => {
    render(
      <ThemeProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </ThemeProvider>,
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toHaveClass('sr-only');
  });

  it('renders footer component', () => {
    render(
      <ThemeProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </ThemeProvider>,
    );

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
