import type { ReactElement } from 'react';
import { Download } from 'lucide-react';
import {
  generateExpenseTemplate,
  generateIncomeTemplate,
  downloadCsv,
  type TemplateFormat,
} from '../utils/generate-csv-template';

interface CsvTemplateDownloadsProps {
  /** Type of templates to show: 'expense' or 'income' */
  type: 'expense' | 'income';
}

/**
 * CSV Template Downloads Component
 *
 * Provides downloadable CSV templates with example rows for different import formats.
 * Templates include proper headers and realistic example data following Australian standards.
 */
export function CsvTemplateDownloads({ type }: CsvTemplateDownloadsProps): ReactElement {
  const handleDownload = (format: TemplateFormat, filename: string): void => {
    const content =
      format === 'income' ? generateIncomeTemplate() : generateExpenseTemplate(format);
    downloadCsv(content, filename);
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
        CSV Templates
      </h2>
      <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">
        Download example templates to see the expected format. Replace the example rows with your
        own data.
      </p>

      <div className="flex flex-wrap gap-2">
        {type === 'expense' && (
          <>
            <button
              onClick={() => handleDownload('commbank', 'expense-template-commbank.csv')}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
              aria-label="Download CommBank template"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              CommBank Template
            </button>

            <button
              onClick={() => handleDownload('custom', 'expense-template-generic.csv')}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
              aria-label="Download Generic/Custom template"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Generic/Custom Template
            </button>

            <button
              onClick={() => handleDownload('amex', 'expense-template-amex.csv')}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
              aria-label="Download Amex template"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Amex Template
            </button>
          </>
        )}

        {type === 'income' && (
          <button
            onClick={() => handleDownload('income', 'income-template.csv')}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-700"
            aria-label="Download income template"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Income Template
          </button>
        )}
      </div>
    </section>
  );
}
