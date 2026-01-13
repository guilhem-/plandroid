import { test, expect } from '@playwright/test';

// Visual tests that capture screenshots of each layout for manual review
// Screenshots are saved to tests/screenshots/

test.describe('Visual Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set a consistent viewport for screenshots
    await page.setViewportSize({ width: 800, height: 600 });
  });

  test('capture start screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'tests/screenshots/01-start-screen.png',
      fullPage: true
    });
  });

  test('capture 1-player layout', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    // Wait for game to load
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500); // Let typography settle

    await page.screenshot({
      path: 'tests/screenshots/02-layout-1-player.png',
      fullPage: true
    });
  });

  test('capture 2-player layout', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="2"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/03-layout-2-player.png',
      fullPage: true
    });
  });

  test('capture 3-player layout', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="3"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/04-layout-3-player.png',
      fullPage: true
    });
  });

  test('capture 4-player layout', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="4"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/05-layout-4-player.png',
      fullPage: true
    });
  });

  test('capture 4-player layout - tablet portrait', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.locator('.btn-count[data-count="4"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/06-layout-4-player-tablet-portrait.png',
      fullPage: true
    });
  });

  test('capture 4-player layout - tablet landscape', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.locator('.btn-count[data-count="4"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/07-layout-4-player-tablet-landscape.png',
      fullPage: true
    });
  });

  test('capture 3-player layout - tablet portrait', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.locator('.btn-count[data-count="3"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/08-layout-3-player-tablet-portrait.png',
      fullPage: true
    });
  });

  test('capture results screen', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    // Answer all 10 questions quickly
    for (let i = 0; i < 10; i++) {
      const answerBtn = page.locator('#zone-0 .btn-answer').first();
      if (await answerBtn.isVisible()) {
        await answerBtn.click();
        await page.waitForTimeout(600);
      }
    }

    await expect(page.locator('#screen-results')).toHaveClass(/active/, { timeout: 5000 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/09-results-screen.png',
      fullPage: true
    });
  });
});
