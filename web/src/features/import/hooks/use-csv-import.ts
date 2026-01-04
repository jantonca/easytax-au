import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';

type CsvImportResponseDto = components['schemas']['CsvImportResponseDto'];

interface ImportCsvParams {
  file: File;
  source: 'custom' | 'commbank' | 'amex' | 'nab' | 'westpac' | 'anz' | 'manual';
  matchThreshold?: number;
  skipDuplicates?: boolean;
}

async function importCsv(params: ImportCsvParams): Promise<CsvImportResponseDto> {
  const { file, source, matchThreshold = 0.6, skipDuplicates = true } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);
  formData.append('matchThreshold', matchThreshold.toString());
  formData.append('skipDuplicates', skipDuplicates.toString());
  formData.append('dryRun', 'false'); // Actual import, not preview

  const response = await fetch('http://localhost:3000/import/expenses', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || 'Failed to import CSV');
  }

  return (await response.json()) as CsvImportResponseDto;
}

export function useImportCsv(): UseMutationResult<CsvImportResponseDto, Error, ImportCsvParams> {
  return useMutation({
    mutationFn: importCsv,
  });
}
