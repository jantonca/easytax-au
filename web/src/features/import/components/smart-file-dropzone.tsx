import type { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDropzone } from './file-dropzone';
import { detectCsvTypeFromContent, type CsvType } from '../utils/detect-csv-type';
import { useToast } from '@/lib/toast-context';

interface SmartFileDropzoneProps {
  onFileSelect: (file: File) => void;
  expectedType: 'expense' | 'income';
}

/**
 * Smart wrapper around FileDropzone that automatically detects CSV type
 * and navigates to the correct import tab if user drops the wrong file type.
 *
 * @example
 * // In ExpensesImportTab:
 * <SmartFileDropzone expectedType="expense" onFileSelect={handleFileSelect} />
 *
 * // In IncomesImportTab:
 * <SmartFileDropzone expectedType="income" onFileSelect={handleFileSelect} />
 */
export function SmartFileDropzone({
  onFileSelect,
  expectedType,
}: SmartFileDropzoneProps): ReactElement {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleFileSelect = (file: File): void => {
    // Read file content to detect type
    const reader = new FileReader();

    reader.onload = (e): void => {
      const content = e.target?.result as string;
      const detectedType: CsvType = detectCsvTypeFromContent(content);

      // Handle unknown CSV type
      if (detectedType === 'unknown') {
        showToast({
          title: 'Unable to detect CSV type',
          message:
            'Could not determine if this is an expense or income CSV. Please ensure your file has the correct headers.',
          type: 'error',
        });
        // Still allow the user to proceed manually
        onFileSelect(file);
        return;
      }

      // Check if file is on the wrong tab
      if (detectedType !== expectedType) {
        const targetTab = detectedType === 'expense' ? 'expenses' : 'incomes';

        showToast({
          title: 'Auto-detected CSV type',
          message: `This appears to be an ${detectedType} CSV. Redirecting to ${detectedType}s tab...`,
          type: 'info',
        });

        // Navigate to correct tab after a brief delay for user to see the toast
        setTimeout(() => {
          void navigate(`/import/${targetTab}`, {
            state: { file, autoDetected: true },
          });
        }, 800);
        return;
      }

      // File type matches expected type - proceed normally
      onFileSelect(file);
    };

    reader.onerror = (): void => {
      showToast({
        title: 'File read error',
        message: 'Could not read the CSV file. Please try again.',
        type: 'error',
      });
    };

    reader.readAsText(file);
  };

  return <FileDropzone onFileSelect={handleFileSelect} />;
}
