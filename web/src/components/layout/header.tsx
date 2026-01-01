import type { ReactElement } from 'react';
import { Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  fyLabel: string;
  quarterLabel: string;
  onToggleCommandPalette: () => void;
}

export function Header({
  fyLabel,
  quarterLabel,
  onToggleCommandPalette,
}: HeaderProps): ReactElement {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur-md md:px-6">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          EasyTax-AU
        </p>
        <p className="text-xs text-slate-400">
          {quarterLabel} · {fyLabel}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onToggleCommandPalette}
        className="gap-1.5 text-xs text-slate-200"
        aria-label="Open command palette"
      >
        <Command className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Command</span>
        <span className="hidden text-[10px] text-slate-400 sm:inline">⌘K</span>
      </Button>
    </header>
  );
}
