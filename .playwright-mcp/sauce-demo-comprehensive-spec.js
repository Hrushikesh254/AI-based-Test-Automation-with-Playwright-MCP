const { test, expect } = require('@playwright/test');
const BASE = 'https://www.saucedemo.com/';
const PASSWORD = 'secret_sauce';
const USERS = ['standard_user', 'problem_user', 'performance_glitch_user', 'error_user', 'visual_user'];
const ITEMS = ['Sauce Labs Backpack', 'Sauce Labs Bike Light', 'Sauce Labs Bolt T-Shirt', 'Sauce Labs Fleece Jacket', 'Sauce Labs Onesie', 'Test.allTheThings() T-Shirt (Red)'];
async function login(page, username = 'standard_user') {
  await page.goto(BASE);
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
}
async function menu(page) { await page.getByRole('button', { name: 'Open Menu' }).click(); }
async function add(page, item) {
  await page.locator('.inventory_item').filter({ hasText: item }).getByRole('button', { name: 'Add to cart' }).click();
}
async function customer(page) {
  await page.getByPlaceholder('First Name').fill('Ada');
  await page.getByPlaceholder('Last Name').fill('Lovelace');
  await page.getByPlaceholder('Zip/Postal Code').fill('10001');
}
async function logout(page) {
  await menu(page);
  await page.getByRole('button', { name: 'Logout' }).click();
}

test.describe('Authentication and session management', () => {
  test('signs in with all accepted profiles and rejects locked_out_user', async ({ page }) => {
    for (const user of USERS) {
      await login(page, user);
      await expect(page).toHaveURL(/inventory.html$/);
      await expect(page.getByText('Products', { exact: true })).toBeVisible();
      await logout(page);
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    }
    await page.getByPlaceholder('Username').fill('locked_out_user');
    await page.getByPlaceholder('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(BASE);
    await expect(page.getByRole('alert')).toContainText(/locked out/i);
  });
  test('validates empty, partial, and invalid login credentials', async ({ page }) => {
    await page.goto(BASE);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('alert')).toContainText(/username is required/i);
    await page.getByRole('button', { name: /dismiss/i }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByPlaceholder('Username').fill('standard_user');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByRole('alert')).toContainText(/password is required/i);
    await page.getByPlaceholder('Username').fill('invalid_user');
    await page.getByPlaceholder('Password').fill('invalid_password');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(BASE);
    await expect(page.getByRole('alert')).toBeVisible();
  });
  test('logs out and blocks direct access to protected pages', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await logout(page);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    for (const route of ['inventory.html', 'cart.html']) {
      await page.goto(BASE + route);
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    }
  });
});

test.describe('Catalog and navigation', () => {
  test('shows six products and sorts by name and price in both directions', async ({ page }) => {
    await login(page);
    const names = page.locator('.inventory_item_name');
    const prices = page.locator('.inventory_item_price');
    await expect(names).toHaveCount(6);
    await expect(page.locator('.inventory_item_img')).toHaveCount(6);
    await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(6);
    const sort = page.getByRole('combobox', { name: 'Sort products' });
    await sort.selectOption('az');
    expect(await names.allTextContents()).toEqual(ITEMS);
    await sort.selectOption('za');
    expect(await names.allTextContents()).toEqual([...ITEMS].reverse());
    await sort.selectOption('lohi');
    let values = (await prices.allTextContents()).map((x) => Number(x.slice(1)));
    expect(values).toEqual([...values].sort((a, b) => a - b));
    await sort.selectOption('hilo');
    values = (await prices.allTextContents()).map((x) => Number(x.slice(1)));
    expect(values).toEqual([...values].sort((a, b) => b - a));
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
  });
  test('opens each product from image and title, then returns to inventory', async ({ page }) => {
    await login(page);
    for (const item of ITEMS) {
      const card = page.locator('.inventory_item').filter({ hasText: item });
      await card.locator('.inventory_item_img').click();
      await expect(page.getByText(item, { exact: true })).toBeVisible();
      await expect(page.getByRole('img', { name: item })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add to cart' })).toBeVisible();
      await page.getByRole('button', { name: 'Back to products' }).click();
      const titleCard = page.locator('.inventory_item').filter({ hasText: item });
      await titleCard.getByRole('button', { name: 'View details for ' + item }).last().click();
      await expect(page).toHaveURL(/inventory-item.html\?id=/);
      await expect(page.getByText(item, { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Back to products' }).click();
      await expect(page).toHaveURL(/inventory.html$/);
    }
    await page.locator('.inventory_item').first().locator('.inventory_item_name').click();
    await page.goBack();
    await expect(page).toHaveURL(/inventory.html$/);
  });
  test('synchronizes add/remove actions from inventory, detail, and cart', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await expect(page.getByRole('button', { name: 'Cart, 1 items' })).toBeVisible();
    await page.locator('.inventory_item').filter({ hasText: ITEMS[1] }).getByRole('button', { name: 'View details for ' + ITEMS[1] }).last().click();
    await page.getByRole('button', { name: 'Add to cart' }).click();
    await expect(page.getByRole('button', { name: 'Cart, 2 items' })).toBeVisible();
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('button', { name: 'Cart, 1 items' })).toBeVisible();
    await page.getByRole('button', { name: 'Cart, 1 items' }).click();
    await expect(page.getByText(ITEMS[0], { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
  });
  test('supports menu navigation and retains expected footer destinations', async ({ page }) => {
    await login(page);
    await menu(page);
    await expect(page.getByRole('navigation')).toBeVisible();
    await page.getByRole('button', { name: 'Dynamic Catalog' }).click();
    await expect(page).toHaveURL(/inventory.html$/);
    await menu(page);
    await page.getByRole('button', { name: 'All Items' }).click();
    await expect(page.getByText('Products', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toHaveAttribute('href', 'https://saucelabs.com/');
    await expect(page.getByRole('link', { name: 'X' })).toHaveAttribute('href', 'https://x.com/saucelabs');
    await expect(page.getByRole('link', { name: 'Facebook' })).toHaveAttribute('href', 'https://www.facebook.com/saucelabs');
    await expect(page.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/company/sauce-labs/');
  });
  test('reset app state clears cart state from inventory', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await add(page, ITEMS[1]);
    await menu(page);
    await page.getByRole('button', { name: 'Reset App State' }).click();
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(6);
    await page.getByRole('button', { name: 'Cart, empty' }).click();
    await expect(page.locator('.cart_item')).toHaveCount(0);
  });
});

test.describe('Cart and checkout', () => {
  test('shows empty cart and supports Continue Shopping', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: 'Cart, empty' }).click();
    await expect(page).toHaveURL(/cart.html$/);
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await page.getByRole('button', { name: 'Continue Shopping' }).click();
    await expect(page).toHaveURL(/inventory.html$/);
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
  });
  test('reviews and removes selected cart items without affecting others', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await add(page, ITEMS[4]);
    await page.getByRole('button', { name: 'Cart, 2 items' }).click();
    await expect(page.locator('.cart_item')).toHaveCount(2);
    await expect(page.getByText(ITEMS[0], { exact: true })).toBeVisible();
    await expect(page.getByText(ITEMS[4], { exact: true })).toBeVisible();
    await page.locator('.cart_item').filter({ hasText: ITEMS[0] }).getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('button', { name: 'Cart, 1 items' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue Shopping' }).click();
    await page.getByRole('button', { name: 'Cart, 1 items' }).click();
    await expect(page.locator('.cart_item')).toHaveCount(1);
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.cart_item')).toHaveCount(0);
  });
  test('validates required first name, last name, and postal code', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await page.getByRole('button', { name: 'Cart, 1 items' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText(/first name is required/i);
    await page.getByPlaceholder('First Name').fill('Ada');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText(/last name is required/i);
    await page.getByPlaceholder('Last Name').fill('Lovelace');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toContainText(/postal code is required/i);
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/checkout-step-two.html$/);
    await expect(page.locator('.cart_item')).toHaveCount(1);
  });
  test('cancels checkout at both steps while preserving cart contents', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await add(page, ITEMS[1]);
    await page.getByRole('button', { name: 'Cart, 2 items' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/cart.html$/);
    await expect(page.locator('.cart_item')).toHaveCount(2);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await customer(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/inventory.html$/);
    await expect(page.getByRole('button', { name: 'Cart, 2 items' })).toBeVisible();
  });
  test('calculates subtotal, tax, and total for multiple products', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await add(page, ITEMS[4]);
    await page.getByRole('button', { name: 'Cart, 2 items' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await customer(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Payment Information:')).toBeVisible();
    await expect(page.getByText('Shipping Information:')).toBeVisible();
    const prices = await page.locator('.cart_item .inventory_item_price').allTextContents();
    const subtotal = prices.reduce((sum, value) => sum + Number(value.slice(1)), 0);
    const parseAmount = (text) => Number(text.match(/\$([0-9]+\.[0-9]{2})/)[1]);
    const itemTotal = await page.locator('.summary_subtotal_label').innerText();
    const tax = await page.locator('.summary_tax_label').innerText();
    const total = await page.locator('.summary_total_label').innerText();
    expect(parseAmount(itemTotal)).toBeCloseTo(subtotal, 2);
    expect(parseAmount(total)).toBeCloseTo(parseAmount(itemTotal) + parseAmount(tax), 2);
  });
  test('completes purchase, downloads PDF, and returns home with empty cart', async ({ page }) => {
    await login(page);
    await add(page, ITEMS[0]);
    await page.getByRole('button', { name: 'Cart, 1 items' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await customer(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/checkout-complete.html$/);
    await expect(page.getByRole('heading', { name: 'Thank you for your order!' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Generate PDF order' }).click();
    expect((await downloadPromise).suggestedFilename()).toMatch(/\.pdf$/i);
    await page.getByRole('button', { name: 'Back Home' }).click();
    await expect(page).toHaveURL(/inventory.html$/);
    await expect(page.getByRole('button', { name: 'Cart, empty' })).toBeVisible();
  });
});

test.describe('Profile variations, resilience, and usability', () => {
  test('exercises inventory, sorting, details, cart, and checkout across profiles', async ({ page }) => {
    for (const user of USERS) {
      await login(page, user);
      await expect(page.locator('.inventory_item')).toHaveCount(6);
      await page.getByRole('combobox', { name: 'Sort products' }).selectOption('lohi');
      await expect(page.locator('.inventory_item')).toHaveCount(6);
      await page.locator('.inventory_item').filter({ hasText: ITEMS[0] }).getByRole('button', { name: 'View details for ' + ITEMS[0] }).last().click();
      await expect(page.getByText(ITEMS[0], { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Back to products' }).click();
      await add(page, ITEMS[0]);
      await page.getByRole('button', { name: 'Cart, 1 items' }).click();
      await expect(page.locator('.cart_item')).toHaveCount(1);
      await page.getByRole('button', { name: 'Checkout' }).click();
      await customer(page);
      await page.getByRole('button', { name: 'Continue' }).click();
      await expect(page).toHaveURL(/checkout-step-two.html$/);
      await logout(page);
    }
  });
  test('protects direct routes and handles an invalid product id', async ({ page }) => {
    for (const route of ['inventory.html', 'cart.html', 'checkout-step-one.html', 'checkout-step-two.html', 'checkout-complete.html']) {
      await page.goto(BASE + route);
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    }
    await login(page);
    await page.goto(BASE + 'inventory-item.html?id=999999');
    await expect(page.getByRole('button', { name: 'Back to products' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(0);
  });
  test('keeps inventory and checkout controls usable at desktop, tablet, and mobile widths', async ({ page }) => {
    await login(page);
    for (const viewport of [{ width: 1280, height: 800 }, { width: 768, height: 1024 }, { width: 375, height: 812 }]) {
      await page.setViewportSize(viewport);
      await expect(page.locator('.inventory_list')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Open Menu' })).toBeVisible();
    }
    await add(page, ITEMS[0]);
    await page.getByRole('button', { name: 'Cart, 1 items' }).click();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });
  test('supports keyboard navigation and announces checkout validation', async ({ page }) => {
    await page.goto(BASE);
    await page.keyboard.press('Tab');
    await expect(page.getByPlaceholder('Username')).toBeFocused();
    await page.keyboard.type('standard_user');
    await page.keyboard.press('Tab');
    await page.keyboard.type(PASSWORD);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Login' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/inventory.html$/);
    await add(page, ITEMS[0]);
    await page.getByRole('button', { name: 'Cart, 1 items' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dismiss error' })).toBeVisible();
  });
});
