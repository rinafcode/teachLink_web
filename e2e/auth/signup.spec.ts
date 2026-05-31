import { test, expect } from '@playwright/test';
import { NEW_USER } from '../helpers/auth';

test.describe('Signup flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  // ── Page structure ────────────────────────────────────────────────────────

  test('renders the signup page with all required elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });

  // ── Validation ────────────────────────────────────────────────────────────

  test('shows validation errors when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/full name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test('shows error when name is too short', async ({ page }) => {
    await page.getByLabel('Full Name').fill('A');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/at least 2 characters/i)).toBeVisible();
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.getByLabel('Full Name').fill(NEW_USER.name);
    await page.getByLabel('Email').fill('bad-email');
    await page.getByLabel('Password').fill(NEW_USER.password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByText(/invalid email format/i)).toBeVisible();
  });

  // ── Successful signup ─────────────────────────────────────────────────────

  test('creates account successfully and redirects to dashboard', async ({ page }) => {
    await page.getByLabel('Full Name').fill(NEW_USER.name);
    await page.getByLabel('Email').fill(NEW_USER.email);
    await page.getByLabel('Password').fill(NEW_USER.password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/account created successfully/i)).toBeVisible();
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── Duplicate email ───────────────────────────────────────────────────────

  test('shows error when email is already registered', async ({ page }) => {
    await page.route('**/api/auth/signup', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already registered' }),
      });
    });

    await page.getByLabel('Full Name').fill('Existing User');
    await page.getByLabel('Email').fill('existing@teachlink.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText(/email already registered/i)).toBeVisible();
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  test('navigates to login page from signup', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
