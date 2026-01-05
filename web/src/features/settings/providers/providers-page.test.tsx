import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryDto, ProviderDto } from '@/lib/api-client';
import { ProvidersPage } from '@/features/settings/providers/providers-page';
import {
  useCreateProvider,
  useDeleteProvider,
  useUpdateProvider,
} from '@/features/settings/providers/hooks/use-provider-mutations';
import { useProviders } from '@/hooks/use-providers';
import { useCategories } from '@/hooks/use-categories';

vi.mock('@/hooks/use-providers');
vi.mock('@/hooks/use-categories');
vi.mock('@/features/settings/providers/hooks/use-provider-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseProviders = vi.mocked(
  useProviders as () => {
    data?: ProviderDto[];
    isLoading: boolean;
    isError: boolean;
  },
);

const mockedUseCategories = vi.mocked(
  useCategories as () => {
    data?: CategoryDto[];
  },
);

const mockedUseCreateProvider = vi.mocked(useCreateProvider);
const mockedUseUpdateProvider = vi.mocked(useUpdateProvider);
const mockedUseDeleteProvider = vi.mocked(useDeleteProvider);

describe('ProvidersPage', () => {
  it('renders providers table rows when data is available', () => {
    const providers: ProviderDto[] = [
      {
        id: '1',
        name: 'GitHub',
        isInternational: true,
        defaultCategoryId: null,
        abnArn: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'VentraIP',
        isInternational: false,
        defaultCategoryId: null,
        abnArn: '51824753556',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockedUseProviders.mockReturnValue({
      data: providers,
      isLoading: false,
      isError: false,
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    mockedUseDeleteProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteProvider>);

    render(
      <MemoryRouter>
        <ProvidersPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Providers' })).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('VentraIP')).toBeInTheDocument();
    expect(screen.getByText('International')).toBeInTheDocument();
    expect(screen.getByText('Domestic')).toBeInTheDocument();
  });

  it('shows loading state when providers are loading', () => {
    mockedUseProviders.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    mockedUseDeleteProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteProvider>);

    render(
      <MemoryRouter>
        <ProvidersPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Loading providers')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockedUseProviders.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    mockedUseDeleteProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteProvider>);

    render(
      <MemoryRouter>
        <ProvidersPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("We couldn't load your providers right now. Please try again shortly."),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no providers', () => {
    mockedUseProviders.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    mockedUseDeleteProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteProvider>);

    render(
      <MemoryRouter>
        <ProvidersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('No providers yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first vendor to get started.')).toBeInTheDocument();
  });

  it('opens create modal when Add provider button is clicked', async () => {
    const user = userEvent.setup();

    mockedUseProviders.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    mockedUseDeleteProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteProvider>);

    render(
      <MemoryRouter>
        <ProvidersPage />
      </MemoryRouter>,
    );

    const addButton = screen.getByRole('button', { name: 'Add provider' });
    await user.click(addButton);

    expect(screen.getByRole('dialog', { name: 'Add provider' })).toBeInTheDocument();
    expect(screen.getByLabelText('Provider name')).toBeInTheDocument();
  });

  it('displays settings tabs navigation', () => {
    mockedUseProviders.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseCategories.mockReturnValue({
      data: [],
    });

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    mockedUseDeleteProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteProvider>);

    render(
      <MemoryRouter>
        <ProvidersPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Settings navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Providers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clients' })).toBeInTheDocument();
  });
});
