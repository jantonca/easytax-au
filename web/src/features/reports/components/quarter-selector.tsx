import type { ReactElement } from 'react';
import type { AustralianQuarter } from '@/lib/fy';
import { getFYInfo } from '@/lib/fy';
import { useAvailableQuarters } from '../hooks/use-available-quarters';
import { format } from 'date-fns';

export interface QuarterSelectorValue {
  quarter: AustralianQuarter;
  financialYear: number;
}

interface QuarterSelectorProps {
  value: QuarterSelectorValue;
  onChange: (value: QuarterSelectorValue) => void;
}

const QUARTERS: AustralianQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];

function getAvailableYears(): number[] {
  const currentFY = getFYInfo(new Date()).financialYear;
  // Show current FY + previous 3 years
  return [currentFY, currentFY - 1, currentFY - 2, currentFY - 3];
}

export function QuarterSelector({ value, onChange }: QuarterSelectorProps): ReactElement {
  const availableYears = getAvailableYears();
  const currentFY = getFYInfo(new Date()).financialYear;
  const currentQuarter = getFYInfo(new Date()).quarter;

  const { data: quarters, isLoading } = useAvailableQuarters(value.financialYear);

  function handleQuarterChange(quarter: AustralianQuarter): void {
    onChange({ ...value, quarter });
  }

  function handleYearChange(financialYear: number): void {
    onChange({ ...value, financialYear });
  }

  function getQuarterLabel(q: AustralianQuarter): string {
    if (isLoading || !quarters) {
      return q;
    }

    const quarterInfo = quarters.find((info) => info.quarter === q);
    if (!quarterInfo) {
      return q;
    }

    const startDate = new Date(quarterInfo.start);
    const endDate = new Date(quarterInfo.end);

    return `${q} (${format(startDate, 'd MMM')} - ${format(endDate, 'd MMM yyyy')})`;
  }

  const isCurrent = value.financialYear === currentFY && value.quarter === currentQuarter;

  return (
    <section
      aria-label="Quarter and financial year selector"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40"
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="fy-select"
          className="text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Financial Year
        </label>
        <select
          id="fy-select"
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-offset-slate-900"
          value={value.financialYear}
          onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              FY{year} ({year - 1}/{String(year).slice(-2)})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="quarter-select"
          className="text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Quarter
        </label>
        <select
          id="quarter-select"
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-offset-slate-900"
          value={value.quarter}
          onChange={(e) => handleQuarterChange(e.target.value as AustralianQuarter)}
        >
          {QUARTERS.map((q) => (
            <option key={q} value={q}>
              {getQuarterLabel(q)}
            </option>
          ))}
        </select>
      </div>

      {isCurrent && (
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          Current Period
        </div>
      )}
    </section>
  );
}
