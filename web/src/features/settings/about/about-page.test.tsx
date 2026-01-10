import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/toast-provider';
import { AboutPage } from './about-page';
import { useVersion } from '@/hooks/use-version';
import { useUpdateCheck } from '@/hooks/use-update-check';
import type { VersionResponse } from '@/lib/api-client';

vi.mock('@/hooks/use-version');
vi.mock('@/hooks/use-update-check');

const mockedUseVersion = vi.mocked(useVersion);
const mockedUseUpdateCheck = vi.mocked(useUpdateCheck);

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ToastProvider>,
  );
}

describe('AboutPage', () => {
  beforeEach(() => {
    // Default mock for useUpdateCheck
    mockedUseUpdateCheck.mockReturnValue({
      updateInfo: null,
      isChecking: false,
      checkError: false,
      checkNow: vi.fn(),
    });
  });
  it('renders version details when loaded', () => {
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

    renderWithProviders(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: /about/i })).toBeInTheDocument();
    expect(screen.getByText('0.0.1')).toBeInTheDocument();
    expect(screen.getByText(/v22\.10\.7/i)).toBeInTheDocument();
    expect(screen.getByText(/development/i)).toBeInTheDocument();
  });

  it('displays settings tabs navigation', () => {
    const mockVersion: VersionResponse = {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'production',
    };

    mockedUseVersion.mockReturnValue({
      data: mockVersion,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersion>);

    renderWithProviders(<AboutPage />);

    expect(screen.getByRole('navigation', { name: 'Settings navigation' })).toBeInTheDocument();
  });

  it('shows loading state when data is loading', () => {
    mockedUseVersion.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useVersion>);

    renderWithProviders(<AboutPage />);

    expect(screen.getByRole('heading', { level: 1, name: /about/i })).toBeInTheDocument();
    expect(screen.getByText(/loading version information/i)).toBeInTheDocument();
  });

  it('shows error message when loading fails', () => {
    mockedUseVersion.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useVersion>);

    renderWithProviders(<AboutPage />);

    expect(screen.getByText(/couldn't load version information/i)).toBeInTheDocument();
  });

  it('displays EasyTax-AU heading', () => {
    const mockVersion: VersionResponse = {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'production',
    };

    mockedUseVersion.mockReturnValue({
      data: mockVersion,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersion>);

    renderWithProviders(<AboutPage />);

    expect(screen.getByText('EasyTax-AU')).toBeInTheDocument();
  });
});
