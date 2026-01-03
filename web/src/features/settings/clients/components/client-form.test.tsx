import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClientForm } from '@/features/settings/clients/components/client-form';
import {
  useCreateClient,
  useUpdateClient,
} from '@/features/settings/clients/hooks/use-client-mutations';

vi.mock('@/features/settings/clients/hooks/use-client-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseCreateClient = vi.mocked(useCreateClient);
const mockedUseUpdateClient = vi.mocked(useUpdateClient);

describe('ClientForm', () => {
  it('submits form and calls create mutation', async () => {
    const user = userEvent.setup();

    const mutate = vi.fn();

    mockedUseCreateClient.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/Client name/i);
    const abnInput = screen.getByLabelText(/ABN \(optional\)/i);
    const psiCheckbox = screen.getByLabelText(/PSI.*eligible/i);

    await user.type(nameInput, 'Acme Corp');
    await user.type(abnInput, '12345678901');
    await user.click(psiCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Save client' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  it('validates required client name', async () => {
    const user = userEvent.setup();

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    render(<ClientForm />);

    const submitButton = screen.getByRole('button', { name: 'Save client' });
    await user.click(submitButton);

    expect(await screen.findByText('Client name is required')).toBeInTheDocument();
  });

  it('validates ABN format (11 digits)', async () => {
    const user = userEvent.setup();

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/Client name/i);
    const abnInput = screen.getByLabelText(/ABN \(optional\)/i);

    await user.type(nameInput, 'Test Client');
    await user.type(abnInput, '12345'); // Invalid: only 5 digits

    const submitButton = screen.getByRole('button', { name: 'Save client' });
    await user.click(submitButton);

    expect(await screen.findByText('ABN must be 11 digits')).toBeInTheDocument();
  });

  it('accepts valid ABN format (11 digits)', async () => {
    const user = userEvent.setup();

    const mutate = vi.fn();

    mockedUseCreateClient.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    render(<ClientForm />);

    const nameInput = screen.getByLabelText(/Client name/i);
    const abnInput = screen.getByLabelText(/ABN \(optional\)/i);

    await user.type(nameInput, 'Test Client');
    await user.type(abnInput, '12345678901'); // Valid ABN: 11 digits

    const submitButton = screen.getByRole('button', { name: 'Save client' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles PSI eligible checkbox', async () => {
    const user = userEvent.setup();

    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    render(<ClientForm />);

    const psiCheckbox = screen.getByLabelText(/PSI.*eligible/i);

    expect(psiCheckbox.checked).toBe(false);

    await user.click(psiCheckbox);

    expect(psiCheckbox.checked).toBe(true);
  });

  it('displays encryption notices', () => {
    mockedUseCreateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateClient>);

    mockedUseUpdateClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateClient>);

    render(<ClientForm />);

    expect(screen.getByText(/Client names are encrypted at rest/i)).toBeInTheDocument();
    expect(screen.getByText(/Also encrypted at rest/i)).toBeInTheDocument();
  });
});
