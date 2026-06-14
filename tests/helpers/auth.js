const { expect } = require('@playwright/test');

// Demo accounts → expected role, display name, avatar letter, and visible menu count.
const ACCOUNTS = {
  developer: { login: 'Developer', password: 'Developer', role: 'developer', name: 'Developer', avatar: 'D', menuCount: 9 },
  admin:     { login: 'Admin',     password: 'Admin',     role: 'admin',     name: 'Admin',     avatar: 'A', menuCount: 8 },
  sales:     { login: 'Sales',     password: 'Sales',     role: 'sales',     name: 'Sales Rep', avatar: 'S', menuCount: 5 },
};

// Navigate to the app and sign in through the login form.
async function loginAs(page, login, password) {
  await page.goto('/');
  await page.fill('#login-username', login);
  await page.fill('#login-password', password);
  await page.click('.btn-login');
  await expect(page.locator('#login-screen')).toBeHidden();
}

// Count sidebar menu items currently visible (excludes the data-page-less logout item).
async function visibleMenuPages(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.menu-item[data-page]'))
      .filter(el => el.style.display !== 'none')
      .map(el => el.getAttribute('data-page'))
  );
}

module.exports = { ACCOUNTS, loginAs, visibleMenuPages };
