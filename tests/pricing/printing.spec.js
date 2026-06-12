const { test, expect } = require('@playwright/test');

async function openConfigurator(page) {
  await page.goto('/');
  await page.click('.menu-item:has-text("Configurator")');
}

async function setPrint(page, paperType, printType, width, height) {
  await page.selectOption('#paper-type', paperType);
  await page.selectOption('#multiple-prints', printType);
  await page.locator('#print-width').fill(String(width));
  await page.locator('#print-width').dispatchEvent('change');
  await page.locator('#print-height').fill(String(height));
  await page.locator('#print-height').dispatchEvent('change');
}

async function resetPrinting(page) {
  await page.selectOption('#paper-type', '');
  await page.locator('#print-width').fill('0');
  await page.locator('#print-width').dispatchEvent('change');
  await page.locator('#print-height').fill('0');
  await page.locator('#print-height').dispatchEvent('change');
}

// ─── No printing ──────────────────────────────────────────────────────────────

test.describe('Printing — no printing selected', () => {
  test('No paper type selected → print price $0.00', async ({ page }) => {
    await openConfigurator(page);
    await resetPrinting(page);
    await expect(page.locator('#price-printing')).toContainText('$0.00');
  });

  test('Paper type set but dimensions are 0 → print price $0.00', async ({ page }) => {
    await openConfigurator(page);
    await setPrint(page, 'ENHANCED MATTE', 'single', 0, 0);
    await expect(page.locator('#price-printing')).toContainText('$0.00');
  });
});

// ─── Standard category ────────────────────────────────────────────────────────

test.describe('Printing — Standard category (Enhanced Matte)', () => {
  test.beforeEach(async ({ page }) => {
    await openConfigurator(page);
  });

  test('Enhanced Matte 16×20 Single → $58.88 (46 × 1.28)', async ({ page }) => {
    await setPrint(page, 'ENHANCED MATTE', 'single', 16, 20);
    await expect(page.locator('#price-printing')).toContainText('58.88');
  });

  test('Enhanced Matte 16×20 Multiple → $40.96 (32 × 1.28)', async ({ page }) => {
    await setPrint(page, 'ENHANCED MATTE', 'multiple', 16, 20);
    await expect(page.locator('#price-printing')).toContainText('40.96');
  });

  test('Multiple print price is lower than Single for same paper and size', async ({ page }) => {
    await setPrint(page, 'ENHANCED MATTE', 'single', 16, 20);
    const singleText = await page.locator('#price-printing').textContent();
    const singlePrice = parseFloat(singleText.replace('$', ''));

    await page.selectOption('#multiple-prints', 'multiple');
    const multipleText = await page.locator('#price-printing').textContent();
    const multiplePrice = parseFloat(multipleText.replace('$', ''));

    expect(multiplePrice).toBeLessThan(singlePrice);
  });
});

// ─── Fine Art category ────────────────────────────────────────────────────────

test.describe('Printing — Fine Art category (Hahnemühle)', () => {
  test.beforeEach(async ({ page }) => {
    await openConfigurator(page);
  });

  test('Hahnemühle 16×20 Single → $115.20 (90 × 1.28)', async ({ page }) => {
    await setPrint(page, 'HAHNEMUHLE', 'single', 16, 20);
    await expect(page.locator('#price-printing')).toContainText('115.20');
  });

  test('Fine Art price is higher than Standard for the same size', async ({ page }) => {
    await setPrint(page, 'ENHANCED MATTE', 'single', 16, 20); // STANDARD
    const stdText = await page.locator('#price-printing').textContent();
    const stdPrice = parseFloat(stdText.replace('$', ''));

    await page.selectOption('#paper-type', 'HAHNEMUHLE'); // FINE ART
    const fineText = await page.locator('#price-printing').textContent();
    const finePrice = parseFloat(fineText.replace('$', ''));

    expect(finePrice).toBeGreaterThan(stdPrice);
  });
});

// ─── Gallery Fine Art category ────────────────────────────────────────────────

test.describe('Printing — Gallery Fine Art category (Canvas)', () => {
  test.beforeEach(async ({ page }) => {
    await openConfigurator(page);
  });

  test('Canvas 16×20 Single → $158.72 (124 × 1.28)', async ({ page }) => {
    await setPrint(page, 'CANVAS', 'single', 16, 20);
    await expect(page.locator('#price-printing')).toContainText('158.72');
  });

  test('Canvas 24×36 Single → $355.84 (278 × 1.28)', async ({ page }) => {
    await setPrint(page, 'CANVAS', 'single', 24, 36);
    await expect(page.locator('#price-printing')).toContainText('355.84');
  });

  test('Gallery price is higher than Fine Art for the same size', async ({ page }) => {
    await setPrint(page, 'HAHNEMUHLE', 'single', 16, 20); // FINE ART
    const fineText = await page.locator('#price-printing').textContent();
    const finePrice = parseFloat(fineText.replace('$', ''));

    await page.selectOption('#paper-type', 'CANVAS'); // GALLERY FINE ART
    const galleryText = await page.locator('#price-printing').textContent();
    const galleryPrice = parseFloat(galleryText.replace('$', ''));

    expect(galleryPrice).toBeGreaterThan(finePrice);
  });
});

// ─── Size bucketing and edge cases ───────────────────────────────────────────

test.describe('Printing — size bucketing', () => {
  test.beforeEach(async ({ page }) => {
    await openConfigurator(page);
  });

  test('Landscape 20×16 produces the same price as portrait 16×20', async ({ page }) => {
    await setPrint(page, 'ENHANCED MATTE', 'single', 16, 20);
    const portraitPrice = await page.locator('#price-printing').textContent();

    await setPrint(page, 'ENHANCED MATTE', 'single', 20, 16);
    const landscapePrice = await page.locator('#price-printing').textContent();

    expect(landscapePrice).toBe(portraitPrice);
  });

  test('Smaller print size 8×10 costs less than 16×20 (Standard Single)', async ({ page }) => {
    await setPrint(page, 'ENHANCED MATTE', 'single', 8, 10);
    const smallText = await page.locator('#price-printing').textContent();
    const smallPrice = parseFloat(smallText.replace('$', ''));

    await setPrint(page, 'ENHANCED MATTE', 'single', 16, 20);
    const largeText = await page.locator('#price-printing').textContent();
    const largePrice = parseFloat(largeText.replace('$', ''));

    expect(smallPrice).toBeLessThan(largePrice);
  });

  test('Dimensions exceeding all size buckets → print price $0.00', async ({ page }) => {
    await setPrint(page, 'ENHANCED MATTE', 'single', 100, 200);
    await expect(page.locator('#price-printing')).toContainText('$0.00');
  });
});
