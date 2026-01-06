import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { useToast } from '@/lib/toast-context';

type CsvImportResponseDto = components['schemas']['CsvImportResponseDto'];

interface ImportIncomeCsvParams {
  file: File;
  source: 'commbank' | 'amex' | 'custom' | 'nab' | 'westpac' | 'anz' | 'manual';
  matchThreshold?: number;
  skipDuplicates?: boolean;
}

// FormData.append() accepts any value by design - disable unsafe assignment for this function
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
async function importIncomeCsv(params: ImportIncomeCsvParams): Promise<CsvImportResponseDto> {
  const { file, source, matchThreshold = 0.6, skipDuplicates = true } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);
  formData.append('matchThreshold', matchThreshold.toString());
  formData.append('skipDuplicates', skipDuplicates.toString());
  formData.append('dryRun', 'false'); // Actual import, not preview

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response: Response = await fetch(`${baseUrl}/import/incomes`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = (await response.json()) as unknown;
    const error = errorData as { message?: string; status?: number };

    // Create error with status for proper error handling
    const apiError = new Error(error.message || 'Failed to import income CSV') as Error & {
      status?: number;
    };
    apiError.status = response.status;
    throw apiError;
  }

  const result = (await response.json()) as CsvImportResponseDto;
  return result;
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function useImportIncomeCsv(): UseMutationResult<
  CsvImportResponseDto,
  Error,
  ImportIncomeCsvParams
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: importIncomeCsv,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['incomes'] });
      const skipped = data.totalRows - data.successCount - data.failedCount;
      showToast({
        title: `Income import completed: ${data.successCount} imported, ${skipped} skipped`,
      });
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error, 'import incomes');
      showToast({ title: errorMessage });
    },
  });
}

/**
 * Helper function to extract error messages for toast notifications.
 * - For 4xx errors (client errors): Show specific API error message
 * - For 5xx errors (server errors): Show generic message for security
 */
function getErrorMessage(error: unknown, action: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error &&
    typeof error.status === 'number' &&
    typeof error.message === 'string'
  ) {
    if (error.status >= 400 && error.status < 500) {
      return `Failed to ${action}: ${error.message}`;
    }
  }
  return `Failed to ${action}`;
}
