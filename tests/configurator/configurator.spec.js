const { test, expect } = require('@playwright/test');

async function openConfigurator(page) {
  await page.goto('/');
  await page.click('.menu-item:has-text("Configurator")');
}

test.describe('Dimension inputs and computed fields', () => {
  test('Total Linear Inches updates when width changes', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '|0');       // NO FRAME (moulding=0)
    await page.locator('#frame-width').fill('20');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('20');
    await page.locator('#frame-height').dispatchEvent('change');
    // totalInches = (20+20)*2 = 80
    await expect(page.locator('#total-inches')).toHaveValue('80');
  });

  test('Total Sq Ft updates when dimensions change', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '|0');       // NO FRAME (moulding=0)
    await page.locator('#frame-width').fill('24');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('36');
    await page.locator('#frame-height').dispatchEvent('change');
    // totalSqFt = (24*36)/144 = 864/144 = 6.00
    await expect(page.locator('#total-sqft')).toHaveValue('6.00');
  });

  test('Total Linear Inches and Sq Ft fields are read-only', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#total-inches')).toHaveAttribute('readonly', '');
    await expect(page.locator('#total-sqft')).toHaveAttribute('readonly', '');
  });

  test('Moulding width affects Total Linear Inches in OD mode', async ({ page }) => {
    await openConfigurator(page);
    await page.check('input[name="dim-mode"][value="OD"]');
    await page.locator('#frame-width').fill('32');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('42');
    await page.locator('#frame-height').dispatchEvent('change');
    // With any Frame In, totalInches is always based on OD (entered values in OD mode)
    await page.selectOption('#frame-in', '2.05|3');   // 3" POPLAR — large moulding
    // OD mode: totalInches still uses entered OD dimensions
    await expect(page.locator('#total-inches')).toHaveValue('148');
  });

  test('getSizeKey handles landscape dimensions correctly (no overcharge)', async ({ page }) => {
    await openConfigurator(page);
    // Landscape: width > height — should normalize to portrait for size bucket lookup
    await page.locator('#frame-width').fill('42');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('32');
    await page.locator('#frame-height').dispatchEvent('change');
    // Price should be the same as portrait 32×42 (orientation-independent)
    await page.selectOption('#frame-in', '|0');
    const landscapeTotal = await page.locator('#price-total').textContent();

    await page.locator('#frame-width').fill('32');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('42');
    await page.locator('#frame-height').dispatchEvent('change');
    const portraitTotal = await page.locator('#price-total').textContent();

    expect(landscapeTotal).toBe(portraitTotal);
  });
});

test.describe('Configurator view content', () => {
  test('Configurator view is shown when menu item is clicked', async ({ page }) => {
    await page.goto('/');
    await page.click('.menu-item:has-text("Configurator")');
    await expect(page.locator('#configurator')).toHaveClass(/active/);
  });

  test('Live Quote panel shows a frame price line', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#price-frame')).toBeVisible();
  });

  test('Live Quote panel shows a total price line', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('#price-total')).toBeVisible();
  });

  test('"+ New Order" button from dashboard opens Configurator', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("+ New Order")');
    await expect(page.locator('#configurator')).toHaveClass(/active/);
  });
});
