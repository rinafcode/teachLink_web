import { Page } from '@playwright/test';

/** Credentials that the mock login API accepts */
export const TEST_USER = {
  email: 'demo@teachlink.com',
  password: 'password123',
  name: 'Demo User',
};

/** A valid user that doesn't exist yet (for signup tests) */
export const NEW_USER = {
  name: 'Test Runner',
  email: `testrunner+${Date.now()}@example.com`,
  password: 'securePass1',
};

/**
 * Fills and submits the login form.
 * Waits for the success redirect to /dashboard.
 */
export async function loginAs(
  page: Page,
  credentials: { email: string; password: string } = TEST_USER,
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

/**
 * Injects a mock JWT token directly into localStorage so tests that
 * only need an authenticated state can skip the login UI entirely.
 */
export async function injectAuthToken(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-jwt-token-e2e');
  });
}
