import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Comprehensive Manual Simulation Test', () => {
  let errors = [];
  let warnings = [];

  test.beforeEach(async ({ page }) => {
    errors = [];
    warnings = [];
    
    // Capture unhandled exceptions
    page.on('pageerror', (err) => {
      errors.push(`Page Error: ${err.message}`);
    });

    // Capture console errors/warnings
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (text.includes("frame-ancestors")) return;
        errors.push(`Console Error: ${text}`);
      } else if (msg.type() === 'warning') {
        warnings.push(`Console Warning: ${text}`);
      }
    });

    // Skip the shortcut guide
    await page.addInitScript(() => {
      localStorage.setItem('cet46_shortcut_guide_shown', 'true');
    });
  });

  test('Systematically operate all functions and check for errors', async ({ page }) => {
    console.log('Navigating to app...');
    await page.goto('', { waitUntil: 'domcontentloaded' });

    // Wait for the app to be ready
    await page.waitForFunction(
      () => {
        const el = document.getElementById('stat-total');
        return el && parseInt(el.textContent, 10) > 0;
      },
      { timeout: 30000 }
    );
    console.log('App ready. Starting interactions.');

    // 1. Basic Flow - Study
    const startBtn = page.locator('#start-btn');
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(500); // Wait for UI transition
    }

    const studyButtons = page.locator('#study-buttons');
    await expect(studyButtons).toBeVisible();

    // Click 'Know' button
    if (await page.locator('#btn-known').isVisible()) {
      await page.locator('#btn-known').click();
      await page.waitForTimeout(300);
    }

    // Click 'Unknown' button
    if (await page.locator('#btn-unknown').isVisible()) {
      await page.locator('#btn-unknown').click();
      await page.waitForTimeout(300);
    }

    // Spelling Feature
    if (await page.locator('#btn-spell').isVisible()) {
      await page.locator('#btn-spell').click();
      await page.waitForTimeout(500);
      const wordText = (await page.locator('#study-word').textContent()) || '';
      const word = wordText.trim();
      if (word && await page.locator('#spelling-input').isVisible()) {
        await page.locator('#spelling-input').fill(word.toLowerCase());
        await page.locator('#spelling-submit').click();
        await page.waitForTimeout(500);
        await page.locator('#spelling-submit').click(); // 'Continue' button
        await page.waitForTimeout(500);
      }
    }

    // 2. Tab Navigation
    console.log('Testing Tab Navigation...');
    const tabs = ['stats', 'study', 'review', 'wrong', 'list'];
    for (const tab of tabs) {
      await page.locator(`[data-tab="${tab}"]`).click();
      await page.waitForTimeout(500);
      await expect(page.locator(`#view-${tab}`)).toBeVisible();
    }

    // 3. WebDAV Config Interaction (under stats)
    await page.locator('[data-tab="stats"]').click();
    await page.waitForTimeout(300);
    if (await page.locator('#toggle-config-btn').isVisible()) {
      await page.locator('#toggle-config-btn').click();
      await page.waitForTimeout(300);
      await page.locator('#toggle-config-btn').click();
      await page.waitForTimeout(300);
    }

    // Toggle theme
    if (await page.locator('#toggle-theme').isVisible()) {
      await page.locator('#toggle-theme').click();
      await page.waitForTimeout(300);
      await page.locator('#toggle-theme').click();
      await page.waitForTimeout(300);
    }

    // 4. List Interaction
    console.log('Testing List interactions...');
    await page.locator('[data-tab="list"]').click();
    await page.waitForTimeout(500);
    
    // Test filter buttons
    const filterButtons = ['all', 'learning', 'reviewing', 'mastered'];
    for (const filter of filterButtons) {
      const btn = page.locator(`.filter-btn[data-filter="${filter}"]`);
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(300);
      }
    }

    // 5. Wrong Words Interaction
    console.log('Testing Wrong Words interactions...');
    await page.locator('[data-tab="wrong"]').click();
    await page.waitForTimeout(500);
    
    if (await page.locator('#wrong-study-btn').isVisible()) {
      await page.locator('#wrong-study-btn').click();
      await page.waitForTimeout(500);
    }

    // Write errors and warnings to file
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync('test-results/comprehensive-errors.json', JSON.stringify({ errors, warnings }, null, 2));

    expect(errors.length).toBe(0); // If errors found, test will fail here
  });
});
