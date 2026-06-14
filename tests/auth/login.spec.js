const { test, expect } = require('@playwright/test');
const { ACCOUNTS, loginAs, visibleMenuPages } = require('../helpers/auth');

// This whole file runs logged OUT — override the global authenticated storageState
// so we can exercise the login screen and per-role behaviour from a clean state.
test.use({ storageState: { cookies: [], origins: [] } });

// ─── Login screen ────────────────────────────────────────────────────────────
test.describe('Login screen', () => {
  test('Login screen is shown when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#login-screen')).toBeVisible();
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('Invalid password shows an error and stays on the login screen', async ({ page }) => {
    await page.goto('/');
    await page.fill('#login-username', 'Admin');
    await page.fill('#login-password', 'wrong-password');
    await page.click('.btn-login');
    await expect(page.locator('#login-error')).toBeVisible();
    await expect(page.locator('#login-screen')).toBeVisible();
  });

  test('Unknown user shows an error', async ({ page }) => {
    await page.goto('/');
    await page.fill('#login-username', 'nobody');
    await page.fill('#login-password', 'nobody');
    await page.click('.btn-login');
    await expect(page.locator('#login-error')).toBeVisible();
    await expect(page.locator('#login-screen')).toBeVisible();
  });

  test('Empty submit does not log in', async ({ page }) => {
    await page.goto('/');
    await page.click('.btn-login');
    await expect(page.locator('#login-screen')).toBeVisible();
  });

  test('Login is case-insensitive', async ({ page }) => {
    await page.goto('/');
    await page.fill('#login-username', 'aDmIn');
    await page.fill('#login-password', 'ADMIN');
    await page.click('.btn-login');
    await expect(page.locator('#login-screen')).toBeHidden();
    await expect(page.locator('#current-user-name')).toHaveText('Admin');
  });
});

// ─── Valid logins → role applied ─────────────────────────────────────────────
test.describe('Valid logins apply the correct role', () => {
  for (const key of Object.keys(ACCOUNTS)) {
    const acct = ACCOUNTS[key];

    test(`${acct.login} / ${acct.password} → ${acct.name}, ${acct.menuCount} menu items`, async ({ page }) => {
      await loginAs(page, acct.login, acct.password);
      await expect(page.locator('#current-user-name')).toHaveText(acct.name);
      await expect(page.locator('#role-avatar')).toHaveText(acct.avatar);
      const pages = await visibleMenuPages(page);
      expect(pages.length).toBe(acct.menuCount);
      // Everyone lands on the Dashboard after login
      await expect(page.locator('#dashboard')).toHaveClass(/active/);
    });
  }
});

// ─── Sidebar visibility per role ─────────────────────────────────────────────
test.describe('Sidebar reflects role permissions', () => {
  test('Sales Rep sees exactly the 5 sales-facing pages', async ({ page }) => {
    await loginAs(page, 'Sales', 'Sales');
    expect(await visibleMenuPages(page)).toEqual(
      ['dashboard', 'configurator', 'quotes', 'orders', 'clients']
    );
    await expect(page.locator('.menu-item[data-page="pricing-admin"]')).toBeHidden();
    await expect(page.locator('.menu-item[data-page="users"]')).toBeHidden();
    await expect(page.locator('.menu-item[data-page="qa-automation"]')).toBeHidden();
  });

  test('Admin sees every page except QA Automation', async ({ page }) => {
    await loginAs(page, 'Admin', 'Admin');
    await expect(page.locator('.menu-item[data-page="pricing-admin"]')).toBeVisible();
    await expect(page.locator('.menu-item[data-page="users"]')).toBeVisible();
    await expect(page.locator('.menu-item[data-page="qa-automation"]')).toBeHidden();
  });

  test('Developer sees all pages including QA Automation', async ({ page }) => {
    await loginAs(page, 'Developer', 'Developer');
    await expect(page.locator('.menu-item[data-page="qa-automation"]')).toBeVisible();
    expect((await visibleMenuPages(page)).length).toBe(9);
  });
});

// ─── Navigation guard ────────────────────────────────────────────────────────
test.describe('Navigation guard blocks forbidden pages', () => {
  test('Sales Rep cannot open Users & Roles (redirected to Dashboard)', async ({ page }) => {
    await loginAs(page, 'Sales', 'Sales');
    await page.evaluate(() => showView('users'));
    await expect(page.locator('#dashboard')).toHaveClass(/active/);
    await expect(page.locator('#users')).not.toHaveClass(/active/);
  });

  test('Admin cannot open QA Automation (redirected to Dashboard)', async ({ page }) => {
    await loginAs(page, 'Admin', 'Admin');
    await page.evaluate(() => showView('qa-automation'));
    await expect(page.locator('#dashboard')).toHaveClass(/active/);
    await expect(page.locator('#qa-automation')).not.toHaveClass(/active/);
  });

  test('Developer can open QA Automation', async ({ page }) => {
    await loginAs(page, 'Developer', 'Developer');
    await page.evaluate(() => showView('qa-automation'));
    await expect(page.locator('#qa-automation')).toHaveClass(/active/);
  });
});

// ─── Permissions Matrix (Developer-only) ─────────────────────────────────────
test.describe('Permissions Matrix is Developer-only', () => {
  test('Developer sees the Permissions Matrix on Users & Roles', async ({ page }) => {
    await loginAs(page, 'Developer', 'Developer');
    await page.evaluate(() => showView('users'));
    await expect(page.locator('#permissions-matrix-section')).toBeVisible();
    await expect(page.locator('#permissions-matrix-body tr')).toHaveCount(9);
  });

  test('Admin sees the Users table but NOT the Permissions Matrix', async ({ page }) => {
    await loginAs(page, 'Admin', 'Admin');
    await page.evaluate(() => showView('users'));
    await expect(page.locator('#users')).toHaveClass(/active/);
    await expect(page.locator('#permissions-matrix-section')).toBeHidden();
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────
test.describe('Logout', () => {
  test('Logout control lives in the sidebar, not the header', async ({ page }) => {
    await loginAs(page, 'Admin', 'Admin');
    await expect(page.locator('.menu-item-logout')).toBeVisible();
    await expect(page.locator('.user-info .btn-logout')).toHaveCount(0);
  });

  test('Clicking sidebar Log out returns to the login screen', async ({ page }) => {
    await loginAs(page, 'Developer', 'Developer');
    await page.click('.menu-item-logout');
    await expect(page.locator('#login-screen')).toBeVisible();
  });

  test('After logout the session is cleared on reload', async ({ page }) => {
    await loginAs(page, 'Developer', 'Developer');
    await page.click('.menu-item-logout');
    await page.reload();
    await expect(page.locator('#login-screen')).toBeVisible();
  });
});

// ─── Session persistence ─────────────────────────────────────────────────────
test.describe('Session persistence', () => {
  test('A logged-in session survives a page reload', async ({ page }) => {
    await loginAs(page, 'Developer', 'Developer');
    await page.reload();
    await expect(page.locator('#login-screen')).toBeHidden();
    expect((await visibleMenuPages(page)).length).toBe(9);
  });
});
