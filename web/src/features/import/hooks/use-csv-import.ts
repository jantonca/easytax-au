import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';

type CsvImportResponseDto = components['schemas']['CsvImportResponseDto'];

interface ImportCsvParams {
  file: File;
  source: 'commbank' | 'amex' | 'custom' | 'nab' | 'westpac' | 'anz';
  matchThreshold?: number;
  skipDuplicates?: boolean;
}

// FormData.append() accepts any value by design - disable unsafe assignment for this function
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
async function importCsv(params: ImportCsvParams): Promise<CsvImportResponseDto> {
  const { file, source, matchThreshold = 0.6, skipDuplicates = true } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);
  formData.append('matchThreshold', matchThreshold.toString());
  formData.append('skipDuplicates', skipDuplicates.toString());
  formData.append('dryRun', 'false'); // Actual import, not preview

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response: Response = await fetch(`${baseUrl}/import/expenses`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = (await response.json()) as unknown;
    const error = errorData as { message?: string };
    throw new Error(error.message || 'Failed to import CSV');
  }

  return (await response.json()) as CsvImportResponseDto;
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function useImportCsv(): UseMutationResult<CsvImportResponseDto, Error, ImportCsvParams> {
  return useMutation({
    mutationFn: importCsv,
  });
}
