import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { ClientDto, IncomeResponseDto } from '@/lib/api-client';
import { ClientsPage } from '@/features/settings/clients/clients-page';
import {
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '@/features/settings/clients/hooks/use-client-mutations';
import { useClients } from '@/hooks/use-clients';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';

vi.mock('@/hooks/use-clients');
vi.mock('@/features/incomes/hooks/use-incomes');
vi.mock('@/features/settings/clients/hooks/use-client-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseClients = vi.mocked(
  useClients as () => {
    data?: ClientDto[];
    isLoading: boolean;
    isError: boolean;
  },
);

const mockedUseIncomes = vi.mocked(
  useIncomes as () => {
    data?: IncomeResponseDto[];
  },
);

const mockedUseCreateClient = vi.mocked(useCreateClient);
const mockedUseUpdateClient = vi.mocked(useUpdateClient);
const mockedUseDeleteClient = vi.mocked(useDeleteClient);

describe('ClientsPage', () => {
  it('renders clients table rows when data is available', () => {
    const clients: ClientDto[] = [
      {
        id: '1',
        name: 'Acme Corp',
        abn: '12345678901',
        isPsiEligible: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Widget Inc',
        abn: null,
        isPsiEligible: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockedUseClients.mockReturnValue({
      data: clients,
      isLoading: false,
      isError: false,
    });

    mockedUseIncomes.mockReturnValue({
      data: [],
    });

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    mockedUseDeleteClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteClient>);

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Clients' })).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Widget Inc')).toBeInTheDocument();
  });

  it('shows loading state when clients are loading', () => {
    mockedUseClients.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    mockedUseIncomes.mockReturnValue({
      data: [],
    });

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    mockedUseDeleteClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteClient>);

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading clients…')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockedUseClients.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    mockedUseIncomes.mockReturnValue({
      data: [],
    });

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    mockedUseDeleteClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteClient>);

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("We couldn't load your clients right now. Please try again shortly."),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no clients', () => {
    mockedUseClients.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseIncomes.mockReturnValue({
      data: [],
    });

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    mockedUseDeleteClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteClient>);

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('No clients yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first income client to get started.')).toBeInTheDocument();
  });

  it('opens create modal when Add client button is clicked', async () => {
    const user = userEvent.setup();

    mockedUseClients.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseIncomes.mockReturnValue({
      data: [],
    });

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    mockedUseDeleteClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteClient>);

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    const addButton = screen.getByRole('button', { name: 'Add client' });
    await user.click(addButton);

    expect(screen.getByRole('dialog', { name: 'Add client' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Client name/i)).toBeInTheDocument();
  });

  it('displays settings tabs navigation', () => {
    mockedUseClients.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseIncomes.mockReturnValue({
      data: [],
    });

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    mockedUseDeleteClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteClient>);

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Settings navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Providers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clients' })).toBeInTheDocument();
  });

  it('displays related incomes count for clients', () => {
    const clients: ClientDto[] = [
      {
        id: 'client-1',
        name: 'Acme Corp',
        abn: null,
        isPsiEligible: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const incomes: IncomeResponseDto[] = [
      {
        id: 'income-1',
        date: '2025-01-01',
        clientId: 'client-1',
        invoiceNum: 'INV-001',
        description: 'Consulting',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        isPaid: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        client: {
          id: 'client-1',
          name: 'Acme Corp',
          abn: null,
          isPsiEligible: false,
        },
      },
      {
        id: 'income-2',
        date: '2025-01-15',
        clientId: 'client-1',
        invoiceNum: 'INV-002',
        description: 'Development',
        subtotalCents: 200000,
        gstCents: 20000,
        totalCents: 220000,
        isPaid: false,
        createdAt: '2025-01-15T00:00:00Z',
        updatedAt: '2025-01-15T00:00:00Z',
        client: {
          id: 'client-1',
          name: 'Acme Corp',
          abn: null,
          isPsiEligible: false,
        },
      },
    ];

    mockedUseClients.mockReturnValue({
      data: clients,
      isLoading: false,
      isError: false,
    });

    mockedUseIncomes.mockReturnValue({
      data: incomes,
    });

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    mockedUseDeleteClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteClient>);

    render(
      <MemoryRouter>
        <ClientsPage />
      </MemoryRouter>,
    );

    // Should show count of 2 related incomes for Acme Corp
    const cells = screen.getAllByRole('cell');
    const incomeCountCell = cells.find((cell) => cell.textContent === '2');

    expect(incomeCountCell).toBeInTheDocument();
  });
});
