import type { ReactElement } from 'react';
import { NavLink } from 'react-router-dom';

export function ImportTabs(): ReactElement {
  return (
    <nav
      className="mb-4 border-b border-slate-200 dark:border-slate-800"
      aria-label="Import navigation"
    >
      <ul className="flex gap-1">
        <li>
          <NavLink
            to="/import/expenses"
            className={({ isActive }) =>
              `inline-flex items-center border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
              }`
            }
          >
            Expenses
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/import/incomes"
            className={({ isActive }) =>
              `inline-flex items-center border-b-2 px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-300'
              }`
            }
          >
            Incomes
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
