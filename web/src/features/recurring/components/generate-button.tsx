import { useState } from 'react';
import type { JSX } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGenerateRecurring } from '../hooks/use-recurring-mutations';
import { useDueRecurringExpenses } from '../hooks/use-recurring';
import type { GenerateExpensesResultDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';

interface GenerateButtonProps {
  onSuccess?: (result: GenerateExpensesResultDto) => void;
}

export function GenerateButton({ onSuccess }: GenerateButtonProps): JSX.Element {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState<GenerateExpensesResultDto | null>(null);

  const { data: dueExpenses = [], isLoading: isLoadingDue } = useDueRecurringExpenses();
  const { mutate: generate, isPending: isGenerating } = useGenerateRecurring();

  const handleGenerate = (): void => {
    generate(undefined, {
      onSuccess: (result) => {
        setLastResult(result);
        setShowConfirmation(false);
        setShowResults(true);
        onSuccess?.(result);
      },
    });
  };

  const totalDueAmount = dueExpenses.reduce((sum, expense) => sum + expense.amountCents, 0);

  return (
    <>
      <Button
        onClick={() => setShowConfirmation(true)}
        disabled={isLoadingDue || dueExpenses.length === 0}
        className="flex items-center gap-2"
      >
        <Play className="h-4 w-4" />
        Generate Due Expenses
        {dueExpenses.length > 0 && ` (${dueExpenses.length})`}
      </Button>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="generate-dialog-title"
          >
            <h2
              id="generate-dialog-title"
              className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Generate Recurring Expenses?
            </h2>

            {dueExpenses.length === 0 ? (
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
                No recurring expenses are due for generation at this time.
              </p>
            ) : (
              <>
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
                  Generate {dueExpenses.length} expense{dueExpenses.length === 1 ? '' : 's'}{' '}
                  totaling ${formatCents(totalDueAmount)}?
                </p>

                <div className="mb-6 max-h-48 overflow-y-auto rounded border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-3">
                  <ul className="space-y-2 text-sm">
                    {dueExpenses.map((expense) => (
                      <li key={expense.id} className="flex justify-between">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {expense.name}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          ${formatCents(expense.amountCents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              {dueExpenses.length > 0 && (
                <Button type="button" onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Dialog */}
      {showResults && lastResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="results-dialog-title"
          >
            <h2
              id="results-dialog-title"
              className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Generation Complete
            </h2>

            <div className="mb-6 space-y-3">
              <div className="flex justify-between rounded bg-emerald-500/20 p-3">
                <span className="font-medium text-emerald-300">Generated:</span>
                <span className="text-emerald-400">{lastResult.generated} expense(s)</span>
              </div>

              {lastResult.skipped > 0 && (
                <div className="flex justify-between rounded bg-amber-500/20 p-3">
                  <span className="font-medium text-amber-300">Skipped:</span>
                  <span className="text-amber-400">{lastResult.skipped} (already generated)</span>
                </div>
              )}

              {lastResult.details && lastResult.details.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    Details:
                  </h3>
                  <div className="max-h-32 overflow-y-auto rounded border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-2">
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      {lastResult.details.map((detail, index) => (
                        <li key={index}>{JSON.stringify(detail)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setShowResults(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
