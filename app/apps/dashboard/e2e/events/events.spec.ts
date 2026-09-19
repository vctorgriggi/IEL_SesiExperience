import { expect, test } from '@playwright/test';
import {
  hasE2ECredentials,
  signInWithE2ECredentials
} from '../helpers/auth';

const SAMPLE_ORG_SLUG = 'organizacao-e2e';

/**
 * Eventos agora são rotas escopadas por organização (/:slug/events/*).
 * Fluxos autenticados são opcionais e só rodam com credenciais E2E explícitas.
 */

test.describe('Events — Rotas top-level', () => {
  test('/events sem login redireciona para sign-in', async ({ page }) => {
    await page.goto('/events');

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('/events/create permanece rota inexistente (404)', async ({ page }) => {
    await page.goto('/events/create');

    await expect(page).toHaveURL(/\/events\/create$/);
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  });
});

test.describe('Events — Proteção de rotas da organização', () => {
  test('acesso à listagem sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto(`/${SAMPLE_ORG_SLUG}/events`);

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('acesso à criação sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto(`/${SAMPLE_ORG_SLUG}/events/create`);

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('acesso a eventos públicos sem login redireciona para sign-in', async ({
    page
  }) => {
    await page.goto(`/${SAMPLE_ORG_SLUG}/events/public`);

    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});

test.describe('Events — Smoke autenticado (opcional)', () => {
  test('listagem exibe título e botão de novo evento', async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Defina E2E_AUTH_EMAIL e E2E_AUTH_PASSWORD para rodar testes autenticados.'
    );

    const { orgSlug, pathname } = await signInWithE2ECredentials(page);
    test.skip(
      !orgSlug,
      `Usuário autenticou, mas não caiu em /:slug/home (pathname atual: ${pathname}).`
    );

    await page.goto(`/${orgSlug}/events`);

    await expect(
      page.getByRole('heading', { name: /meus eventos/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /novo evento/i })
    ).toHaveAttribute('href', `/${orgSlug}/events/create`);
  });

  test('página de criação exibe formulário base', async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Defina E2E_AUTH_EMAIL e E2E_AUTH_PASSWORD para rodar testes autenticados.'
    );

    const { orgSlug, pathname } = await signInWithE2ECredentials(page);
    test.skip(
      !orgSlug,
      `Usuário autenticou, mas não caiu em /:slug/home (pathname atual: ${pathname}).`
    );

    await page.goto(`/${orgSlug}/events/create`);

    await expect(
      page.getByRole('heading', { name: /criar evento/i })
    ).toBeVisible();
    await expect(
      page
        .locator(
          'input[aria-label*="Título"], input[name="title"], input[type="text"]'
        )
        .first()
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /criar evento/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /voltar para eventos/i })
    ).toHaveAttribute('href', `/${orgSlug}/events`);
  });

  test('página de eventos públicos exibe título e contexto', async ({ page }) => {
    test.skip(
      !hasE2ECredentials(),
      'Defina E2E_AUTH_EMAIL e E2E_AUTH_PASSWORD para rodar testes autenticados.'
    );

    const { orgSlug, pathname } = await signInWithE2ECredentials(page);
    test.skip(
      !orgSlug,
      `Usuário autenticou, mas não caiu em /:slug/home (pathname atual: ${pathname}).`
    );

    await page.goto(`/${orgSlug}/events/public`);

    await expect(
      page.getByRole('heading', { name: /descubra e participe/i })
    ).toBeVisible();
    await expect(page.getByText(/explore eventos incríveis/i)).toBeVisible();
  });
});
