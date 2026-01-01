import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/layout';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { ExpensesPage } from '@/features/expenses/expenses-page';
import { ImportPage } from '@/features/import/import-page';
import { IncomesPage } from '@/features/incomes/incomes-page';
import { BasReportPage } from '@/features/reports/bas-report-page';
import { FyReportPage } from '@/features/reports/fy-report-page';
import { SettingsPage } from '@/features/settings/settings-page';

function App(): ReactElement {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="incomes" element={<IncomesPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="reports/bas" element={<BasReportPage />} />
        <Route path="reports/fy" element={<FyReportPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
