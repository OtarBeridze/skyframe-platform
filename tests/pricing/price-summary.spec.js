const { test, expect } = require('@playwright/test');

async function openConfigurator(page) {
  await page.goto('/');
  await page.click('.menu-item:has-text("Configurator")');
}

// Resets all configurator inputs to a known zero baseline (OD 32×42, no components)
async function resetToZero(page) {
  await page.selectOption('#paper-type', '');
  await page.locator('#print-width').fill('0');
  await page.locator('#print-width').dispatchEvent('change');
  await page.locator('#print-height').fill('0');
  await page.locator('#print-height').dispatchEvent('change');
  await page.selectOption('#frame-in', '|0');
  await page.selectOption('#frame-out', '');
  await page.selectOption('#floater-frame', '');
  await page.selectOption('#mat-type', '');
  await page.selectOption('#glazing-type', '');
  await page.selectOption('#mounting-type', '');
  await page.locator('#misc-lump-sum').fill('0');
  await page.locator('#misc-lump-sum').dispatchEvent('change');
  await page.locator('#misc-per-inch').fill('0');
  await page.locator('#misc-per-inch').dispatchEvent('change');
  await page.locator('#discount-percent').fill('0');
  await page.locator('#discount-percent').dispatchEvent('change');
  await page.locator('#discount-dollar').fill('0');
  await page.locator('#discount-dollar').dispatchEvent('change');
  await page.selectOption('#finish', '1|0'); // WHITE (1x, no fixed fee)
  await page.locator('#frame-width').fill('32');
  await page.locator('#frame-width').dispatchEvent('change');
  await page.locator('#frame-height').fill('42');
  await page.locator('#frame-height').dispatchEvent('change');
}

// ─── Panel structure ───────────────────────────────────────────────────────────

test.describe('Pricing section — panel structure', () => {
  test('All price line elements are present in the Live Quote panel', async ({ page }) => {
    await openConfigurator(page);
    const ids = [
      '#price-printing', '#price-frame', '#price-matting', '#price-glazing',
      '#price-mounting', '#price-misc', '#price-oversize',
      '#price-markup', '#price-subtotal', '#price-discount', '#price-tax', '#price-total',
    ];
    for (const id of ids) {
      await expect(page.locator(id)).toBeVisible();
    }
  });
});

// ─── Zero state ────────────────────────────────────────────────────────────────

test.describe('Pricing section — zero state', () => {
  test.beforeEach(async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
  });

  test('All components zero → subtotal = $0.00', async ({ page }) => {
    await expect(page.locator('#price-subtotal')).toContainText('$0.00');
  });

  test('All components zero → total = $0.00', async ({ page }) => {
    await expect(page.locator('#price-total')).toContainText('$0.00');
  });

  test('All components zero → tax = $0.00', async ({ page }) => {
    await expect(page.locator('#price-tax')).toContainText('$0.00');
  });

  test('All components zero → markup = $0.00', async ({ page }) => {
    await expect(page.locator('#price-markup')).toContainText('$0.00');
  });
});

// ─── Markup ────────────────────────────────────────────────────────────────────

test.describe('Pricing section — markup (28%)', () => {
  test('Misc lump sum $100 → markup = $28.00 (100 × 0.28)', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('100');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    await expect(page.locator('#price-markup')).toContainText('28.00');
  });

  test('C-MAPLE 32×42 → markup = $45.58 (162.80 × 0.28)', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.selectOption('#frame-in', '1.1|2'); // C-MAPLE ($1.1/in, 2" wide)
    await expect(page.locator('#price-markup')).toContainText('45.58');
  });

  test('Adding more components increases markup', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('100');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    const markupText1 = await page.locator('#price-markup').textContent();
    const markup1 = parseFloat(markupText1.replace('$', ''));

    await page.locator('#misc-lump-sum').fill('200');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    const markupText2 = await page.locator('#price-markup').textContent();
    const markup2 = parseFloat(markupText2.replace('$', ''));

    expect(markup2).toBeGreaterThan(markup1);
  });
});

// ─── Subtotal ──────────────────────────────────────────────────────────────────

test.describe('Pricing section — subtotal', () => {
  test('Misc $100 → subtotal = $128.00 (100 + 28 markup)', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('100');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    await expect(page.locator('#price-subtotal')).toContainText('128.00');
  });

  test('C-MAPLE 32×42 → subtotal = $208.38 (162.80 + 45.58 markup)', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.selectOption('#frame-in', '1.1|2'); // C-MAPLE ($1.1/in, 2" wide)
    await expect(page.locator('#price-subtotal')).toContainText('208.38');
  });

  test('Subtotal increases when a component is added', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    const before = parseFloat((await page.locator('#price-subtotal').textContent()).replace('$', ''));

    await page.locator('#misc-lump-sum').fill('50');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    const after = parseFloat((await page.locator('#price-subtotal').textContent()).replace('$', ''));

    expect(after).toBeGreaterThan(before);
  });
});

// ─── Discount ──────────────────────────────────────────────────────────────────

test.describe('Pricing section — discount', () => {
  test('No discount applied → price-discount shows -$0.00', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await expect(page.locator('#price-discount')).toContainText('0.00');
  });

  test('100% percent discount → total = $0.00', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('100');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    await page.locator('#discount-percent').fill('100');
    await page.locator('#discount-percent').dispatchEvent('change');
    await expect(page.locator('#price-total')).toContainText('$0.00');
  });

  test('Dollar discount reduces the total', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('200');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    const totalBefore = parseFloat((await page.locator('#price-total').textContent()).replace('$', ''));

    await page.locator('#discount-dollar').fill('50');
    await page.locator('#discount-dollar').dispatchEvent('change');
    const totalAfter = parseFloat((await page.locator('#price-total').textContent()).replace('$', ''));

    expect(totalAfter).toBeLessThan(totalBefore);
  });

  test('Percent discount and dollar discount stack', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('500');
    await page.locator('#misc-lump-sum').dispatchEvent('change');

    await page.locator('#discount-percent').fill('10');
    await page.locator('#discount-percent').dispatchEvent('change');
    const totalPctOnly = parseFloat((await page.locator('#price-total').textContent()).replace('$', ''));

    await page.locator('#discount-dollar').fill('50');
    await page.locator('#discount-dollar').dispatchEvent('change');
    const totalBoth = parseFloat((await page.locator('#price-total').textContent()).replace('$', ''));

    expect(totalBoth).toBeLessThan(totalPctOnly);
  });
});

// ─── Tax ───────────────────────────────────────────────────────────────────────

test.describe('Pricing section — tax (8.875%)', () => {
  test('Misc $100 → tax = $11.36 (128.00 × 0.08875)', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('100');
    await page.locator('#misc-lump-sum').dispatchEvent('change');
    await expect(page.locator('#price-tax')).toContainText('11.36');
  });

  test('Tax = $0.00 when all components are zero', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await expect(page.locator('#price-tax')).toContainText('$0.00');
  });

  test('Total = subtotal + tax when no discount', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#misc-lump-sum').fill('100');
    await page.locator('#misc-lump-sum').dispatchEvent('change');

    const subtotal = parseFloat((await page.locator('#price-subtotal').textContent()).replace('$', ''));
    const tax = parseFloat((await page.locator('#price-tax').textContent()).replace('$', ''));
    const total = parseFloat((await page.locator('#price-total').textContent()).replace('$', ''));

    expect(total).toBeCloseTo(subtotal + tax, 1);
  });
});

// ─── Oversize surcharge ────────────────────────────────────────────────────────

test.describe('Pricing section — oversize surcharge', () => {
  test('Small dimensions (32×42 OD = 148 linear inches) → oversize = $0.00', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await expect(page.locator('#price-oversize')).toContainText('$0.00');
  });

  test('≥ 218 linear inches (56×56 OD = 224) → oversize = $400.00', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#frame-width').fill('56');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('56');
    await page.locator('#frame-height').dispatchEvent('change');
    await expect(page.locator('#price-oversize')).toContainText('400.00');
  });

  test('≥ 336 linear inches (84×85 OD = 338) → oversize = $1800.00', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#frame-width').fill('84');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('85');
    await page.locator('#frame-height').dispatchEvent('change');
    await expect(page.locator('#price-oversize')).toContainText('1800.00');
  });

  test('≥ 432 linear inches (108×109 OD = 434) → oversize = $4800.00', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    await page.locator('#frame-width').fill('108');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('109');
    await page.locator('#frame-height').dispatchEvent('change');
    await expect(page.locator('#price-oversize')).toContainText('4800.00');
  });

  test('Oversize surcharge is included in subtotal', async ({ page }) => {
    await openConfigurator(page);
    await resetToZero(page);
    const subtotalBefore = parseFloat((await page.locator('#price-subtotal').textContent()).replace('$', ''));

    await page.locator('#frame-width').fill('56');
    await page.locator('#frame-width').dispatchEvent('change');
    await page.locator('#frame-height').fill('56');
    await page.locator('#frame-height').dispatchEvent('change');
    const subtotalAfter = parseFloat((await page.locator('#price-subtotal').textContent()).replace('$', ''));

    expect(subtotalAfter).toBeGreaterThan(subtotalBefore);
  });
});
