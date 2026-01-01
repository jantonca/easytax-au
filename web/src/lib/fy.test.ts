import { describe, expect, it } from 'vitest';
import { getFYFromDate, getFYInfo, getQuarterFromDate } from '@/lib/fy';

describe('FY utilities', () => {
  it('computes financial year correctly around July boundary', () => {
    expect(getFYFromDate(new Date('2025-06-30T00:00:00Z'))).toBe(2025);
    expect(getFYFromDate(new Date('2025-07-01T00:00:00Z'))).toBe(2026);
  });

  it('maps dates to correct Australian quarters', () => {
    expect(getQuarterFromDate(new Date('2025-08-15T00:00:00Z'))).toBe('Q1'); // Aug
    expect(getQuarterFromDate(new Date('2025-11-01T00:00:00Z'))).toBe('Q2'); // Nov
    expect(getQuarterFromDate(new Date('2026-02-10T00:00:00Z'))).toBe('Q3'); // Feb
    expect(getQuarterFromDate(new Date('2026-05-10T00:00:00Z'))).toBe('Q4'); // May
  });

  it('returns FY info with labels', () => {
    const info = getFYInfo(new Date('2025-08-15T00:00:00Z'));

    expect(info.financialYear).toBe(2026);
    expect(info.quarter).toBe('Q1');
    expect(info.fyLabel).toBe('FY2026');
    expect(info.quarterLabel).toBe('Q1 FY2026');
  });
});
