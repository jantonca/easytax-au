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
  const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3000';
  const response: Response = await fetch(`${baseUrl}/import/jobs`);

  if (!response.ok) {
    const errorData = (await response.json()) as unknown;
    const error = errorData as { message?: string };
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
