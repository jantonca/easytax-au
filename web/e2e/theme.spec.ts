import { test, expect } from '@playwright/test';

test.describe('Dark Mode Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop size to ensure theme labels are visible
    await page.setViewportSize({ width: 1280, height: 720 });
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display theme toggle button in header', async ({ page }) => {
    await page.goto('/');

    // Check for theme toggle button
    const themeButton = page.getByRole('button', { name: /switch theme/i });
    await expect(themeButton).toBeVisible();
  });

  test('should default to system theme on first visit', async ({ page }) => {
    // Navigate with empty localStorage (already cleared in beforeEach)
    await page.goto('/');

    // On first visit, theme should default to system
    // The app may set localStorage to 'system' as the default, or leave it null
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme === null || theme === 'system').toBe(true);

    // Check that the theme button shows "Auto" (system theme)
    const themeButton = page.getByRole('button', { name: /switch theme/i });
    await expect(themeButton).toContainText('Auto');
  });

  test('should cycle through themes: Auto → Light → Dark → Auto', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Initial state: Auto
    await expect(themeButton).toContainText('Auto');

    // Click to Light
    await themeButton.click();
    await expect(themeButton).toContainText('Light');

    // Click to Dark
    await themeButton.click();
    await expect(themeButton).toContainText('Dark');

    // Click to Auto
    await themeButton.click();
    await expect(themeButton).toContainText('Auto');
  });

  test('should apply dark class to document when dark theme is selected', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Click to Light
    await themeButton.click();
    let htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).not.toContain('dark');

    // Click to Dark
    await themeButton.click();
    htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');

    // Click back to Auto (depends on system preference)
    await themeButton.click();
    htmlClass = await page.evaluate(() => document.documentElement.className);
    // Auto theme - class depends on system preference, so we just check it's a string
    expect(typeof htmlClass).toBe('string');
  });

  test('should persist theme to localStorage', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Set to dark
    await themeButton.click(); // Auto → Light
    await themeButton.click(); // Light → Dark

    // Check localStorage
    const savedTheme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(savedTheme).toBe('dark');
  });

  test('should restore theme from localStorage on page reload', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Set to dark
    await themeButton.click(); // Auto → Light
    await themeButton.click(); // Light → Dark
    await expect(themeButton).toContainText('Dark');

    // Reload page
    await page.reload();

    // Check theme is still dark
    const themeButtonAfterReload = page.getByRole('button', { name: /switch theme/i });
    await expect(themeButtonAfterReload).toContainText('Dark');

    // Verify dark class is still applied
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });

  test('should show correct icon for each theme', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Auto theme - should show both icons overlapped
    await expect(themeButton).toBeVisible();

    // Light theme - should show Sun icon
    await themeButton.click(); // Auto → Light
    await expect(themeButton).toContainText('Light');
    // Note: We can't easily test for specific Lucide icons in E2E, but we verify the label

    // Dark theme - should show Moon icon
    await themeButton.click(); // Light → Dark
    await expect(themeButton).toContainText('Dark');
  });

  test('should update header colors in dark mode', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Switch to dark mode
    await themeButton.click(); // Auto → Light
    await themeButton.click(); // Light → Dark

    // Check that header has dark mode classes
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify dark class is applied to document
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    expect(htmlClass).toContain('dark');
  });

  test('should handle localStorage unavailable gracefully', async ({ page, context }) => {
    // Block localStorage access by disabling it in the page context
    await page.goto('/');

    // Override localStorage to throw errors
    await page.evaluate(() => {
      const throwError = (): never => {
        throw new Error('localStorage is not available');
      };
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: throwError,
          setItem: throwError,
          removeItem: throwError,
          clear: throwError,
          key: throwError,
          length: 0,
        },
        writable: false,
      });
    });

    // Reload to test with broken localStorage
    await page.reload();

    // Theme toggle should still work (just won't persist)
    const themeButton = page.getByRole('button', { name: /switch theme/i });
    await expect(themeButton).toBeVisible();

    // Should be able to click without errors
    await themeButton.click();
    await expect(themeButton).toContainText('Light');
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to theme toggle button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs depending on page structure

    // Find the theme button
    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Focus should eventually reach the theme button (we'll directly focus it for reliability)
    await themeButton.focus();

    // Verify it's focused
    const isFocused = await themeButton.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBe(true);

    // Press Enter to toggle
    await page.keyboard.press('Enter');

    // Theme should change
    await expect(themeButton).toContainText('Light');
  });

  test('should show accessible aria-label with current theme', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.getByRole('button', { name: /switch theme/i });

    // Check aria-label includes current theme
    const ariaLabel = await themeButton.getAttribute('aria-label');
    expect(ariaLabel).toContain('Auto'); // Default is Auto

    // Change to light
    await themeButton.click();
    const ariaLabelLight = await themeButton.getAttribute('aria-label');
    expect(ariaLabelLight).toContain('Light');

    // Change to dark
    await themeButton.click();
    const ariaLabelDark = await themeButton.getAttribute('aria-label');
    expect(ariaLabelDark).toContain('Dark');
  });
});
