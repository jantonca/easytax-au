import { useMutation } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';

type CsvImportResponseDto = components['schemas']['CsvImportResponseDto'];

interface PreviewCsvImportParams {
  file: File;
  source: 'custom' | 'commbank' | 'amex' | 'nab' | 'westpac' | 'anz';
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

  const response = await fetch('http://localhost:3000/import/expenses/preview', {
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
