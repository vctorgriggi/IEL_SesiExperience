import { expect, test } from '@playwright/test';
import {
  hasE2ECredentials,
  signInWithE2ECredentials
} from '../helpers/auth';

test.describe('Auth — Sign-in', () => {
  test('exibe formulário de login com email, senha e botão Entrar', async ({
    page
  }) => {
    await page.goto('/auth/sign-in');

    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('exibe link para "Esqueceu a senha?" e para cadastro', async ({ page }) => {
    await page.goto('/auth/sign-in');

    await expect(
      page.getByRole('link', { name: /esqueceu a senha/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /cadastr|criar conta|sign up/i })
    ).toBeVisible();
  });

  test('exibe botão para continuar com Google', async ({ page }) => {
    await page.goto('/auth/sign-in');

    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('credenciais inválidas mantêm usuário no fluxo de autenticação', async ({
    page
  }) => {
    await page.goto('/auth/sign-in');

    await page
      .locator('input[type="email"]')
      .first()
      .fill('invalid-user@example.com');
    await page.locator('input[type="password"]').first().fill('invalid-password');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\/auth\/(sign-in|error)/);
  });
});

test.describe('Auth — Sign-up', () => {
  test('exibe formulário com nome, email, senha, confirmar senha e submit', async ({
    page
  }) => {
    await page.goto('/auth/sign-up');

    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(2);
    await expect(
      page.getByRole('button', { name: /criar conta|cadastr|registr/i })
    ).toBeVisible();
  });

  test('exibe link para página de login', async ({ page }) => {
    await page.goto('/auth/sign-up');

    await expect(
      page.getByRole('link', { name: /já tem uma conta|entrar|sign in/i })
    ).toBeVisible();
  });
});

test.describe('Auth — Forgot password', () => {
  test('exibe formulário de recuperação de senha com campo email', async ({
    page
  }) => {
    await page.goto('/auth/forgot-password');

    await expect(
      page.getByRole('heading', { name: /esqueceu sua senha/i })
    ).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /enviar instruções/i })
    ).toBeVisible();
  });

  test('exibe link para voltar ao login (Entrar)', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.getByRole('link', { name: /entrar/i })).toBeVisible();
  });
});

test.describe('Auth — Sessão (credenciais opcionais)', () => {
  test('sign-in com credenciais de E2E redireciona para home da org ou onboarding', async ({
    page
  }) => {
    test.skip(
      !hasE2ECredentials(),
      'Defina E2E_AUTH_EMAIL e E2E_AUTH_PASSWORD para rodar testes autenticados.'
    );

    const { pathname } = await signInWithE2ECredentials(page);

    expect(pathname).toMatch(
      /^\/(?:onboarding(?:\/(?:user|organization))?|[^/]+\/home)$/
    );
  });

  test('páginas de auth redirecionam usuário autenticado para fora de /auth', async ({
    page
  }) => {
    test.skip(
      !hasE2ECredentials(),
      'Defina E2E_AUTH_EMAIL e E2E_AUTH_PASSWORD para rodar testes autenticados.'
    );

    await signInWithE2ECredentials(page);
    await page.goto('/auth/sign-in');

    await expect(page).not.toHaveURL(/\/auth\/sign-in$/);
  });
});

test.describe('Auth — Proteção de rotas (sem sessão)', () => {
  test('acesso à raiz (/) sem sessão redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });

  test('acesso a rota de organização sem sessão redireciona para sign-in', async ({
    page
  }) => {
    await page.goto('/organizacao-e2e/home');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
