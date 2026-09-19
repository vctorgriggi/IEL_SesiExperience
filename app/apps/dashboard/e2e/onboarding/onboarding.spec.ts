import { expect, test } from '@playwright/test';

test.describe('Onboarding — Proteção', () => {
  test('acesso a /onboarding sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/onboarding');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('acesso a /onboarding/user sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/onboarding/user');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
