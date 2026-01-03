import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';

export function SettingsTabs(): ReactElement {
  return (
    <nav className="mb-4 border-b border-slate-800" aria-label="Settings navigation">
      <ul className="flex gap-1">
        <li>
          <NavLink
            to="/settings/providers"
            className={({ isActive }) =>
              `inline-flex items-center border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`
            }
          >
            Providers
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings/categories"
            className={({ isActive }) =>
              `inline-flex items-center border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`
            }
          >
            Categories
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings/clients"
            className={({ isActive }) =>
              `inline-flex items-center border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`
            }
          >
            Clients
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
