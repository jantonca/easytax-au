import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

interface ImportJob {
  id: string;
  createdAt: string;
  source: string;
  totalRows: number;
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  totalAmountCents: number;
  totalGstCents: number;
  processingTimeMs: number;
}

async function fetchImportJobs(): Promise<ImportJob[]> {
  const response = await fetch('http://localhost:3000/api/import/jobs');

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message || 'Failed to fetch import jobs');
  }

  return (await response.json()) as ImportJob[];
}

export function useImportJobs(): UseQueryResult<ImportJob[], Error> {
  return useQuery({
    queryKey: ['import-jobs'],
    queryFn: fetchImportJobs,
  });
}
