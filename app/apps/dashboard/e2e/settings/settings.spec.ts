import { expect, test } from '@playwright/test';

test.describe('Settings — Rotas atuais', () => {
  test('acesso a /settings sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('acesso a /:slug/settings sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/organizacao-e2e/settings');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
