import type { ReactElement } from 'react';
import { getFYInfo } from '@/lib/fy';

interface YearSelectorProps {
  value: number;
  onChange: (year: number) => void;
}

function getAvailableYears(): number[] {
  const currentFY = getFYInfo(new Date()).financialYear;
  // Show current FY + previous 3 years
  return [currentFY, currentFY - 1, currentFY - 2, currentFY - 3];
}

export function YearSelector({ value, onChange }: YearSelectorProps): ReactElement {
  const availableYears = getAvailableYears();
  const currentFY = getFYInfo(new Date()).financialYear;
  const isCurrent = value === currentFY;

  function handleYearChange(year: number): void {
    onChange(year);
  }

  function getFYLabel(year: number): string {
    const prevYear = year - 1;
    return `FY${year} (Jul ${prevYear} - Jun ${year})`;
  }

  return (
    <section
      aria-label="Financial year selector"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fy-select" className="text-xs font-medium text-slate-300">
          Financial Year
        </label>
        <select
          id="fy-select"
          className="h-9 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          value={value}
          onChange={(e) => handleYearChange(parseInt(e.target.value, 10))}
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {getFYLabel(year)}
            </option>
          ))}
        </select>
      </div>

      {isCurrent && (
        <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Current Period
        </div>
      )}
    </section>
  );
}
