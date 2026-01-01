import { describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError, checkApiHealth } from '@/lib/api-client';

global.fetch = vi.fn();

const mockedFetch = fetch as unknown as ReturnType<typeof vi.fn>;

describe('apiClient', () => {
  it('throws ApiError on non-2xx response', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ message: 'Server error' }),
    } as Response);

    await expect(apiClient.get('/test')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('checkApiHealth', () => {
  it('returns true when /health responds with ok', async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ status: 'ok' }),
    } as Response);

    await expect(checkApiHealth()).resolves.toBe(true);
  });

  it('returns false when request fails', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(checkApiHealth()).resolves.toBe(false);
  });
});
