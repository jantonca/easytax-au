import type { components } from '@shared/types';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const envBaseUrl = import.meta.env.VITE_API_URL as unknown;
  const baseUrl =
    typeof envBaseUrl === 'string' && envBaseUrl.length > 0 ? envBaseUrl : 'http://localhost:3000';
  const url = new URL(path, baseUrl).toString();

  const response = await fetch(url, {
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const body: unknown = isJson ? await response.json().catch(() => undefined) : undefined;

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

    if (body && typeof body === 'object' && 'message' in body) {
      const maybeMessage = (body as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        message = maybeMessage;
      }
    }

    throw new ApiError(message, response.status, body);
  }

  return (body as T) ?? (undefined as T);
}

export const apiClient = {
  get<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { method: 'GET', ...(init ?? {}) });
  },
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
      ...(init ?? {}),
    });
  },
  put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body != null ? JSON.stringify(body) : undefined,
      ...(init ?? {}),
    });
  },
  patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body != null ? JSON.stringify(body) : undefined,
      ...(init ?? {}),
    });
  },
  delete<T>(path: string, init?: RequestInit): Promise<T> {
    return request<T>(path, { method: 'DELETE', ...(init ?? {}) });
  },
};

export async function checkApiHealth(): Promise<boolean> {
  try {
    const result = await apiClient.get<{ status: string }>('/health');
    return result.status === 'ok' || result.status === 'healthy';
  } catch {
    return false;
  }
}

export type BasSummaryDto = components['schemas']['BasSummaryDto'];
export type ExpenseResponseDto = components['schemas']['ExpenseResponseDto'];
export type RecurringExpenseResponseDto = components['schemas']['RecurringExpenseResponseDto'];
export type FYSummaryDto = components['schemas']['FYSummaryDto'];
export type FYIncomeSummaryDto = components['schemas']['FYIncomeSummaryDto'];
export type FYExpenseSummaryDto = components['schemas']['FYExpenseSummaryDto'];
export type CategoryExpenseDto = components['schemas']['CategoryExpenseDto'];

// Provider and Category types based on backend entities
// These aren't in the OpenAPI schema as response DTOs, so we define them here
export interface ProviderDto {
  id: string;
  name: string;
  isInternational: boolean;
  defaultCategoryId?: string | null;
  abnArn?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  basLabel: string;
  isDeductible: boolean;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Income and Client types based on backend entities
export interface IncomeResponseDto {
  id: string;
  date: string | Date;
  clientId: string;
  invoiceNum?: string | null;
  description?: string | null;
  subtotalCents: number;
  gstCents: number;
  totalCents: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    abn?: string | null;
    isPsiEligible: boolean;
  };
}

export interface ClientDto {
  id: string;
  name: string;
  abn?: string | null;
  isPsiEligible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuarterDateRange {
  quarter: string;
  start: string;
  end: string;
}

export async function getBasSummary(quarter: string, year: number): Promise<BasSummaryDto> {
  return apiClient.get<BasSummaryDto>(`/bas/${quarter}/${year}`);
}

export async function getQuartersForYear(year: number): Promise<QuarterDateRange[]> {
  return apiClient.get<QuarterDateRange[]>(`/bas/quarters/${year}`);
}

export async function getProviders(): Promise<ProviderDto[]> {
  return apiClient.get<ProviderDto[]>('/providers');
}

export async function getCategories(): Promise<CategoryDto[]> {
  return apiClient.get<CategoryDto[]>('/categories');
}

export async function getExpenses(): Promise<ExpenseResponseDto[]> {
  return apiClient.get<ExpenseResponseDto[]>('/expenses');
}

export async function getRecentExpenses(): Promise<ExpenseResponseDto[]> {
  const expenses = await getExpenses();

  // Sort by date descending and take latest 10 for dashboard context
  return [...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
}

export async function getDueRecurringExpenses(
  asOfDate?: string,
): Promise<RecurringExpenseResponseDto[]> {
  const searchParams = new URLSearchParams();

  if (asOfDate && asOfDate.length > 0) {
    searchParams.set('asOfDate', asOfDate);
  }

  const query = searchParams.toString();
  const path = query.length > 0 ? `/recurring-expenses/due?${query}` : '/recurring-expenses/due';

  return apiClient.get<RecurringExpenseResponseDto[]>(path);
}

export async function getClients(): Promise<ClientDto[]> {
  return apiClient.get<ClientDto[]>('/clients');
}

export async function getIncomes(): Promise<IncomeResponseDto[]> {
  return apiClient.get<IncomeResponseDto[]>('/incomes');
}

export async function getFYSummary(year: number): Promise<FYSummaryDto> {
  return apiClient.get<FYSummaryDto>(`/reports/fy/${year}`);
}

export async function downloadFYReportPdf(year: number): Promise<void> {
  const envBaseUrl = import.meta.env.VITE_API_URL as unknown;
  const baseUrl =
    typeof envBaseUrl === 'string' && envBaseUrl.length > 0 ? envBaseUrl : 'http://localhost:3000';
  const url = new URL(`/reports/fy/${year}/pdf`, baseUrl).toString();

  const response = await fetch(url, {
    credentials: 'omit',
  });

  if (!response.ok) {
    throw new ApiError(`Failed to download PDF: ${response.status}`, response.status);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `FY-${year}-Report.pdf`;
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
}
