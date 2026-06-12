const { test, expect } = require('@playwright/test');

async function openConfigurator(page) {
  await page.goto('/');
  await page.click('.menu-item:has-text("Configurator")');
}

test.describe('Client section', () => {
  test('Client selector is visible on Configurator page', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#client-selector')).toBeVisible();
  });

  test('Default client is Walk-in Client (empty value)', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#client-selector')).toHaveValue('');
  });

  test('Walk-in Client option is present in the dropdown', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#client-selector option[value=""]')).toContainText('Walk-in Client');
  });
});

test.describe('Art Description section', () => {
  test('Art description textarea is present and accepts input', async ({ page }) => {
    await openConfigurator(page);
    await page.fill('#art-description', 'Portrait of a landscape, oil on canvas');
    await expect(page.locator('#art-description')).toHaveValue('Portrait of a landscape, oil on canvas');
  });

  test('Art size input is present and accepts input', async ({ page }) => {
    await openConfigurator(page);
    await page.fill('#art-size', '24 x 36 inches');
    await expect(page.locator('#art-size')).toHaveValue('24 x 36 inches');
  });

  test('Art description has correct placeholder text', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#art-description')).toHaveAttribute('placeholder', 'Describe the artwork...');
  });

  test('Art size has correct placeholder text', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#art-size')).toHaveAttribute('placeholder', 'e.g., 24 x 36 inches');
  });

  test('Filling art description and size does not change pricing total', async ({ page }) => {
    await openConfigurator(page);
    const totalBefore = await page.locator('#price-total').textContent();
    await page.fill('#art-description', 'Very expensive abstract piece');
    await page.fill('#art-size', '100 x 200 inches');
    const totalAfter = await page.locator('#price-total').textContent();
    expect(totalBefore).toBe(totalAfter);
  });
});
