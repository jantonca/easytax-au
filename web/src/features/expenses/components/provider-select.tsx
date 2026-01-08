import type { ReactElement } from 'react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { ProviderDto } from '@/lib/api-client';

interface ProviderSelectProps {
  providers: ProviderDto[];
  value: string;
  onChange: (providerId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ProviderSelect({
  providers,
  value,
  onChange,
  error,
  disabled = false,
}: ProviderSelectProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sort providers alphabetically
  const sortedProviders = useMemo(() => {
    return [...providers].sort((a, b) => a.name.localeCompare(b.name));
  }, [providers]);

  // Filter providers based on search query
  const filteredProviders = useMemo(() => {
    if (!searchQuery) return sortedProviders;

    const lowerQuery = searchQuery.toLowerCase();
    return sortedProviders.filter((p) => p.name.toLowerCase().includes(lowerQuery));
  }, [sortedProviders, searchQuery]);

  // Find selected provider
  const selectedProvider = useMemo(() => {
    return providers.find((p) => p.id === value);
  }, [providers, value]);

  // Ensure focused index is within bounds
  const boundedFocusedIndex = Math.min(focusedIndex, filteredProviders.length - 1);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleClose = useCallback((): void => {
    setIsOpen(false);
    setSearchQuery('');
    setFocusedIndex(0);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, handleClose]);

  function handleSelect(providerId: string): void {
    onChange(providerId);
    handleClose();
  }

  const handleSearchChange = useCallback((query: string): void => {
    setSearchQuery(query);
    setFocusedIndex(0); // Reset focus when search changes
  }, []);

  function handleKeyDown(event: React.KeyboardEvent): void {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, filteredProviders.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredProviders[boundedFocusedIndex]) {
          handleSelect(filteredProviders[boundedFocusedIndex].id);
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
    }
  }

  // Highlight matching text in provider name
  function highlightMatch(name: string): ReactElement {
    if (!searchQuery) {
      return <>{name}</>;
    }

    const lowerName = name.toLowerCase();
    const lowerQuery = searchQuery.toLowerCase();
    const index = lowerName.indexOf(lowerQuery);

    if (index === -1) {
      return <>{name}</>;
    }

    return (
      <>
        {name.slice(0, index)}
        <mark className="bg-emerald-200 dark:bg-emerald-900 text-slate-900 dark:text-slate-100">
          {name.slice(index, index + searchQuery.length)}
        </mark>
        {name.slice(index + searchQuery.length)}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        role="button"
        aria-label="Select provider"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full h-8 rounded-md border px-2 text-xs text-left flex items-center justify-between
          ${error ? 'border-red-400 dark:border-red-600' : 'border-slate-300 dark:border-slate-800'}
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-slate-400 dark:hover:border-slate-700'}
          bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100
        `}
      >
        <span className={selectedProvider ? '' : 'text-slate-500 dark:text-slate-400'}>
          {selectedProvider ? selectedProvider.name : 'Select provider...'}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Error Message */}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                role="searchbox"
                aria-label="Search providers"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-7 pl-7 pr-2 text-xs rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Provider List */}
          <ul
            role="listbox"
            aria-label="Provider options"
            className="max-h-60 overflow-y-auto py-1"
          >
            {filteredProviders.length === 0 && providers.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                No providers available
              </li>
            )}

            {filteredProviders.length === 0 && providers.length > 0 && (
              <li className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                No provider found
              </li>
            )}

            {filteredProviders.map((provider, index) => (
              <li
                key={provider.id}
                role="option"
                aria-selected={index === boundedFocusedIndex || provider.id === value}
                onClick={() => handleSelect(provider.id)}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors
                  ${index === boundedFocusedIndex ? 'bg-slate-100 dark:bg-slate-900' : ''}
                  ${provider.id === value ? 'bg-emerald-50 dark:bg-emerald-950/30 font-medium text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}
                  hover:bg-slate-100 dark:hover:bg-slate-900
                `}
              >
                {highlightMatch(provider.name)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
