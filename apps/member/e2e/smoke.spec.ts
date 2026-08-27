import { test, expect } from '@playwright/test';

test('register, sign the waiver, book a class', async ({ page }) => {
  const email = `smoke-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.getByLabel('Full name').fill('Smoke Tester');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();

  // waiver gate
  await expect(page.getByRole('heading', { name: /waiver/i })).toBeVisible();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /agree/i }).click();

  // schedule — walk day chips until one has a class card
  await expect(page.getByRole('heading', { name: 'Schedule' })).toBeVisible();
  const dayChips = page.locator('.overflow-x-auto > button');
  const count = await dayChips.count();

  let opened = false;
  for (let d = 0; d < count && !opened; d++) {
    await dayChips.nth(d).click();
    // a class card links to /schedule/<uuid>; it shows a HH:mm eyebrow
    const card = page
      .locator('button', { hasText: /\b\d{2}:\d{2}\b/ })
      .filter({ hasNot: page.locator('.overflow-x-auto') })
      .first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      opened = true;
    }
  }
  expect(opened).toBe(true);

  // class detail — pick a spot if the picker is present, then book / waitlist
  const spot = page
    .locator('button[aria-pressed="false"]:not([disabled])')
    .first();
  if (await spot.isVisible().catch(() => false)) {
    await spot.click();
  }
  await page
    .getByRole('button', { name: /Book this class|Join the waitlist/ })
    .click();

  await expect(
    page.getByRole('heading', {
      name: /You’re booked|You’re on the waitlist/,
    }),
  ).toBeVisible();
});
