import type { ReactElement } from 'react';
import { useState } from 'react';
import { FileDropzone } from './components/file-dropzone';

type ImportSource = 'commbank' | 'amex' | 'manual' | 'other';

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
    value: 'manual',
    label: 'Manual CSV',
    description: 'Custom format with date, description, amount columns',
  },
  {
    value: 'other',
    label: 'Other Bank',
    description: 'Generic bank statement format',
  },
];

export function ImportPage(): ReactElement {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [source, setSource] = useState<ImportSource>('manual');
  const [step, setStep] = useState<'upload' | 'preview' | 'progress'>('upload');

  const handleFileSelect = (file: File): void => {
    setSelectedFile(file);
  };

  const handleSourceChange = (newSource: ImportSource): void => {
    setSource(newSource);
  };

  const handleNext = (): void => {
    if (!selectedFile) return;
    // TODO: In Block 2, we'll call the preview API and show the preview step
    setStep('preview');
  };

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">CSV Import</h1>
        <p className="text-sm text-slate-400">Import expenses from your bank statement CSV files</p>
      </header>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center gap-2 ${step === 'upload' ? 'text-emerald-400' : 'text-slate-500'}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              step === 'upload'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 bg-slate-900'
            }`}
          >
            1
          </div>
          <span className="text-sm font-medium">Upload</span>
        </div>

        <div className="h-px w-12 bg-slate-800" />

        <div
          className={`flex items-center gap-2 ${step === 'preview' ? 'text-emerald-400' : 'text-slate-500'}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              step === 'preview'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 bg-slate-900'
            }`}
          >
            2
          </div>
          <span className="text-sm font-medium">Preview</span>
        </div>

        <div className="h-px w-12 bg-slate-800" />

        <div
          className={`flex items-center gap-2 ${step === 'progress' ? 'text-emerald-400' : 'text-slate-500'}`}
        >
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
              step === 'progress'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 bg-slate-900'
            }`}
          >
            3
          </div>
          <span className="text-sm font-medium">Import</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <div className="flex flex-col gap-6">
          {/* Source Selection */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="mb-4 text-lg font-medium text-slate-200">1. Select Source Format</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOURCE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                    source === option.value
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="source"
                    value={option.value}
                    checked={source === option.value}
                    onChange={(e) => handleSourceChange(e.target.value as ImportSource)}
                    className="mt-0.5 h-4 w-4 border-slate-700 bg-slate-800 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200">{option.label}</div>
                    <div className="text-xs text-slate-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="mb-4 text-lg font-medium text-slate-200">2. Upload CSV File</h2>
            <FileDropzone onFileSelect={handleFileSelect} />
          </div>

          {/* Next Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              disabled={!selectedFile}
              className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600"
            >
              Preview Import
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-slate-400">
            Preview step will be implemented in Block 2 (CSV Preview)
          </p>
          <p className="mt-2 text-sm text-slate-500">
            File: {selectedFile?.name} | Source: {source}
          </p>
        </div>
      )}

      {step === 'progress' && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-slate-400">Import progress will be implemented in Block 4</p>
        </div>
      )}
    </section>
  );
}
