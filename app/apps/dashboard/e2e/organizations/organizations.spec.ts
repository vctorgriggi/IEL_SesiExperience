import { expect, test } from '@playwright/test';

test.describe('Organizations — Rotas atuais', () => {
  test('acesso a /organizations sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/organizations');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('acesso a /:slug/home sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/organizacao-e2e/home');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
