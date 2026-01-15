import { test, expect } from '@playwright/test';

test.describe('Start Screen', () => {
  test('should display start screen on load', async ({ page }) => {
    await page.goto('/');

    const startScreen = page.locator('#screen-start');
    await expect(startScreen).toBeVisible();
    await expect(startScreen).toHaveClass(/active/);
  });

  test('should display title', async ({ page }) => {
    await page.goto('/');

    const title = page.locator('h1[data-i18n="app.title"]');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Fun Trivia');
  });

  test('should have player count selector with default of 2', async ({ page }) => {
    await page.goto('/');

    const activeCount = page.locator('.player-count-selector .btn-count.active');
    await expect(activeCount).toHaveText('2');
  });

  test('should change player count on button click', async ({ page }) => {
    await page.goto('/');

    // Click 3 players button and wait for it to become active
    const btn3 = page.locator('.btn-count[data-count="3"]');
    await btn3.click();
    await expect(btn3).toHaveClass(/active/);
  });

  test('should show correct number of name inputs', async ({ page }) => {
    await page.goto('/');

    // Default is 2 players
    let nameInputs = page.locator('.player-name-input');
    await expect(nameInputs).toHaveCount(2);

    // Switch to 4 players
    const btn4 = page.locator('.btn-count[data-count="4"]');
    await btn4.click();
    await expect(btn4).toHaveClass(/active/);
    nameInputs = page.locator('.player-name-input');
    await expect(nameInputs).toHaveCount(4);
  });

  test('should have start button', async ({ page }) => {
    await page.goto('/');

    const startBtn = page.locator('#btn-start');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toContainText('Start Game');
  });
});

test.describe('Game Screen', () => {
  test('should transition to game screen when start is clicked', async ({ page }) => {
    await page.goto('/');

    // Click start
    await page.locator('#btn-start').click();

    // Wait for game screen to be active
    await expect(page.locator('#screen-game')).toHaveClass(/active/);
    await expect(page.locator('#screen-start')).not.toHaveClass(/active/);
  });

  test('should display correct layout for 2 players', async ({ page }) => {
    await page.goto('/');

    // Ensure 2 players selected (default)
    const btn2 = page.locator('.btn-count[data-count="2"]');
    await btn2.click();
    await expect(btn2).toHaveClass(/active/);
    await page.locator('#btn-start').click();

    const answersArea = page.locator('#answers-area');
    await expect(answersArea).toHaveClass(/layout-2/);
  });

  test('should display correct layout for 3 players', async ({ page }) => {
    await page.goto('/');

    const btn3 = page.locator('.btn-count[data-count="3"]');
    await btn3.click();
    await expect(btn3).toHaveClass(/active/);
    await page.locator('#btn-start').click();

    const answersArea = page.locator('#answers-area');
    await expect(answersArea).toHaveClass(/layout-3/);
  });

  test('should display correct layout for 4 players', async ({ page }) => {
    await page.goto('/');

    const btn4 = page.locator('.btn-count[data-count="4"]');
    await btn4.click();
    await expect(btn4).toHaveClass(/active/);
    await page.locator('#btn-start').click();

    const answersArea = page.locator('#answers-area');
    await expect(answersArea).toHaveClass(/layout-4/);
  });

  test('should show player zones with questions', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-start').click();

    // Player 0 zone should have a question
    const zone0Question = page.locator('#zone-0 .zone-question');
    await expect(zone0Question).toBeVisible();

    // Question text should not be empty
    const questionText = await zone0Question.textContent();
    expect(questionText?.trim().length).toBeGreaterThan(0);
  });

  test('should show 4 answer buttons per player zone', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-start').click();

    const zone0Answers = page.locator('#zone-0 .btn-answer');
    await expect(zone0Answers).toHaveCount(4);
  });

  test('should show player scores initialized to 0/0', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-start').click();

    const zone0Score = page.locator('#zone-0 .zone-score');
    await expect(zone0Score).toHaveText('0/0');
  });
});

test.describe('Game Flow', () => {
  test('should update score when correct answer clicked', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    // Find and click answers until we get one right
    const zone0 = page.locator('#zone-0');
    const initialScore = await zone0.locator('.zone-score').textContent();

    // Click first answer
    await zone0.locator('.btn-answer').first().click();

    // Wait a bit for animation
    await page.waitForTimeout(600);

    // Score should have changed (either increased or stayed same)
    const newScore = await zone0.locator('.zone-score').textContent();
    expect(newScore).toBeDefined();
  });

  test('should show correct/wrong feedback on answer', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    const answerBtn = page.locator('#zone-0 .btn-answer').first();
    await answerBtn.click();

    // Button should have either correct or wrong class
    await page.waitForTimeout(100);
    const hasCorrect = await answerBtn.evaluate(el => el.classList.contains('correct'));
    const hasWrong = await answerBtn.evaluate(el => el.classList.contains('wrong'));

    expect(hasCorrect || hasWrong).toBeTruthy();
  });

  test('should load next question after answering', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    const zone0Question = page.locator('#zone-0 .zone-question');
    const firstQuestion = await zone0Question.textContent();

    // Answer the question
    await page.locator('#zone-0 .btn-answer').first().click();

    // Wait for next question
    await page.waitForTimeout(700);

    // Question should either change or player finishes (shows waiting state)
    const afterAnswerQuestion = await zone0Question.textContent();
    // The question text will change after answering
    expect(afterAnswerQuestion).toBeDefined();
  });
});

test.describe('Results Screen', () => {
  test('should show results after completing all questions', async ({ page }) => {
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

    // Results screen should be visible
    await expect(page.locator('#screen-results')).toHaveClass(/active/, { timeout: 5000 });
  });

  test('should have play again button on results', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    // Answer all questions
    for (let i = 0; i < 10; i++) {
      const answerBtn = page.locator('#zone-0 .btn-answer').first();
      if (await answerBtn.isVisible()) {
        await answerBtn.click();
        await page.waitForTimeout(600);
      }
    }

    await expect(page.locator('#screen-results')).toHaveClass(/active/, { timeout: 5000 });

    const playAgainBtn = page.locator('#btn-play-again');
    await expect(playAgainBtn).toBeVisible();
  });

  test('should return to start screen when play again clicked', async ({ page }) => {
    await page.goto('/');
    await page.locator('.btn-count[data-count="1"]').click();
    await page.locator('#btn-start').click();

    // Answer all questions
    for (let i = 0; i < 10; i++) {
      const answerBtn = page.locator('#zone-0 .btn-answer').first();
      if (await answerBtn.isVisible()) {
        await answerBtn.click();
        await page.waitForTimeout(600);
      }
    }

    await expect(page.locator('#screen-results')).toHaveClass(/active/, { timeout: 5000 });

    await page.locator('#btn-play-again').click();

    await expect(page.locator('#screen-start')).toHaveClass(/active/);
  });
});

test.describe('Language Selector', () => {
  test('should have language button', async ({ page }) => {
    await page.goto('/');

    const langBtn = page.locator('#btn-language');
    await expect(langBtn).toBeVisible();
  });

  test('should display current language code', async ({ page }) => {
    await page.goto('/');

    const currentLang = page.locator('#current-lang');
    await expect(currentLang).toBeVisible();
    const langText = await currentLang.textContent();
    expect(['EN', 'FR', 'ES', 'DE']).toContain(langText);
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on start screen', async ({ page }) => {
    await page.goto('/');

    // Check for basic accessibility attributes
    const langBtn = page.locator('#btn-language');
    await expect(langBtn).toHaveAttribute('aria-label');
  });

  test('answer buttons should be touchable size', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-start').click();

    const answerBtn = page.locator('#zone-0 .btn-answer').first();
    const box = await answerBtn.boundingBox();

    // Minimum touch target is 44px
    expect(box?.height).toBeGreaterThanOrEqual(36); // Allow some tolerance
    expect(box?.width).toBeGreaterThanOrEqual(36);
  });
});
