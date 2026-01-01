import type { components } from '@api-types';

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

export async function getBasSummary(quarter: string, year: number): Promise<BasSummaryDto> {
  return apiClient.get<BasSummaryDto>(`/bas/${quarter}/${year}`);
}
