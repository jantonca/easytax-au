import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileDropzone } from './file-dropzone';

describe('FileDropzone', () => {
  it('renders dropzone with instructions', () => {
    render(<FileDropzone onFileSelect={vi.fn()} />);

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByText(/your csv file here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('accepts CSV files', async () => {
    const onFileSelect = vi.fn();
    const user = userEvent.setup();

    render(<FileDropzone onFileSelect={onFileSelect} />);

    const file = new File(['date,description,amount\n2025-01-01,Test,100'], 'test.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/upload csv file/i);
    await user.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows selected file name and size', async () => {
    const user = userEvent.setup();

    render(<FileDropzone onFileSelect={vi.fn()} />);

    const file = new File(['date,description,amount\n2025-01-01,Test,100'], 'expenses-2025.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/upload csv file/i);
    await user.upload(input, file);

    expect(screen.getByText('expenses-2025.csv')).toBeInTheDocument();
    expect(screen.getByText(/\d+\s*(B|KB)/i)).toBeInTheDocument(); // File size
  });

  it('rejects non-CSV files', async () => {
    const onFileSelect = vi.fn();

    render(<FileDropzone onFileSelect={onFileSelect} />);

    const file = new File(['data'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const input = screen.getByLabelText(/upload csv file/i);

    // Use fireEvent to bypass browser's accept attribute validation
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(input);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/only csv files are accepted/i)).toBeInTheDocument();
    });
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('rejects files larger than 10MB', async () => {
    const onFileSelect = vi.fn();
    const user = userEvent.setup();

    render(<FileDropzone onFileSelect={onFileSelect} />);

    // Create a mock file larger than 10MB
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

    const input = screen.getByLabelText(/upload csv file/i);
    await user.upload(input, file);

    expect(screen.getByText(/file size must be less than 10mb/i)).toBeInTheDocument();
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('allows clearing selected file', async () => {
    const onFileSelect = vi.fn();
    const user = userEvent.setup();

    render(<FileDropzone onFileSelect={onFileSelect} />);

    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    const input = screen.getByLabelText(/upload csv file/i);
    await user.upload(input, file);

    expect(screen.getByText('test.csv')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('handles drag and drop events', async () => {
    const onFileSelect = vi.fn();

    render(<FileDropzone onFileSelect={onFileSelect} />);

    const file = new File(['data'], 'dropped.csv', { type: 'text/csv' });
    const dropzone = screen.getByText(/drag and drop/i).closest('div');

    if (!dropzone) {
      throw new Error('Dropzone not found');
    }

    // Create a mock DataTransfer
    const dataTransfer = {
      files: [file],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        },
      ],
      types: ['Files'],
    };

    // Simulate drop event
    const dropEvent = new Event('drop', { bubbles: true });
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: dataTransfer,
    });

    dropzone.dispatchEvent(dropEvent);

    // File should be selected
    expect(await screen.findByText('dropped.csv')).toBeInTheDocument();
  });

  it('shows visual feedback on drag over', async () => {
    render(<FileDropzone onFileSelect={vi.fn()} />);

    const dropzone = screen.getByText(/drag and drop/i).closest('div');

    if (!dropzone) {
      throw new Error('Dropzone not found');
    }

    // Simulate drag over using fireEvent
    fireEvent.dragOver(dropzone);

    // Wait for state update and check for visual feedback class
    await waitFor(() => {
      expect(dropzone).toHaveClass('border-emerald-500');
    });
  });
});
