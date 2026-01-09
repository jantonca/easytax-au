import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './footer';
import { useVersion } from '@/hooks/use-version';
import type { VersionResponse } from '@/lib/api-client';

vi.mock('@/hooks/use-version');

const mockedUseVersion = vi.mocked(useVersion);

describe('Footer', () => {
  it('renders version information when loaded', () => {
    const mockVersion: VersionResponse = {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'development',
    };

    mockedUseVersion.mockReturnValue({
      data: mockVersion,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersion>);

    render(<Footer />);

    expect(screen.getByText(/v0\.0\.1/i)).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('shows loading state without version', () => {
    mockedUseVersion.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useVersion>);

    render(<Footer />);

    expect(screen.queryByText(/v\d/)).not.toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('gracefully handles error state without displaying error', () => {
    mockedUseVersion.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useVersion>);

    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.queryByText(/v\d/)).not.toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    const mockVersion: VersionResponse = {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'development',
    };

    mockedUseVersion.mockReturnValue({
      data: mockVersion,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersion>);

    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer.tagName).toBe('FOOTER');
  });

  it('displays app name', () => {
    const mockVersion: VersionResponse = {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'development',
    };

    mockedUseVersion.mockReturnValue({
      data: mockVersion,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersion>);

    render(<Footer />);

    expect(screen.getByText('EasyTax-AU')).toBeInTheDocument();
  });
});
