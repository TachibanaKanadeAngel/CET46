import { test, expect } from '@playwright/test';

/**
 * 等待应用词库加载完成（stat-total 显示非零值）
 */
async function waitForAppReady(page) {
  await page.addInitScript(() => {
    localStorage.setItem('cet46_shortcut_guide_shown', 'true');
  });
  await page.goto('', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const el = document.getElementById('stat-total');
      return el && parseInt(el.textContent, 10) > 0;
    },
    { timeout: 20000 }
  );
}

/**
 * E2E 冒烟测试 — 验证应用核心流程可正常运行
 */
test.describe('CET46 应用冒烟测试', () => {
  test('页面正确加载并显示标题', async ({ page }) => {
    await page.goto('', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/CET46|46英语/);
  });

  test('主导航标签可见且可切换', async ({ page }) => {
    await waitForAppReady(page);

    // 验证 5 个导航标签存在
    const tabs = ['study', 'review', 'wrong', 'stats', 'list'];
    for (const tab of tabs) {
      const tabBtn = page.locator(`[data-tab="${tab}"]`);
      await expect(tabBtn).toBeVisible();
    }

    // 验证默认显示学习视图
    await expect(page.locator('#view-study')).toBeVisible();

    // 点击统计标签并验证切换
    await page.locator('[data-tab="stats"]').click();
    await expect(page.locator('#view-stats')).toBeVisible();
  });

  test('学习卡片和开始按钮存在', async ({ page }) => {
    await waitForAppReady(page);
    await expect(page.locator('#study-card')).toBeVisible();
    await expect(page.locator('#start-btn')).toBeVisible();
  });

  test('词库列表视图可访问', async ({ page }) => {
    await waitForAppReady(page);
    await page.locator('[data-tab="list"]').click();
    await expect(page.locator('#view-list')).toBeVisible();
    await expect(page.locator('#search-input')).toBeVisible();
  });
});
