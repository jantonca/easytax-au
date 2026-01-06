import type { ReactElement } from 'react';
import { useState } from 'react';
import { FileDropzone } from './components/file-dropzone';
import { PreviewTable } from './components/preview-table';
import { ImportProgress } from './components/import-progress';
import { ProgressSteps } from './components/progress-steps';
import { SummaryStats } from './components/summary-stats';
import { usePreviewCsvImport } from './hooks/use-csv-preview';
import { useImportCsv } from './hooks/use-csv-import';
import { Loader2 } from 'lucide-react';

type ImportSource = 'commbank' | 'amex' | 'custom' | 'nab' | 'westpac' | 'anz' | 'manual';

interface SourceOption {
  value: ImportSource;
  label: string;
  description: string;
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    value: 'commbank',
    label: 'CommBank',
    description: 'Commonwealth Bank CSV export',
  },
  {
    value: 'amex',
    label: 'American Express',
    description: 'Amex statement export',
  },
  {
    value: 'custom',
    label: 'Manual CSV',
    description: 'Custom format with date, description, amount columns',
  },
  {
    value: 'nab',
    label: 'NAB',
    description: 'National Australia Bank CSV export',
  },
  {
    value: 'westpac',
    label: 'Westpac',
    description: 'Westpac bank statement export',
  },
  {
    value: 'anz',
    label: 'ANZ',
    description: 'ANZ bank statement export',
  },
];

export function ExpensesImportTab(): ReactElement {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [source, setSource] = useState<ImportSource>('custom');
  const [step, setStep] = useState<'upload' | 'preview' | 'progress'>('upload');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const previewMutation = usePreviewCsvImport();
  const importMutation = useImportCsv();

  const handleFileSelect = (file: File): void => {
    setSelectedFile(file);
  };

  const handleSourceChange = (newSource: ImportSource): void => {
    setSource(newSource);
  };

  const handlePreview = (): void => {
    if (!selectedFile) return;

    // Use 'custom' if 'manual' is selected (they're equivalent)
    const apiSource = source === 'manual' ? 'custom' : source;

    previewMutation.mutate(
      {
        file: selectedFile,
        source: apiSource,
        matchThreshold: 0.6,
        skipDuplicates: true,
      },
      {
        onSuccess: (data) => {
          // Auto-select all successful rows
          const successfulRows = data.rows.filter((row) => row.success).map((row) => row.rowNumber);
          setSelectedRows(new Set(successfulRows));
          setStep('preview');
        },
      },
    );
  };

  const handleImport = (): void => {
    if (!selectedFile || selectedRows.size === 0) return;

    // Use 'custom' if 'manual' is selected (they're equivalent)
    const apiSource = source === 'manual' ? 'custom' : source;

    importMutation.mutate(
      {
        file: selectedFile,
        source: apiSource,
        matchThreshold: 0.6,
        skipDuplicates: true,
      },
      {
        onSuccess: () => {
          setStep('progress');
        },
      },
    );
  };

  const handleStartOver = (): void => {
    setSelectedFile(null);
    setSource('manual');
    setStep('upload');
    setSelectedRows(new Set());
    previewMutation.reset();
    importMutation.reset();
  };

  const handleViewExpenses = (): void => {
    // Navigate to expenses page
    window.location.href = '/expenses';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Progress Steps */}
      <ProgressSteps currentStep={step} />

      {/* Step Content */}
      {step === 'upload' && (
        <div className="flex flex-col gap-6">
          {/* Source Selection */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-200">
              1. Select Source Format
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOURCE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                    source === option.value
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="source"
                    value={option.value}
                    checked={source === option.value}
                    onChange={(e) => handleSourceChange(e.target.value as ImportSource)}
                    className="mt-0.5 h-4 w-4 border-slate-300 bg-white text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-offset-slate-900"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                      {option.label}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-500">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-200">
              2. Upload CSV File
            </h2>
            <FileDropzone onFileSelect={handleFileSelect} />
          </div>

          {/* Preview Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePreview}
              disabled={!selectedFile || previewMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600 dark:focus:ring-offset-slate-900"
            >
              {previewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {previewMutation.isPending ? 'Loading Preview...' : 'Preview Import'}
            </button>
          </div>

          {/* Preview Error */}
          {previewMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
              <p className="text-sm text-red-600 dark:text-red-400">
                {previewMutation.error?.message || 'Failed to preview CSV file'}
              </p>
            </div>
          )}
        </div>
      )}

      {step === 'preview' && previewMutation.data && (
        <div className="flex flex-col gap-6">
          {/* Summary Stats */}
          <SummaryStats data={previewMutation.data} />

          {/* Preview Table */}
          <PreviewTable
            rows={previewMutation.data.rows}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
          />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleStartOver}
              className="rounded-md border border-slate-300 bg-white px-6 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-900"
            >
              Start Over
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={selectedRows.size === 0 || importMutation.isPending}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600 dark:focus:ring-offset-slate-900"
            >
              {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {importMutation.isPending
                ? 'Importing...'
                : `Import ${selectedRows.size} Selected Row${selectedRows.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {step === 'progress' && (
        <div className="flex flex-col gap-6">
          <ImportProgress
            isLoading={importMutation.isPending}
            data={importMutation.data}
            error={importMutation.error}
            onViewExpenses={handleViewExpenses}
            onImportMore={handleStartOver}
          />
        </div>
      )}
    </div>
  );
}
