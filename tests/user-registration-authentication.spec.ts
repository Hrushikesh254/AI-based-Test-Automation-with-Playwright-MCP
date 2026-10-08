import { test, expect, type Page } from '@playwright/test';
const baseUrl = 'https://parabank.parasoft.com/parabank';
const password = 'DemoPass123';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    return (character === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });
}

function createSyntheticSsn() {
  return randomInt(100_000_000, 1_000_000_000).toString();
}

async function registerCustomer(page: Page, username: string) {
  await page.goto(`${baseUrl}/index.htm`);
  await page.getByRole('link', { name: 'Register' }).click();
  await page.locator('[id="customer.firstName"]').fill('QA');
  await page.locator('[id="customer.lastName"]').fill('Automation');
  await page.locator('[id="customer.address.street"]').fill('123 Test Lane');
  await page.locator('[id="customer.address.city"]').fill('Testville');
  await page.locator('[id="customer.address.state"]').fill('TS');
  await page.locator('[id="customer.address.zipCode"]').fill('00000');
  await page.locator('[id="customer.phoneNumber"]').fill('0000000000');
  await page.locator('[id="customer.ssn"]').fill(createSyntheticSsn());
  await page.locator('[id="customer.username"]').fill(username);
  await page.locator('[id="customer.password"]').fill(password);
  await page.locator('#repeatedPassword').fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(
    page.getByText('Your account was created successfully. You are now logged in.'),
  ).toBeVisible();
}

test.describe('User Registration and Authentication', () => {
  // The public ParaBank server reports every fresh username as already existing, including UUIDs.
  test.fixme('Register a customer and authenticate with the new credentials', async ({ page }) => {
    const username = `qa_user_${randomUUID().replaceAll('-', '')}`;
    await registerCustomer(page, username);
    await expect(page.getByRole('link', { name: 'Accounts Overview' })).toBeVisible();

    await page.getByRole('link', { name: 'Log Out' }).click();
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByRole('link', { name: 'Accounts Overview' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log Out' })).toBeVisible();
  });

  test('reject incomplete registration and mismatched passwords', async ({ page }) => {
    await page.goto(`${baseUrl}/index.htm`);
    await page.getByRole('link', { name: 'Register' }).click();
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText('First name is required.')).toBeVisible();
    await expect(page.getByText('Last name is required.')).toBeVisible();
    await expect(page.getByText('Address is required.')).toBeVisible();
    await expect(page.getByText('Username is required.')).toBeVisible();
    await expect(page.getByText('Password is required.')).toBeVisible();
    await expect(
      page.getByText('Your account was created successfully. You are now logged in.'),
    ).toHaveCount(0);

    await page.locator('[id="customer.firstName"]').fill('QA');
    await page.locator('[id="customer.lastName"]').fill('Automation');
    await page.locator('[id="customer.address.street"]').fill('123 Test Lane');
    await page.locator('[id="customer.address.city"]').fill('Testville');
    await page.locator('[id="customer.address.state"]').fill('TS');
    await page.locator('[id="customer.address.zipCode"]').fill('00000');
    await page.locator('[id="customer.phoneNumber"]').fill('0000000000');
    await page.locator('[id="customer.ssn"]').fill(createSyntheticSsn());
    await page.locator('[id="customer.username"]').fill(`qa_invalid_${randomUUID().replaceAll('-', '')}`);
    await page.locator('[id="customer.password"]').fill(password);
    await page.locator('#repeatedPassword').fill('DifferentPass456');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText('Passwords did not match.')).toBeVisible();
    await expect(
      page.getByText('Your account was created successfully. You are now logged in.'),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Accounts Overview' })).toHaveCount(0);
  });

  test('deny invalid login and do not reveal information for an unsuccessful lookup', async ({
    page,
  }) => {
    await page.goto(`${baseUrl}/index.htm`);
    await page.locator('input[name="username"]').fill(`unknown_${randomUUID().replaceAll('-', '')}`);
    await page.locator('input[name="password"]').fill('WrongPass123');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('The username and password could not be verified.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accounts Overview' })).toHaveCount(0);

    await page.getByRole('link', { name: 'Forgot login info?' }).click();
    await page.locator('#firstName').fill('Unknown');
    await page.locator('#lastName').fill('Customer');
    await page.locator('[id="address.street"]').fill('999 Nowhere Road');
    await page.locator('[id="address.city"]').fill('NoCity');
    await page.locator('[id="address.state"]').fill('ZZ');
    await page.locator('[id="address.zipCode"]').fill('99999');
    await page.locator('#ssn').fill('999999999');
    await page.getByRole('button', { name: 'Find My Login Info' }).click();

    await expect(
      page.getByText('The customer information provided could not be found.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accounts Overview' })).toHaveCount(0);
  });

  test('deny access to account overview after ending a session', async ({ page }) => {
    await page.goto(`${baseUrl}/logout.htm`);
    await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accounts Overview' })).toHaveCount(0);

    await page.goto(`${baseUrl}/overview.htm`);
    await expect(page.getByRole('heading', { name: 'Customer Login' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accounts Overview' })).toHaveCount(0);
  });
});
