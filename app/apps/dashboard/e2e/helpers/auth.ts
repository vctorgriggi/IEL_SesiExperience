import { expect, type Page } from '@playwright/test';

const E2E_AUTH_EMAIL = process.env.E2E_AUTH_EMAIL?.trim();
const E2E_AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD?.trim();

export function hasE2ECredentials(): boolean {
  return Boolean(E2E_AUTH_EMAIL && E2E_AUTH_PASSWORD);
}

export async function signInWithE2ECredentials(page: Page): Promise<{
  pathname: string;
  orgSlug: string | null;
}> {
  if (!hasE2ECredentials()) {
    throw new Error(
      'Credenciais E2E ausentes. Defina E2E_AUTH_EMAIL e E2E_AUTH_PASSWORD.'
    );
  }

  await page.goto('/auth/sign-in');

  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill(E2E_AUTH_EMAIL!);
  await passwordInput.fill(E2E_AUTH_PASSWORD!);
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page).not.toHaveURL(/\/auth\/sign-in/);

  const pathname = new URL(page.url()).pathname;
  const orgHomeMatch = pathname.match(/^\/([^/]+)\/home$/);

  return {
    pathname,
    orgSlug: orgHomeMatch?.[1] ? decodeURIComponent(orgHomeMatch[1]) : null
  };
}
