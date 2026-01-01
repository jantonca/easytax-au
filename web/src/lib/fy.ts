export type AustralianQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface FYInfo {
  financialYear: number;
  quarter: AustralianQuarter;
  fyLabel: string;
  quarterLabel: string;
}

export function getFYFromDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based: Jan = 0

  // Australian FY runs from 1 July to 30 June.
  // Months July (6) to December (11) belong to the FY ending next calendar year.
  return month >= 6 ? year + 1 : year;
}

export function getQuarterFromDate(date: Date): AustralianQuarter {
  const month = date.getMonth();

  if (month >= 6 && month <= 8) {
    return 'Q1'; // Jul, Aug, Sep
  }

  if (month >= 9 && month <= 11) {
    return 'Q2'; // Oct, Nov, Dec
  }

  if (month >= 0 && month <= 2) {
    return 'Q3'; // Jan, Feb, Mar
  }

  return 'Q4'; // Apr, May, Jun
}

export function getFYInfo(date: Date): FYInfo {
  const financialYear = getFYFromDate(date);
  const quarter = getQuarterFromDate(date);

  return {
    financialYear,
    quarter,
    fyLabel: `FY${financialYear}`,
    quarterLabel: `${quarter} FY${financialYear}`,
  };
}
