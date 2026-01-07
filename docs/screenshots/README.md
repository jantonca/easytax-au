# Screenshots Guide

This directory contains screenshots for the main README.md feature showcase.

## Required Screenshots

Please capture the following screenshots with realistic data (ensure no real client names/ABNs are visible due to encryption):

### 1. `dashboard.png`
- **Route:** `/` (Dashboard)
- **What to show:**
  - BAS summary cards (G1, 1A, 1B, Net GST) with sample data
  - Recent expenses list (5-10 entries)
  - Upcoming recurring expenses panel
  - Quick action buttons
- **Recommended size:** 1920x1080 (full viewport)
- **Theme:** Light mode (or capture both light and dark)

### 2. `expenses.png`
- **Route:** `/expenses`
- **What to show:**
  - Expenses table with multiple entries
  - Filter controls (provider, category, date range)
  - "Add Expense" button visible
  - Sorting indicators on column headers
- **Recommended size:** 1920x1080
- **Theme:** Light mode

### 3. `incomes.png`
- **Route:** `/incomes`
- **What to show:**
  - Incomes table with multiple entries
  - Paid/unpaid badges visible
  - Filter controls (client, paid status, date range)
  - "Add Income" button visible
- **Recommended size:** 1920x1080
- **Theme:** Light mode

### 4. `bas-report.png`
- **Route:** `/reports/bas`
- **What to show:**
  - Quarter selector with current period selected
  - BAS summary cards (G1, 1A, 1B, Net GST)
  - Record counts (income and expense counts)
  - PDF download button
- **Recommended size:** 1920x1080
- **Theme:** Light mode

### 5. `fy-report.png`
- **Route:** `/reports/fy`
- **What to show:**
  - Year selector with current FY selected
  - FY summary cards (income, expenses, net position)
  - Category breakdown table
  - BAS label breakdown (expanded)
  - PDF download button
- **Recommended size:** 1920x1080
- **Theme:** Light mode

### 6. `recurring.png`
- **Route:** `/recurring`
- **What to show:**
  - Recurring expenses table with multiple templates
  - Color-coded due dates (overdue/due soon/future)
  - "Generate Due Expenses" button
  - "Add Recurring Expense" button
- **Recommended size:** 1920x1080
- **Theme:** Light mode

### 7. `settings.png`
- **Route:** `/settings/providers` (or `/settings/categories` or `/settings/clients`)
- **What to show:**
  - Settings tabs (Providers, Categories, Clients)
  - Data table with entries
  - "Add [Resource]" button visible
- **Recommended size:** 1920x1080
- **Theme:** Light mode

### 8. `dark-mode.png`
- **Route:** `/` (Dashboard)
- **What to show:**
  - Same as `dashboard.png` but in **dark mode**
  - Theme toggle button visible in header
  - Shows the dark theme styling
- **Recommended size:** 1920x1080
- **Theme:** Dark mode

## Screenshot Tool Recommendations

### macOS
- **Built-in:** `⌘Shift+4` then `Space` to capture window, or `⌘Shift+3` for full screen
- **Firefox/Chrome DevTools:** Open DevTools → Device toolbar → Set viewport to 1920x1080

### Linux
- **GNOME Screenshot:** `gnome-screenshot -w` (window) or `gnome-screenshot` (full screen)
- **Firefox/Chrome DevTools:** Open DevTools → Device toolbar → Set viewport to 1920x1080

### Windows
- **Snipping Tool** or **Windows+Shift+S**
- **Firefox/Chrome DevTools:** Open DevTools → Device toolbar → Set viewport to 1920x1080

## Privacy Note

- Ensure no real client names, ABNs, or personal information is visible in screenshots
- Use test/demo data for captures
- Client names should show as encrypted (🔒 icons) in forms or use placeholder names like "Client A", "Client B"

## After Capturing

Place all 8 PNG files in this directory with the exact filenames listed above. The README.md already references these images with relative paths.
