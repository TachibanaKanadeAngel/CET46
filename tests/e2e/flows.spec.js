import { test, expect } from '@playwright/test';

/**
 * 等待应用词库加载完成（stat-total 显示非零值）
 */
async function waitForAppReady(page) {
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const el = document.getElementById('stat-total');
      return el && parseInt(el.textContent, 10) > 0;
    },
    { timeout: 20000 }
  );
}

test.describe('拼写挑战流程', () => {
  test("开始学习后拼写正确并显示成功结果", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cet46_shortcut_guide_shown', 'true');
    });

    await waitForAppReady(page);

    await page.locator('#start-btn').click();
    await expect(page.locator('#study-buttons')).toBeVisible();

    const wordText = (await page.locator('#study-word').textContent()) || '';
    const word = wordText.trim();
    expect(word.length).toBeGreaterThan(0);

    await page.locator('#btn-spell').click();
    await expect(page.locator('#spelling-modal')).toHaveClass(/active/);
    await expect(page.locator('#spelling-input')).toBeVisible();

    await page.locator('#spelling-input').fill(word.toLowerCase());
    await page.locator('#spelling-submit').click();

    await expect(page.locator('#spelling-result')).toHaveClass(/show/);
    await expect(page.locator('#spelling-result-text')).toContainText(/正确/);

    await expect(page.locator('#spelling-submit')).toHaveText('继续');
  });
});

test.describe('错词专项复习流程', () => {
  test('标记不认识后错题列表计数增加并可专项复习', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cet46_shortcut_guide_shown', 'true');
    });

    await waitForAppReady(page);

    const initialCount = parseInt(
      (await page.locator('#wrong-count').textContent()) || '0',
      10
    );

    await page.locator('#start-btn').click();
    await expect(page.locator('#study-buttons')).toBeVisible();

    await page.locator('#btn-unknown').click();

    // renderWrongList() only runs on tab switch, so switch to wrong-words tab
    await page.locator('[data-tab="wrong"]').click();
    await expect(page.locator('#view-wrong')).toBeVisible();

    // After tab switch, wrong-count is updated by renderWrongList()
    const wrongCount = parseInt(
      (await page.locator('#wrong-count').textContent()) || '0',
      10
    );
    expect(wrongCount).toBeGreaterThan(initialCount);

    await page.locator('#wrong-study-btn').click();
    await expect(page.locator('#view-study')).toBeVisible();
    await expect(page.locator('#study-buttons')).toBeVisible();
  });
});

test.describe('离线模式', () => {
  test('离线时显示离线横幅且标签可切换', async ({ page, context }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cet46_shortcut_guide_shown', 'true');
    });

    await waitForAppReady(page);

    await context.setOffline(true);

    await expect(page.locator('#offline-banner')).toBeVisible();

    await page.locator('[data-tab="stats"]').click();
    await expect(page.locator('#view-stats')).toBeVisible();

    await page.locator('[data-tab="study"]').click();
    await expect(page.locator('#view-study')).toBeVisible();

    await context.setOffline(false);

    await expect(page.locator('#offline-banner')).toBeHidden();
  });
});

test.describe('WebDAV 同步界面', () => {
  test('配置面板可展开、表单可填写并保存', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cet46_shortcut_guide_shown', 'true');
    });

    await waitForAppReady(page);

    await page.locator('[data-tab="stats"]').click();
    await expect(page.locator('#view-stats')).toBeVisible();

    await expect(page.locator('#webdav-config')).toBeHidden();
    await page.locator('#toggle-config-btn').click();
    await expect(page.locator('#webdav-config')).toBeVisible();

    await expect(page.locator('#webdav-url')).toBeVisible();
    await expect(page.locator('#webdav-master-key')).toBeVisible();
    await expect(page.locator('#webdav-username')).toBeVisible();
    await expect(page.locator('#webdav-password')).toBeVisible();
    await expect(page.locator('#webdav-auto-sync')).toBeVisible();

    await page.locator('#webdav-url').fill('https://dav.example.com/words');
    await page.locator('#webdav-master-key').fill('test-master-key');
    await page.locator('#webdav-username').fill('testuser');
    await page.locator('#webdav-password').fill('testpass');
    await page.locator('#webdav-auto-sync').check();

    await page.locator('#save-webdav-btn').click();

    const status = page.locator('#webdav-status');
    await expect(status).not.toHaveText('', { timeout: 5000 });
  });
});
