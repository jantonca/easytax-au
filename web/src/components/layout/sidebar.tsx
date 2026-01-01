import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps): ReactElement {
  return (
    <aside
      className={cn(
        'w-56 shrink-0 border-r border-slate-800 bg-slate-950/80 px-3 py-4 backdrop-blur-md',
        className,
      )}
    >
      <div className="mb-4 px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          EasyTax-AU
        </p>
      </div>
      <nav aria-label="Main navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors',
                    'hover:bg-slate-800/70 hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500',
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
    </aside>
  );
}
