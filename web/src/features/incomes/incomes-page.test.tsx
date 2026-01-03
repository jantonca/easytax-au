import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClientDto, IncomeResponseDto } from '@/lib/api-client';
import { IncomesPage } from '@/features/incomes/incomes-page';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import {
  useCreateIncome,
  useDeleteIncome,
  useMarkPaid,
  useMarkUnpaid,
  useUpdateIncome,
} from '@/features/incomes/hooks/use-income-mutations';
import { useClients } from '@/hooks/use-clients';

vi.mock('@/features/incomes/hooks/use-incomes');
vi.mock('@/features/incomes/hooks/use-income-mutations');
vi.mock('@/hooks/use-clients');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseIncomes = vi.mocked(
  useIncomes as () => {
    data?: IncomeResponseDto[];
    isLoading: boolean;
    isError: boolean;
  },
);

const mockedUseClients = vi.mocked(
  useClients as () => {
    data?: ClientDto[];
  },
);

const mockedUseCreateIncome = vi.mocked(useCreateIncome);
const mockedUseUpdateIncome = vi.mocked(useUpdateIncome);
const mockedUseDeleteIncome = vi.mocked(useDeleteIncome);
const mockedUseMarkPaid = vi.mocked(useMarkPaid);
const mockedUseMarkUnpaid = vi.mocked(useMarkUnpaid);

describe('IncomesPage', () => {
  it('renders incomes table rows when data is available', () => {
    const incomes: IncomeResponseDto[] = [
      {
        id: '1',
        date: '2025-08-15T00:00:00Z',
        clientId: 'client-1',
        invoiceNum: 'INV-001',
        description: 'Consulting services',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        isPaid: true,
        createdAt: '2025-08-15T10:30:00Z',
        updatedAt: '2025-08-15T10:30:00Z',
        client: {
          id: 'client-1',
          name: 'Acme Corp',
          abn: '51824753556',
          isPsiEligible: false,
        },
      },
    ];

    mockedUseIncomes.mockReturnValue({
      data: incomes,
      isLoading: false,
      isError: false,
    });

    mockedUseClients.mockReturnValue({
      data: [],
    });

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    mockedUseDeleteIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIncome>);

    mockedUseMarkPaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkPaid>);

    mockedUseMarkUnpaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkUnpaid>);

    render(<IncomesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Incomes' })).toBeInTheDocument();
    expect(screen.getByText('Sorted by date (newest first)')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('$1,100.00')).toBeInTheDocument();
    // Check for paid status in table
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('Paid');
  });

  it('shows loading state when incomes are loading', () => {
    mockedUseIncomes.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    mockedUseClients.mockReturnValue({
      data: [],
    });

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    mockedUseDeleteIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIncome>);

    mockedUseMarkPaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkPaid>);

    mockedUseMarkUnpaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkUnpaid>);

    render(<IncomesPage />);

    expect(screen.getByText('Loading incomes…')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockedUseIncomes.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    mockedUseClients.mockReturnValue({
      data: [],
    });

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    mockedUseDeleteIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIncome>);

    mockedUseMarkPaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkPaid>);

    mockedUseMarkUnpaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkUnpaid>);

    render(<IncomesPage />);

    expect(
      screen.getByText("We couldn't load your incomes right now. Please try again shortly."),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no incomes', () => {
    mockedUseIncomes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseClients.mockReturnValue({
      data: [],
    });

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    mockedUseDeleteIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIncome>);

    mockedUseMarkPaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkPaid>);

    mockedUseMarkUnpaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkUnpaid>);

    render(<IncomesPage />);

    expect(screen.getByText('No incomes recorded yet.')).toBeInTheDocument();
  });

  it('filters incomes by client', async () => {
    const user = userEvent.setup();

    const incomes: IncomeResponseDto[] = [
      {
        id: '1',
        date: '2025-08-15T00:00:00Z',
        clientId: 'client-a',
        invoiceNum: null,
        description: null,
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        isPaid: false,
        createdAt: '2025-08-15T10:30:00Z',
        updatedAt: '2025-08-15T10:30:00Z',
        client: {
          id: 'client-a',
          name: 'Client A',
          abn: null,
          isPsiEligible: false,
        },
      },
      {
        id: '2',
        date: '2025-08-16T00:00:00Z',
        clientId: 'client-b',
        invoiceNum: null,
        description: null,
        subtotalCents: 200000,
        gstCents: 20000,
        totalCents: 220000,
        isPaid: false,
        createdAt: '2025-08-16T10:30:00Z',
        updatedAt: '2025-08-16T10:30:00Z',
        client: {
          id: 'client-b',
          name: 'Client B',
          abn: null,
          isPsiEligible: false,
        },
      },
    ];

    mockedUseIncomes.mockReturnValue({
      data: incomes,
      isLoading: false,
      isError: false,
    });

    const clients: ClientDto[] = [
      {
        id: 'client-a',
        name: 'Client A',
        abn: null,
        isPsiEligible: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'client-b',
        name: 'Client B',
        abn: null,
        isPsiEligible: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockedUseClients.mockReturnValue({
      data: clients,
    });

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    mockedUseDeleteIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIncome>);

    mockedUseMarkPaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkPaid>);

    mockedUseMarkUnpaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkUnpaid>);

    render(<IncomesPage />);

    // Select Client B in the filter
    await user.selectOptions(screen.getByLabelText('Client'), 'client-b');

    // Only the total for client B should remain visible in the table
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(screen.getByText('$2,200.00')).toBeInTheDocument();
  });

  it('filters incomes by paid status', async () => {
    const user = userEvent.setup();

    const incomes: IncomeResponseDto[] = [
      {
        id: '1',
        date: '2025-08-15T00:00:00Z',
        clientId: 'client-1',
        invoiceNum: null,
        description: null,
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        isPaid: true,
        createdAt: '2025-08-15T10:30:00Z',
        updatedAt: '2025-08-15T10:30:00Z',
        client: {
          id: 'client-1',
          name: 'Client A',
          abn: null,
          isPsiEligible: false,
        },
      },
      {
        id: '2',
        date: '2025-08-16T00:00:00Z',
        clientId: 'client-1',
        invoiceNum: null,
        description: null,
        subtotalCents: 200000,
        gstCents: 20000,
        totalCents: 220000,
        isPaid: false,
        createdAt: '2025-08-16T10:30:00Z',
        updatedAt: '2025-08-16T10:30:00Z',
        client: {
          id: 'client-1',
          name: 'Client A',
          abn: null,
          isPsiEligible: false,
        },
      },
    ];

    mockedUseIncomes.mockReturnValue({
      data: incomes,
      isLoading: false,
      isError: false,
    });

    mockedUseClients.mockReturnValue({
      data: [],
    });

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    mockedUseDeleteIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIncome>);

    mockedUseMarkPaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkPaid>);

    mockedUseMarkUnpaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkUnpaid>);

    render(<IncomesPage />);

    // Select "Unpaid only" in the filter
    await user.selectOptions(screen.getByLabelText('Payment status'), 'unpaid');

    // Only the unpaid income should remain visible
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(1);
    expect(screen.getByText('$2,200.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unpaid' })).toBeInTheDocument();
  });

  it('opens create modal when Add income button is clicked', async () => {
    const user = userEvent.setup();

    mockedUseIncomes.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseClients.mockReturnValue({
      data: [],
    });

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    mockedUseDeleteIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteIncome>);

    mockedUseMarkPaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkPaid>);

    mockedUseMarkUnpaid.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useMarkUnpaid>);

    render(<IncomesPage />);

    const addButton = screen.getByRole('button', { name: 'Add income' });
    await user.click(addButton);

    // Modal should be visible
    expect(screen.getByRole('dialog', { name: 'Add income' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save income' })).toBeInTheDocument();
  });
});
