import type { ReactElement } from 'react';
import type { CategoryExpenseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';
import { useMemo } from 'react';

interface BasLabelBreakdownProps {
  categories: CategoryExpenseDto[];
}

interface BasLabelGroup {
  label: string;
  description: string;
  totalCents: number;
  gstCents: number;
  count: number;
  categories: CategoryExpenseDto[];
}

const BAS_LABEL_INFO: Record<string, { description: string; order: number }> = {
  '1B': { description: 'GST on business purchases (claimable credit)', order: 1 },
  G10: { description: 'Capital acquisitions', order: 2 },
  G11: { description: 'Non-capital acquisitions', order: 3 },
};

export function BasLabelBreakdown({ categories }: BasLabelBreakdownProps): ReactElement {
  // Group categories by BAS label
  const basLabelGroups = useMemo(() => {
    const groups = new Map<string, BasLabelGroup>();

    categories.forEach((category) => {
      const existing = groups.get(category.basLabel);
      if (existing) {
        existing.totalCents += category.totalCents;
        existing.gstCents += category.gstCents;
        existing.count += category.count;
        existing.categories.push(category);
      } else {
        groups.set(category.basLabel, {
          label: category.basLabel,
          description: BAS_LABEL_INFO[category.basLabel]?.description ?? 'Other',
          totalCents: category.totalCents,
          gstCents: category.gstCents,
          count: category.count,
          categories: [category],
        });
      }
    });

    // Sort by defined order (1B, G10, G11, then others alphabetically)
    return Array.from(groups.values()).sort((a, b) => {
      const orderA = BAS_LABEL_INFO[a.label]?.order ?? 999;
      const orderB = BAS_LABEL_INFO[b.label]?.order ?? 999;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.label.localeCompare(b.label);
    });
  }, [categories]);

  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No expense data found for this period.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Expense breakdown by BAS label" className="flex flex-col gap-4">
      {basLabelGroups.map((group) => (
        <div
          key={group.label}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40"
        >
          {/* BAS Label Header */}
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-200">
                  BAS Label {group.label}
                </h4>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {group.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-300">
                  {formatCents(group.totalCents)}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {group.count} expense{group.count === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </div>

          {/* Categories Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/50 bg-slate-50/50 dark:border-slate-800/50 dark:bg-slate-900/20">
                  <th
                    scope="col"
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-400"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-right text-xs font-medium text-slate-700 dark:text-slate-400"
                  >
                    Total
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-right text-xs font-medium text-slate-700 dark:text-slate-400"
                  >
                    GST Paid
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-2 text-right text-xs font-medium text-slate-700 dark:text-slate-400"
                  >
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.categories
                  .sort((a, b) => b.totalCents - a.totalCents)
                  .map((category) => (
                    <tr
                      key={category.categoryId}
                      className="border-b border-slate-200/30 last:border-b-0 hover:bg-slate-100/50 dark:border-slate-800/30 dark:hover:bg-slate-800/20"
                    >
                      <td className="px-4 py-2.5 text-slate-900 dark:text-slate-200">
                        {category.name}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                        {formatCents(category.totalCents)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                        {formatCents(category.gstCents)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {category.count}
                      </td>
                    </tr>
                  ))}
                {/* Subtotal for this BAS label */}
                {group.categories.length > 1 && (
                  <tr className="border-t border-slate-300 bg-slate-100/50 font-medium dark:border-slate-700 dark:bg-slate-800/30">
                    <td className="px-4 py-2.5 text-slate-900 dark:text-slate-100">Subtotal</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCents(group.totalCents)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                      {formatCents(group.gstCents)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                      {group.count}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
