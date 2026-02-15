import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CsvTemplateDownloads } from './csv-template-downloads';

// Mock the URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  mockCreateObjectURL.mockClear();
  mockRevokeObjectURL.mockClear();
});

describe('CsvTemplateDownloads - Expense Templates', () => {
  it('renders download buttons for expense templates', () => {
    render(<CsvTemplateDownloads type="expense" />);

    expect(screen.getByRole('button', { name: /commbank template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generic\/custom template/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /amex template/i })).toBeInTheDocument();
  });

  it('downloads CommBank template when button clicked', async () => {
    const user = userEvent.setup();
    render(<CsvTemplateDownloads type="expense" />);

    const downloadButton = screen.getByRole('button', { name: /commbank template/i });
    await user.click(downloadButton);

    // Verify Blob was created
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');

    // Verify cleanup (revokeObjectURL called)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('downloads Generic template when button clicked', async () => {
    const user = userEvent.setup();
    render(<CsvTemplateDownloads type="expense" />);

    const downloadButton = screen.getByRole('button', { name: /generic\/custom template/i });
    await user.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
  });

  it('sets correct filename for CommBank template', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(<CsvTemplateDownloads type="expense" />);

    const downloadButton = screen.getByRole('button', { name: /commbank template/i });
    await user.click(downloadButton);

    // Find the anchor element that was created
    const anchorCalls = createElementSpy.mock.results.filter(
      (result) => result.value?.tagName === 'A'
    );
    expect(anchorCalls.length).toBeGreaterThan(0);

    const anchor = anchorCalls[anchorCalls.length - 1].value as HTMLAnchorElement;
    expect(anchor.download).toBe('expense-template-commbank.csv');

    createElementSpy.mockRestore();
  });

  it('sets correct filename for Generic template', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(<CsvTemplateDownloads type="expense" />);

    const downloadButton = screen.getByRole('button', { name: /generic\/custom template/i });
    await user.click(downloadButton);

    const anchorCalls = createElementSpy.mock.results.filter(
      (result) => result.value?.tagName === 'A'
    );
    const anchor = anchorCalls[anchorCalls.length - 1].value as HTMLAnchorElement;
    expect(anchor.download).toBe('expense-template-generic.csv');

    createElementSpy.mockRestore();
  });
});

describe('CsvTemplateDownloads - Income Templates', () => {
  it('renders download button for income template', () => {
    render(<CsvTemplateDownloads type="income" />);

    expect(screen.getByRole('button', { name: /income template/i })).toBeInTheDocument();
  });

  it('does not render expense templates when type is income', () => {
    render(<CsvTemplateDownloads type="income" />);

    expect(screen.queryByRole('button', { name: /commbank template/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /generic\/custom template/i })).not.toBeInTheDocument();
  });

  it('downloads income template when button clicked', async () => {
    const user = userEvent.setup();
    render(<CsvTemplateDownloads type="income" />);

    const downloadButton = screen.getByRole('button', { name: /income template/i });
    await user.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = mockCreateObjectURL.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
  });

  it('sets correct filename for income template', async () => {
    const user = userEvent.setup();
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(<CsvTemplateDownloads type="income" />);

    const downloadButton = screen.getByRole('button', { name: /income template/i });
    await user.click(downloadButton);

    const anchorCalls = createElementSpy.mock.results.filter(
      (result) => result.value?.tagName === 'A'
    );
    const anchor = anchorCalls[anchorCalls.length - 1].value as HTMLAnchorElement;
    expect(anchor.download).toBe('income-template.csv');

    createElementSpy.mockRestore();
  });
});

describe('CsvTemplateDownloads - Accessibility', () => {
  it('has proper section heading', () => {
    render(<CsvTemplateDownloads type="expense" />);

    expect(screen.getByRole('heading', { name: /csv templates/i })).toBeInTheDocument();
  });

  it('buttons have descriptive accessible names', () => {
    render(<CsvTemplateDownloads type="expense" />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button.getAttribute('aria-label') || button.textContent).toBeTruthy();
    });
  });
});
