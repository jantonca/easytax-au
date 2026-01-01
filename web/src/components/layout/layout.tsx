import type { ReactElement } from 'react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useFYInfo } from '@/hooks/use-fy-info';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/layout/command-palette';

export function Layout(): ReactElement {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const fyInfo = useFYInfo();

  useKeyboardShortcuts({
    'mod+k': () => setIsCommandPaletteOpen((open) => !open),
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      <Sidebar className="hidden md:flex" />

      <div className="flex min-h-screen flex-1 flex-col">
        <MobileNav isOpen={isMobileNavOpen} onOpenChange={setIsMobileNavOpen} />

        <Header
          fyLabel={fyInfo.fyLabel}
          quarterLabel={fyInfo.quarterLabel}
          onToggleCommandPalette={() => setIsCommandPaletteOpen((open) => !open)}
        />

        <main className={cn('flex-1 px-4 py-4 lg:px-6')}>
          <Outlet />
        </main>
      </div>

      <CommandPalette open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} />
    </div>
  );
}
