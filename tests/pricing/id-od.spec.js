const { test, expect } = require('@playwright/test');

async function openConfigurator(page) {
  await page.goto('/');
  await page.click('.menu-item:has-text("Configurator")');
}

test.describe('ID/OD dimension conversion', () => {
  test('OD mode 32×42 with C-MAPLE (moulding 2") → totalInches 148', async ({ page }) => {
    await openConfigurator(page);
    await page.check('input[name="dim-mode"][value="OD"]');
    await page.locator('#frame-width').fill('32');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('42');
    await page.locator('#frame-height').dispatchEvent('change');
    await page.selectOption('#frame-in', '1.1|2');
    // OD: odW=32, odH=42; totalInches=(32+42)*2=148
    await expect(page.locator('#total-inches')).toHaveValue('148');
  });

  test('ID mode 28×38 with C-MAPLE (moulding 2") → same totalInches 148 as OD 32×42', async ({ page }) => {
    await openConfigurator(page);
    await page.check('input[name="dim-mode"][value="ID"]');
    await page.locator('#frame-width').fill('28');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('38');
    await page.locator('#frame-height').dispatchEvent('change');
    await page.selectOption('#frame-in', '1.1|2');
    // ID: idW=28,idH=38; odW=28+4=32, odH=38+4=42; totalInches=(32+42)*2=148
    await expect(page.locator('#total-inches')).toHaveValue('148');
  });

  test('OD and ID modes produce the same frame price for equivalent sizes', async ({ page }) => {
    // OD 32×42
    await openConfigurator(page);
    await page.check('input[name="dim-mode"][value="OD"]');
    await page.locator('#frame-width').fill('32');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('42');
    await page.locator('#frame-height').dispatchEvent('change');
    await page.selectOption('#frame-in', '1.1|2');
    await page.selectOption('#finish', '1|0');
    const odPrice = await page.locator('#price-frame').textContent();

    // ID 28×38 (same physical frame)
    await page.check('input[name="dim-mode"][value="ID"]');
    await page.locator('#frame-width').fill('28');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('38');
    await page.locator('#frame-height').dispatchEvent('change');
    const idPrice = await page.locator('#price-frame').textContent();

    expect(odPrice).toBe(idPrice);
  });

  test('Total Sq Ft uses ID dimensions (ID area, not OD)', async ({ page }) => {
    await openConfigurator(page);
    await page.check('input[name="dim-mode"][value="OD"]');
    await page.locator('#frame-width').fill('32');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('42');
    await page.locator('#frame-height').dispatchEvent('change');
    await page.selectOption('#frame-in', '1.1|2');    // moulding 2" → idW=28, idH=38
    // totalSqFt = (28*38)/144 = 1064/144 ≈ 7.39
    const sqft = await page.locator('#total-sqft').inputValue();
    expect(parseFloat(sqft)).toBeCloseTo(7.39, 1);
  });

  test('OD default radio is checked on page load', async ({ page }) => {
    await openConfigurator(page);
    await expect(page.locator('input[name="dim-mode"][value="OD"]')).toBeChecked();
  });
});

test.describe('Frame In / Floater Frame mutual exclusivity', () => {
  test('Selecting Frame In moulding clears Floater Frame', async ({ page }) => {
    await openConfigurator(page);
    // First select a floater
    await page.selectOption('#frame-in', '|0');
    await page.selectOption('#floater-frame', '2|2.5');
    // Now select a real Frame In moulding
    await page.selectOption('#frame-in', '1.1|2');
    // Floater should be cleared
    await expect(page.locator('#floater-frame')).toHaveValue('');
  });

  test('Selecting Floater Frame resets Frame In to NO FRAME', async ({ page }) => {
    await openConfigurator(page);
    // First select a frame
    await page.selectOption('#frame-in', '1.1|2');
    // Now select a floater — onFloaterChange should fire via change event
    await page.selectOption('#floater-frame', '2|2.5');
    // Frame In should be reset to |0
    await expect(page.locator('#frame-in')).toHaveValue('|0');
  });

  test('Selecting NO FRAME in Frame In does NOT clear Floater', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#floater-frame', '2|2.5');
    // Selecting NO FRAME (|0) should not clear floater
    await page.selectOption('#frame-in', '|0');
    await expect(page.locator('#floater-frame')).toHaveValue('2|2.5');
  });
});
