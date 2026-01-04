import type { ReactElement } from 'react';
import type { CategoryExpenseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';
import { useMemo } from 'react';

interface CategoryBreakdownProps {
  categories: CategoryExpenseDto[];
}

function BasLabelBadge({ label }: { label: string }): ReactElement {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-300">
      {label}
    </span>
  );
}

export function CategoryBreakdown({ categories }: CategoryBreakdownProps): ReactElement {
  // Sort categories by total amount descending
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => b.totalCents - a.totalCents);
  }, [categories]);

  // Calculate totals
  const totals = useMemo(() => {
    return categories.reduce(
      (acc, cat) => ({
        totalCents: acc.totalCents + cat.totalCents,
        gstCents: acc.gstCents + cat.gstCents,
        count: acc.count + cat.count,
      }),
      { totalCents: 0, gstCents: 0, count: 0 },
    );
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-8 text-center">
        <p className="text-sm text-slate-400">No expense categories found for this period.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Expense breakdown by category"
      className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40">
              <th scope="col" className="px-4 py-3 font-medium text-slate-300">
                Category
              </th>
              <th scope="col" className="px-4 py-3 font-medium text-slate-300">
                BAS Label
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-300">
                Total
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-300">
                GST Paid
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium text-slate-300">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category) => (
              <tr
                key={category.categoryId}
                className="border-b border-slate-800/50 hover:bg-slate-800/30"
              >
                <td className="px-4 py-3 font-medium text-slate-200">{category.name}</td>
                <td className="px-4 py-3">
                  <BasLabelBadge label={category.basLabel} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-100">
                  {formatCents(category.totalCents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-100">
                  {formatCents(category.gstCents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                  {category.count}
                </td>
              </tr>
            ))}
            {/* Totals Row */}
            <tr className="border-t-2 border-slate-700 bg-slate-800/40 font-semibold">
              <td className="px-4 py-3 text-slate-100">Total</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-100">
                {formatCents(totals.totalCents)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-100">
                {formatCents(totals.gstCents)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-100">{totals.count}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
