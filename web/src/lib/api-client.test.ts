import { describe, expect, it, vi } from 'vitest';
import {
  apiClient,
  ApiError,
  checkApiHealth,
  getBasSummary,
  type BasSummaryDto,
} from '@/lib/api-client';

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

describe('getBasSummary', () => {
  it('fetches BAS summary with generated type', async () => {
    const basSummary: BasSummaryDto = {
      quarter: 'Q1',
      financialYear: 2025,
      periodStart: '2024-07-01',
      periodEnd: '2024-09-30',
      g1TotalSalesCents: 1100000,
      label1aGstCollectedCents: 100000,
      label1bGstPaidCents: 50000,
      netGstPayableCents: 50000,
      incomeCount: 5,
      expenseCount: 12,
    };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => basSummary,
    } as Response);

    const result = await getBasSummary('Q1', 2025);

    expect(result).toEqual(basSummary);
    expect(mockedFetch).toHaveBeenCalledWith(
      'http://localhost:3000/bas/Q1/2025',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
