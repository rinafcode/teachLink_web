import { test, expect } from '@playwright/test';

test.describe('Discord OAuth Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display Discord button on login page', async ({ page }) => {
    const discordButton = page.locator('button:has-text("Discord")');
    await expect(discordButton).toBeVisible();
  });

  test('should display Discord button on signup page', async ({ page }) => {
    await page.goto('/signup');
    const discordButton = page.locator('button:has-text("Discord")');
    await expect(discordButton).toBeVisible();
  });

  test('should redirect to Discord when clicking Discord button', async ({ page }) => {
    const discordButton = page.locator('button:has-text("Discord")');

    // Note: This test will actually redirect to Discord, which requires valid OAuth credentials
    // For testing purposes, we'll just verify the click action and URL change

    // Mock the redirect for testing
    await page.route('**/api/auth/discord', (route) => {
      route.fulfill({
        status: 302,
        headers: {
          location: 'https://discord.com/oauth2/authorize',
        },
      });
    });

    await discordButton.click();

    // Verify that a request was made to the Discord auth endpoint
    await expect(page).toHaveURL(/discord\.com/);
  });

  test('should have accessible Discord button', async ({ page }) => {
    const discordButton = page.locator('button:has-text("Discord")');

    // Check for accessibility attributes
    await expect(discordButton).toHaveAttribute('type', 'button');

    // Check that it's keyboard navigable
    await discordButton.focus();
    await expect(discordButton).toBeFocused();
  });

  test('should have consistent Discord button styling across pages', async ({ page }) => {
    // Check on login page
    await page.goto('/login');
    const loginDiscordButton = page.locator('button:has-text("Discord")');
    const loginClasses = await loginDiscordButton.getAttribute('class');

    // Check on signup page
    await page.goto('/signup');
    const signupDiscordButton = page.locator('button:has-text("Discord")');
    const signupClasses = await signupDiscordButton.getAttribute('class');

    // Both should have similar base classes
    expect(loginClasses).toContain('px-4');
    expect(loginClasses).toContain('py-2.5');
    expect(signupClasses).toContain('px-4');
    expect(signupClasses).toContain('py-2.5');
  });
});
