const { test, expect } = require('@playwright/test');

test.describe('Sidebar navigation', () => {
  test('Left sidebar is visible on Dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('Left sidebar stays visible when scrolling on Configurator', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Configurator")');
    await page.evaluate(() => document.querySelector('.main-content').scrollTop = 500);
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('Left sidebar stays visible when scrolling on Orders', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Orders")');
    await page.evaluate(() => document.querySelector('.main-content').scrollTop = 400);
    await expect(page.locator('.sidebar')).toBeVisible();
  });

  test('Clicking a menu item marks it as active', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Clients")');
    await expect(page.locator('.menu-item:has-text("Clients")')).toHaveClass(/active/);
  });

  test('Only one menu item is active at a time', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Orders")');
    await page.click('.menu-item:has-text("Clients")');
    const activeItems = await page.locator('.menu-item.active').count();
    expect(activeItems).toBe(1);
  });
});

test.describe('Live Quote panel visibility', () => {
  test('Quote panel is visible on Configurator', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Configurator")');
    await expect(page.locator('#quote-sidebar')).toBeVisible();
  });

  test('Quote panel is hidden on Dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#quote-sidebar')).not.toBeVisible();
  });

  test('Quote panel is hidden on Orders', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Orders")');
    await expect(page.locator('#quote-sidebar')).not.toBeVisible();
  });

  test('Quote panel is hidden on Clients', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Clients")');
    await expect(page.locator('#quote-sidebar')).not.toBeVisible();
  });

  test('Quote panel stays visible while scrolling Configurator', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Configurator")');
    await page.evaluate(() => document.querySelector('.main-content').scrollTop = 800);
    await expect(page.locator('#quote-sidebar')).toBeVisible();
    // Panel should not have scrolled off screen — check it's within viewport
    const box = await page.locator('#quote-sidebar').boundingBox();
    const viewport = page.viewportSize();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 10);
  });

  test('Switching from Configurator to Orders hides the quote panel', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Configurator")');
    await expect(page.locator('#quote-sidebar')).toBeVisible();
    await page.click('.menu-item:has-text("Orders")');
    await expect(page.locator('#quote-sidebar')).not.toBeVisible();
  });
});
