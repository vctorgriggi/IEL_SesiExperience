import { expect, type Page } from '@playwright/test';

/**
 * A porta da Central, quando há senha configurada.
 *
 * Sem `IEL_SENHA_ANALISTA` a porta fica aberta e esta função não faz nada —
 * é como o protótipo roda por padrão e como a CI o executa. Com senha (o
 * `.env` de quem desenvolve tem uma), toda tela do analista passa por aqui
 * antes, senão o teste encontra o formulário no lugar do produto.
 */
export async function entrarNaCentral(page: Page): Promise<void> {
  if (new URL(page.url()).pathname !== '/entrar') return;
  await page
    .getByLabel('Senha da equipe')
    .fill(process.env.IEL_SENHA_ANALISTA ?? 'iel2026');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByLabel('Senha da equipe')).toBeHidden();
}
