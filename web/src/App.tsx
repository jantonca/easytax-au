import type { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/layout/layout';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { ExpensesPage } from '@/features/expenses/expenses-page';
import { ImportPage } from '@/features/import/import-page';
import { IncomesPage } from '@/features/incomes/incomes-page';
import { BasReportPage } from '@/features/reports/bas-report-page';
import { FyReportPage } from '@/features/reports/fy-report-page';
import { ProvidersPage } from '@/features/settings/providers/providers-page';
import { CategoriesPage } from '@/features/settings/categories/categories-page';
import { ClientsPage } from '@/features/settings/clients/clients-page';

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
        <Route path="settings">
          <Route index element={<Navigate to="/settings/providers" replace />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="clients" element={<ClientsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
