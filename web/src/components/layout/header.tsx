import type { ReactElement } from 'react';
import { Command, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

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
  const { theme, setTheme } = useTheme();

  const toggleTheme = (): void => {
    // Cycle: light → dark → system → light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = (): ReactElement => {
    if (theme === 'dark') {
      return <Moon className="h-4 w-4" aria-hidden="true" />;
    }
    if (theme === 'light') {
      return <Sun className="h-4 w-4" aria-hidden="true" />;
    }
    // system theme - show both icons overlapped or a neutral icon
    return (
      <div className="relative h-4 w-4">
        <Sun className="absolute h-4 w-4 opacity-50" aria-hidden="true" />
        <Moon className="absolute h-4 w-4 opacity-50" aria-hidden="true" />
      </div>
    );
  };

  const getThemeLabel = (): string => {
    if (theme === 'dark') return 'Dark';
    if (theme === 'light') return 'Light';
    return 'Auto';
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 md:px-6">
      <div className="space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-slate-500">
          EasyTax-AU
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {quarterLabel} · {fyLabel}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="gap-1.5 text-xs text-slate-700 dark:text-slate-200"
          aria-label={`Switch theme (current: ${getThemeLabel()})`}
          title={`Theme: ${getThemeLabel()}`}
        >
          {getThemeIcon()}
          <span className="hidden sm:inline">{getThemeLabel()}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleCommandPalette}
          className="gap-1.5 text-xs text-slate-700 dark:text-slate-200"
          aria-label="Open command palette"
        >
          <Command className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Command</span>
          <span className="hidden text-[10px] text-slate-500 dark:text-slate-400 sm:inline">
            ⌘K
          </span>
        </Button>
      </div>
    </header>
  );
}
