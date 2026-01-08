import type { ReactElement } from 'react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { CategoryDto } from '@/lib/api-client';

interface CategorySelectProps {
  categories: CategoryDto[];
  value: string;
  onChange: (categoryId: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  error,
  disabled = false,
}: CategorySelectProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sort categories alphabetically
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return sortedCategories;

    const lowerQuery = searchQuery.toLowerCase();
    return sortedCategories.filter((c) => c.name.toLowerCase().includes(lowerQuery));
  }, [sortedCategories, searchQuery]);

  // Find selected category
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === value);
  }, [categories, value]);

  // Ensure focused index is within bounds
  const boundedFocusedIndex = Math.min(focusedIndex, filteredCategories.length - 1);

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

  function handleSelect(categoryId: string): void {
    onChange(categoryId);
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
        setFocusedIndex((prev) => Math.min(prev + 1, filteredCategories.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (filteredCategories[boundedFocusedIndex]) {
          handleSelect(filteredCategories[boundedFocusedIndex].id);
        }
        break;
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
    }
  }

  // Highlight matching text in category name
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
        aria-label="Select category"
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
        <span className={selectedCategory ? '' : 'text-slate-500 dark:text-slate-400'}>
          {selectedCategory ? selectedCategory.name : 'Select category...'}
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
                aria-label="Search categories"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-7 pl-7 pr-2 text-xs rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Category List */}
          <ul
            role="listbox"
            aria-label="Category options"
            className="max-h-60 overflow-y-auto py-1"
          >
            {filteredCategories.length === 0 && categories.length === 0 && (
              <li className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                No categories available
              </li>
            )}

            {filteredCategories.length === 0 && categories.length > 0 && (
              <li className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400 text-center">
                No category found
              </li>
            )}

            {filteredCategories.map((category, index) => (
              <li
                key={category.id}
                role="option"
                aria-selected={index === boundedFocusedIndex || category.id === value}
                onClick={() => handleSelect(category.id)}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors
                  ${index === boundedFocusedIndex ? 'bg-slate-100 dark:bg-slate-900' : ''}
                  ${category.id === value ? 'bg-emerald-50 dark:bg-emerald-950/30 font-medium text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}
                  hover:bg-slate-100 dark:hover:bg-slate-900
                `}
              >
                {highlightMatch(category.name)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
