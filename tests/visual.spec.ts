import { test, expect } from '@playwright/test';

// Visual tests that capture screenshots of each layout for manual review
// Screenshots are saved to tests/screenshots/
// Run with: npm test -- --project=chromium tests/visual.spec.ts

// Device viewport configurations to test
const VIEWPORTS = {
  'phone-portrait': { width: 375, height: 667 },      // iPhone SE
  'phone-landscape': { width: 667, height: 375 },     // iPhone SE landscape
  'phone-tall': { width: 390, height: 844 },          // iPhone 14
  'tablet-portrait': { width: 768, height: 1024 },    // iPad
  'tablet-landscape': { width: 1024, height: 768 },   // iPad landscape
  'desktop': { width: 1280, height: 800 },            // Desktop
};

type ViewportName = keyof typeof VIEWPORTS;

const PLAYER_COUNTS = [1, 2, 3, 4] as const;

test.describe('Visual Layout Tests - All Configurations', () => {
  // Generate tests for each player count and viewport combination
  for (const playerCount of PLAYER_COUNTS) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS) as [ViewportName, { width: number; height: number }][]) {
      test(`${playerCount}-player layout on ${viewportName}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Select player count
        await page.locator(`.btn-count[data-count="${playerCount}"]`).click();
        await page.locator('#btn-start').click();

        // Wait for game to load
        await expect(page.locator('#screen-game')).toHaveClass(/active/);
        await page.waitForTimeout(800); // Let typography settle

        // Verify all zones are visible for this player count
        for (let i = 0; i < playerCount; i++) {
          const zone = page.locator(`#zone-${i}`);
          await expect(zone).toBeVisible();

          // Verify all 4 answer buttons exist in each zone
          const answerButtons = zone.locator('.btn-answer');
          await expect(answerButtons).toHaveCount(4);
        }

        // Save screenshot
        const filename = `layout-${playerCount}p-${viewportName}.png`;
        await page.screenshot({
          path: `tests/screenshots/${filename}`,
          fullPage: true
        });
      });
    }
  }
});

test.describe('Visual UI Elements', () => {
  test('start screen - phone', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['phone-portrait']);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'tests/screenshots/ui-start-phone.png',
      fullPage: true
    });
  });

  test('start screen - tablet', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['tablet-portrait']);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'tests/screenshots/ui-start-tablet.png',
      fullPage: true
    });
  });

  test('results screen', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['phone-portrait']);
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

    await expect(page.locator('#screen-results')).toHaveClass(/active/, { timeout: 10000 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/screenshots/ui-results.png',
      fullPage: true
    });
  });
});

test.describe('Visual Button States', () => {
  test('answer button states - correct and wrong', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['phone-portrait']);
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(500);

    // Click the first answer button
    await page.locator('#zone-0 .btn-answer').first().click();

    // Capture the state showing correct/wrong feedback
    await page.waitForTimeout(200);
    await page.screenshot({
      path: 'tests/screenshots/ui-answer-feedback.png',
      fullPage: true
    });
  });

  test('waiting state after player finishes', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['tablet-portrait']);
    await page.goto('/');
    await page.locator('.btn-count[data-count="2"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);

    // Answer all questions for player 1 only
    for (let i = 0; i < 10; i++) {
      const answerBtn = page.locator('#zone-0 .btn-answer').first();
      if (await answerBtn.isVisible()) {
        await answerBtn.click();
        await page.waitForTimeout(600);
      }
    }

    // Player 1 should now be in waiting state
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'tests/screenshots/ui-waiting-state.png',
      fullPage: true
    });
  });
});

test.describe('Visual Text Sizing', () => {
  test('long question text handling', async ({ page }) => {
    // Use a larger viewport to better see text sizing
    await page.setViewportSize(VIEWPORTS['tablet-landscape']);
    await page.goto('/');
    await page.locator('.btn-count[data-count="4"]').click();
    await page.locator('#btn-start').click();

    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await page.waitForTimeout(1000); // Give typography more time to settle

    await page.screenshot({
      path: 'tests/screenshots/ui-text-sizing.png',
      fullPage: true
    });
  });
});
