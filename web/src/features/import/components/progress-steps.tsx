import type { ReactElement } from 'react';

interface ProgressStepsProps {
  currentStep: 'upload' | 'preview' | 'progress';
}

export function ProgressSteps({ currentStep }: ProgressStepsProps): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 ${currentStep === 'upload' ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
            currentStep === 'upload'
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
        className={`flex items-center gap-2 ${currentStep === 'preview' ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
            currentStep === 'preview'
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
        className={`flex items-center gap-2 ${currentStep === 'progress' ? 'text-emerald-400' : 'text-slate-500'}`}
      >
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
            currentStep === 'progress'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-700 bg-slate-900'
          }`}
        >
          3
        </div>
        <span className="text-sm font-medium">Import</span>
      </div>
    </div>
  );
}
