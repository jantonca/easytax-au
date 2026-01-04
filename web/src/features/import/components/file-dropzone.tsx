import type { ReactElement, DragEvent, ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPE = 'text/csv';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function FileDropzone({ onFileSelect }: FileDropzoneProps): ReactElement {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.type !== ACCEPTED_TYPE && !file.name.endsWith('.csv')) {
      return 'Only CSV files are accepted';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleFile = (file: File): void => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClear = (): void => {
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleBrowseClick = (): void => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mb-4 h-12 w-12 text-slate-400" />
          <p className="mb-2 text-sm text-slate-300">
            <span className="font-semibold">Drag and drop</span> your CSV file here
          </p>
          <p className="mb-4 text-xs text-slate-500">or</p>
          <button
            type="button"
            onClick={handleBrowseClick}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Browse Files
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload CSV file"
          />
          <p className="mt-4 text-xs text-slate-500">Maximum file size: 10MB</p>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/40 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-slate-200">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Clear file"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-2 rounded-md border border-red-900/50 bg-red-950/50 p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
