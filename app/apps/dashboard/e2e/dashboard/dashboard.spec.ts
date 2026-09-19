import { expect, test } from '@playwright/test';

test.describe('Dashboard — Acesso', () => {
  test('acesso à home (/) sem login redireciona para sign-in', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
