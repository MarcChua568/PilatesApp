import { test, expect } from '@playwright/test';

test('log in, see the schedule, open a class', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('admin@studio.test');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // lands on the schedule
  await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'This week' })).toBeVisible();

  // navigate weeks until a class card shows up (seed generates ~2 weeks out)
  const card = page.locator('button', { hasText: /\d{2}:\d{2}/ }).first();
  for (let i = 0; i < 4 && !(await card.isVisible().catch(() => false)); i++) {
    await page.getByRole('button', { name: /next|›/ }).nth(1).click();
  }
  await expect(card).toBeVisible();
  await card.click();

  // class detail shows the roster sections
  await expect(page.getByText(/Booked ·/)).toBeVisible();
});
