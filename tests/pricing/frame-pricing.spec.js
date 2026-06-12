const { test, expect } = require('@playwright/test');

// Helper: open configurator and reset to known baseline state
async function openConfigurator(page) {
  await page.goto('/');
  await page.click('.menu-item:has-text("Configurator")');
  // Reset to deterministic baseline: 32×42 OD, NO FRAME, NO FINISH multiplier, no extras
  await page.locator('#frame-width').fill('32');
  await page.locator('#frame-width').dispatchEvent('change');
  await page.locator('#frame-height').fill('42');
  await page.locator('#frame-height').dispatchEvent('change');
  await page.check('input[name="dim-mode"][value="OD"]');
  await page.selectOption('#finish', '1|0');          // WHITE — finishMult=1, finishFixed=0
  await page.selectOption('#frame-out', '');          // NO FRAME OUT
  await page.selectOption('#floater-frame', '');      // NO FLOATER
  const splined = page.locator('#splined-corners');
  if (await splined.isChecked()) await splined.uncheck();
}

test.describe('Frame In pricing', () => {
  test('C-MAPLE 32×42 OD, WHITE finish → $162.80', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '1.1|2');    // C-MAPLE $1.1/in, moulding 2"
    // totalInches = (32+42)*2 = 148; framePrice = 148 * 1.1 * 1 + 0 = 162.80
    await expect(page.locator('#total-inches')).toHaveValue('148');
    await expect(page.locator('#price-frame')).toContainText('162.80');
  });

  test('C-MAPLE 32×42 OD, CUSTOM LACQUER (2× + $80) → $405.60', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '1.1|2');
    await page.selectOption('#finish', '2|80');       // finishMult=2, finishFixed=80
    // framePrice = 148 * 1.1 * 2 + 80 = 325.60 + 80 = 405.60
    await expect(page.locator('#price-frame')).toContainText('405.60');
  });

  test('finishFixed $80 added exactly once — not repeated', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '1.1|2');
    await page.selectOption('#finish', '2|80');
    const text = await page.locator('#price-frame').textContent();
    // If finishFixed were added twice, price would be 325.60 + 160 = 485.60
    expect(text).not.toContain('485.60');
    expect(text).toContain('405.60');
  });

  test('Splined corners adds $100 surcharge', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '1.1|2');
    await page.check('#splined-corners');
    // framePrice = 162.80 + 100 = 262.80
    await expect(page.locator('#price-frame')).toContainText('262.80');
  });

  test('NO FRAME selected → frame price $0', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '|0');       // NO FRAME
    await expect(page.locator('#price-frame')).toContainText('0.00');
  });
});

test.describe('Frame Out / Fillet pricing', () => {
  test('Frame In C-MAPLE + Frame Out D-ASH, WHITE → $347.80', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '1.1|2');    // 148 * 1.1 = 162.80
    await page.selectOption('#frame-out', '1.25');    // 148 * 1.25 = 185.00
    // framePrice = 162.80 + 185.00 = 347.80
    await expect(page.locator('#price-frame')).toContainText('347.80');
  });

  test('Frame Out with CUSTOM LACQUER applies finishMult', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '1.1|2');
    await page.selectOption('#finish', '2|80');
    await page.selectOption('#frame-out', '1.25');
    // framePrice = (148*1.1*2 + 80) + (148*1.25*2) = 405.60 + 370.00 = 775.60
    await expect(page.locator('#price-frame')).toContainText('775.60');
  });

  test('Frame Out without Frame In (fillet only), WHITE → $259.00', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '|0');       // NO FRAME
    await page.selectOption('#frame-out', '1.75');    // JB-13 POPLAR $1.75/in
    // mouldingWidth=0 so totalInches = (32+42)*2 = 148; 148 * 1.75 = 259.00
    await expect(page.locator('#price-frame')).toContainText('259.00');
  });
});

test.describe('Floater Frame pricing', () => {
  test('Standard size 32×42, Poplar 1/2×2 → $296.00', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '|0');
    await page.selectOption('#floater-frame', '2|2.5'); // std=2, ovr=2.5
    // odW=32 ≤ 44, odH=42 ≤ 64 → std rate 2; 148 * 2 = 296.00
    await expect(page.locator('#price-frame')).toContainText('296.00');
  });

  test('Oversize odW > 44: 48×42, Poplar 1/2×2 → oversize rate', async ({ page }) => {
    await openConfigurator(page);
    await page.locator('#frame-width').fill('48');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.selectOption('#frame-in', '|0');
    await page.selectOption('#floater-frame', '2|2.5');
    // odW=48 > 44 → ovr rate 2.5; totalInches=(48+42)*2=180; 180*2.5=450.00
    await expect(page.locator('#price-frame')).toContainText('450.00');
  });

  test('Oversize odH > 64: 32×72, Poplar 1/2×2 → oversize rate', async ({ page }) => {
    await openConfigurator(page);
    await page.locator('#frame-height').fill('72');
    await page.locator('#frame-height').dispatchEvent('change');
    await page.selectOption('#frame-in', '|0');
    await page.selectOption('#floater-frame', '2|2.5');
    // odH=72 > 64 → ovr rate 2.5; totalInches=(32+72)*2=208; 208*2.5=520.00
    await expect(page.locator('#price-frame')).toContainText('520.00');
  });

  test('No floater selected → frame price $0', async ({ page }) => {
    await openConfigurator(page);
    await page.selectOption('#frame-in', '|0');
    await page.selectOption('#floater-frame', '');
    await expect(page.locator('#price-frame')).toContainText('0.00');
  });
});
