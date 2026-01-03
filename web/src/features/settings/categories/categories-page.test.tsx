import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryDto } from '@/lib/api-client';
import { CategoriesPage } from '@/features/settings/categories/categories-page';
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/features/settings/categories/hooks/use-category-mutations';
import { useCategories } from '@/hooks/use-categories';

vi.mock('@/hooks/use-categories');
vi.mock('@/features/settings/categories/hooks/use-category-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseCategories = vi.mocked(
  useCategories as () => {
    data?: CategoryDto[];
    isLoading: boolean;
    isError: boolean;
  },
);

const mockedUseCreateCategory = vi.mocked(useCreateCategory);
const mockedUseUpdateCategory = vi.mocked(useUpdateCategory);
const mockedUseDeleteCategory = vi.mocked(useDeleteCategory);

describe('CategoriesPage', () => {
  it('renders categories table rows when data is available', () => {
    const categories: CategoryDto[] = [
      {
        id: '1',
        name: 'Software',
        basLabel: '1B',
        isDeductible: true,
        description: 'Software subscriptions',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Equipment',
        basLabel: 'G10',
        isDeductible: true,
        description: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockedUseCategories.mockReturnValue({
      data: categories,
      isLoading: false,
      isError: false,
    });

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    mockedUseDeleteCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByText('Software')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('1B')).toBeInTheDocument();
    expect(screen.getByText('G10')).toBeInTheDocument();
    expect(screen.getByText('Software subscriptions')).toBeInTheDocument();
  });

  it('shows loading state when categories are loading', () => {
    mockedUseCategories.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    mockedUseDeleteCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading categories…')).toBeInTheDocument();
  });

  it('shows error state when loading fails', () => {
    mockedUseCategories.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    mockedUseDeleteCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText("We couldn't load your categories right now. Please try again shortly."),
    ).toBeInTheDocument();
  });

  it('shows empty state when there are no categories', () => {
    mockedUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    mockedUseDeleteCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('No categories yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first category to get started.')).toBeInTheDocument();
  });

  it('opens create modal when Add category button is clicked', async () => {
    const user = userEvent.setup();

    mockedUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    mockedUseDeleteCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    const addButton = screen.getByRole('button', { name: 'Add category' });
    await user.click(addButton);

    expect(screen.getByRole('dialog', { name: 'Add category' })).toBeInTheDocument();
    expect(screen.getByLabelText('Category name')).toBeInTheDocument();
  });

  it('displays settings tabs navigation', () => {
    mockedUseCategories.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    mockedUseDeleteCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation', { name: 'Settings navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Providers' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clients' })).toBeInTheDocument();
  });

  it('displays deductible status badges', () => {
    const categories: CategoryDto[] = [
      {
        id: '1',
        name: 'Deductible Category',
        basLabel: '1B',
        isDeductible: true,
        description: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'Non-Deductible Category',
        basLabel: 'G11',
        isDeductible: false,
        description: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockedUseCategories.mockReturnValue({
      data: categories,
      isLoading: false,
      isError: false,
    });

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    mockedUseDeleteCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteCategory>);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );

    const yesLabels = screen.getAllByLabelText('Tax deductible');
    const noLabels = screen.getAllByLabelText('Not tax deductible');

    expect(yesLabels).toHaveLength(1);
    expect(noLabels).toHaveLength(1);
  });
});
