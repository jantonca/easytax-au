import type { ReactElement } from 'react';
import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useFYInfo } from '@/hooks/use-fy-info';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
import { KeyboardShortcutsHelp } from '@/components/keyboard-shortcuts-help';
import { Footer } from '@/components/layout/footer';

export function Layout(): ReactElement {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  const fyInfo = useFYInfo();
  const navigate = useNavigate();

  useKeyboardShortcuts({
    'mod+k': () => setIsCommandPaletteOpen((open) => !open),
  });

  useGlobalShortcuts({
    onNewExpense: () => {
      void navigate('/expenses?new=true');
    },
    onNewIncome: () => {
      void navigate('/incomes?new=true');
    },
    onImport: () => {
      void navigate('/import');
    },
    onHelp: () => setIsShortcutsHelpOpen((open) => !open),
    onSearch: () => {
      // Focus search input if present on current page
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
  });

  return (
    <div className="flex min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-slate-800 dark:text-slate-50"
      >
        Skip to main content
      </a>

      <Sidebar className="hidden md:flex" />

      <div className="flex min-h-screen flex-1 flex-col">
        <MobileNav isOpen={isMobileNavOpen} onOpenChange={setIsMobileNavOpen} />

        <Header
          fyLabel={fyInfo.fyLabel}
          quarterLabel={fyInfo.quarterLabel}
          onToggleCommandPalette={() => setIsCommandPaletteOpen((open) => !open)}
        />

        <main id="main-content" className={cn('flex-1 px-4 py-4 lg:px-6')}>
          <Outlet />
        </main>

        <Footer />
      </div>

      <CommandPalette open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} />
      <KeyboardShortcutsHelp
        open={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />
    </div>
  );
}
