import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function MobileNav({ isOpen, onOpenChange }: MobileNavProps): ReactElement {
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={() => onOpenChange((open) => !open)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-panel"
        >
          {isOpen ? (
            <X className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Menu className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          EasyTax-AU
        </p>
      </div>

      <div
        id="mobile-nav-panel"
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-800 bg-slate-950/95 px-4 py-4 shadow-lg transition-transform duration-200 ease-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <nav>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => onOpenChange(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-200 transition-colors',
                      'hover:bg-slate-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500',
                      isActive && 'bg-slate-800 text-slate-50',
                    )
                  }
                  aria-label={item.ariaLabel ?? item.label}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
