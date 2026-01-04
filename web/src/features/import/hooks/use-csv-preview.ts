import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';

type CsvImportResponseDto = components['schemas']['CsvImportResponseDto'];

interface PreviewCsvImportParams {
  file: File;
  source: 'commbank' | 'amex' | 'custom' | 'nab' | 'westpac' | 'anz';
  matchThreshold?: number;
  skipDuplicates?: boolean;
}

async function previewCsvImport(params: PreviewCsvImportParams): Promise<CsvImportResponseDto> {
  const { file, source, matchThreshold = 0.6, skipDuplicates = true } = params;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('source', source);
  formData.append('matchThreshold', matchThreshold.toString());
  formData.append('skipDuplicates', skipDuplicates.toString());
  formData.append('dryRun', 'true'); // Preview mode

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/import/expenses/preview`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || 'Failed to preview CSV import');
  }

  return (await response.json()) as CsvImportResponseDto;
}

export function usePreviewCsvImport(): UseMutationResult<
  CsvImportResponseDto,
  Error,
  PreviewCsvImportParams
> {
  return useMutation({
    mutationFn: previewCsvImport,
  });
}
