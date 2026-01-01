import type { LucideIcon } from 'lucide-react';
import { FileText, Home, ReceiptText, Settings, Upload, WalletCards } from 'lucide-react';

export type NavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  ariaLabel?: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: Home,
    ariaLabel: 'Go to dashboard',
  },
  {
    path: '/expenses',
    label: 'Expenses',
    icon: ReceiptText,
    ariaLabel: 'Go to expenses',
  },
  {
    path: '/incomes',
    label: 'Incomes',
    icon: WalletCards,
    ariaLabel: 'Go to incomes',
  },
  {
    path: '/import',
    label: 'Import',
    icon: Upload,
    ariaLabel: 'Go to CSV import',
  },
  {
    path: '/reports/bas',
    label: 'BAS',
    icon: FileText,
    ariaLabel: 'Go to BAS reports',
  },
  {
    path: '/reports/fy',
    label: 'FY Reports',
    icon: FileText,
    ariaLabel: 'Go to financial year reports',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: Settings,
    ariaLabel: 'Go to settings',
  },
];
