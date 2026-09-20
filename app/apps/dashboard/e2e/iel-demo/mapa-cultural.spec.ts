import { expect, test, type Page } from '@playwright/test';

import { entrarNaCentral } from './entrar';

/**
 * O mapa de cultura pelo leque de ações rápidas.
 *
 * O painel virou lugar de decidir, não só de ler: ele mostra quem se
 * candidatou às vagas da empresa e deixa marcar vários currículos de uma vez
 * para a lista de envio. O teste cobre o caminho inteiro, porque o valor
 * está justamente em não precisar abrir a mesa de seleção para isso.
 */

async function abrirLeque(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^Ações rápidas/ }).click();
}

test.describe('Mapa de cultura, pelo leque', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await entrarNaCentral(page);
    await page.evaluate(() => window.localStorage.removeItem('iel-demo-state'));
    await page.reload();
  });

  test('marca vários currículos para envio sem sair do painel', async ({
    page
  }) => {
    await abrirLeque(page);
    await page.getByRole('button', { name: 'Mapa de cultura' }).click();

    const painel = page
      .getByRole('dialog')
      .filter({ hasText: 'Mapa de cultura' });
    await expect(painel).toBeVisible();

    const caixas = painel.getByRole('checkbox');
    await expect(caixas.first()).toBeVisible();
    // A lista rola dentro da aba, abaixo do mapa: a segunda caixa nasce
    // fora da dobra, e quem rola é o painel da rolagem, não a página.
    await caixas.nth(0).check();
    await painel
      .locator('[data-radix-scroll-area-viewport]')
      .evaluate((area) => area.scrollTo({ top: area.scrollHeight }));
    await caixas.nth(1).check();

    const marcar = painel.getByRole('button', {
      name: /Marcar 2 currículos para envio/
    });
    await expect(marcar).toBeVisible();
    await marcar.click();

    await expect(page.getByText(/entraram na lista de envio/)).toBeVisible();
    // A seleção se desfaz depois de marcada: o que ficou é a lista da vaga.
    await expect(marcar).toBeHidden();
  });

  test('a análise de cultura leva a pessoa para a lista da vaga', async ({
    page
  }) => {
    await abrirLeque(page);
    await page.getByRole('button', { name: 'Análise de cultura' }).click();

    const painel = page
      .getByRole('dialog')
      .filter({ hasText: 'Análise de cultura' });
    await expect(painel).toBeVisible();

    // O par que abre é o primeiro de cada lista; o rodapé diz o que dá para
    // fazer com ele — marcar para uma vaga, ou que não há vaga para marcar.
    const rodape = painel.getByText(
      /Marcar para envio|não tem candidatura em vaga aberta|preparar o envio/
    );
    await expect(rodape.first()).toBeVisible();
  });
});
