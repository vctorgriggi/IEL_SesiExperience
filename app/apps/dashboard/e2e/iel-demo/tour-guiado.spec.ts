import { expect, test, type Page } from '@playwright/test';

import { entrarNaCentral } from './entrar';

/**
 * O tour guiado, e principalmente o roteiro da apresentação.
 *
 * O que quebra um tour não é o texto: é o alvo. Um `data-tour` renomeado na
 * tela deixa o passo apontando para o vazio, e isso só aparece na frente de
 * quem assiste. Este teste percorre o roteiro inteiro e, a cada passo,
 * confere **qual elemento o driver.js destacou** — é a única asserção que
 * pega a âncora perdida.
 */

/**
 * A ordem dos alvos do roteiro, como `tours.ts` a declara.
 *
 * `null` é passo sem alvo (o balão abre centralizado). A lista é escrita à
 * mão de propósito: se alguém reordenar o roteiro sem pensar, o teste
 * reclama, e é essa conversa que se quer ter antes da apresentação.
 */
const ALVOS_DO_ROTEIRO: (string | null)[] = [
  'inicio-fila',
  'inicio-funil',
  'cabecalho-notificacoes',
  'mesa-perfil-da-empresa',
  'mesa-indicadores',
  'mesa-tabela',
  'mesa-enviar',
  'enviados-tabela',
  'empresa-temas',
  'empresa-mapa',
  'pessoa-aderencia',
  'questionarios-abas',
  'questionarios-funil',
  'instrumento-numeros',
  'acompanhamento-fila',
  'acompanhamento-privacidade',
  'bi-reabertura',
  'integracoes-campos',
  'acoes-rapidas'
];

/**
 * O que o driver.js está destacando agora, pelo `data-tour` do elemento.
 *
 * Durante a troca de passo a classe pode ficar um instante em dois
 * elementos; o que vale é o último em ordem de documento só quando ele é o
 * recém-destacado, então a lista inteira volta e a asserção decide.
 */
async function alvosDestacados(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('.driver-active-element')].map(
      (elemento) => elemento.getAttribute('data-tour') ?? '(sem data-tour)'
    )
  );
}

async function abrirTour(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Tour' }).click();
  await expect(
    page.getByRole('dialog').filter({ hasText: 'Tour guiado' })
  ).toBeVisible();
}

test.describe('Tour guiado', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await entrarNaCentral(page);
    await page.evaluate(() => window.localStorage.removeItem('iel-demo-state'));
    await page.reload();
  });

  test('o roteiro da apresentação destaca o bloco certo em cada passo', async ({
    page
  }) => {
    // Vinte passos, e quase todos trocam de tela: o teto padrão de 45s é do
    // teste de uma tela só.
    test.setTimeout(240_000);
    await abrirTour(page);

    const roteiro = page.getByRole('button', { name: /A jornada inteira/ });
    await expect(roteiro).toContainText(`${ALVOS_DO_ROTEIRO.length} passos`);
    await roteiro.click();

    const balao = page.locator('.driver-popover');
    await expect(balao).toBeVisible();

    for (const [indice, alvo] of ALVOS_DO_ROTEIRO.entries()) {
      // A troca de tela pode demorar (em desenvolvimento, a rota nova ainda
      // compila), e o contador só vira quando o passo chega de fato.
      await expect(balao).toContainText(
        `${indice + 1} de ${ALVOS_DO_ROTEIRO.length}`,
        { timeout: 20_000 }
      );

      if (alvo) {
        // O passo troca de tela: o destaque só é o certo depois de a tela
        // nova chegar, então a espera é pelo próprio alvo.
        await expect
          .poll(() => alvosDestacados(page), { timeout: 15_000 })
          .toContain(alvo);
        await expect(page.locator(`[data-tour="${alvo}"]`)).toBeVisible();
      } else {
        expect(await alvosDestacados(page)).toEqual([]);
      }

      const ultimo = indice === ALVOS_DO_ROTEIRO.length - 1;
      if (ultimo) break;
      await page.locator('.driver-popover-next-btn').click();
    }

    await page.locator('.driver-popover-close-btn').click();
    await expect(balao).toBeHidden();
  });

  test('o tour da tela atual abre sem sair dela', async ({ page }) => {
    await page.goto('/instrumento');
    await abrirTour(page);

    const daTela = page.getByRole('button', { name: /Instrumento/ });
    await expect(daTela).toContainText('esta tela');
    await daTela.click();

    await expect(page.locator('.driver-popover')).toBeVisible();
    await page.locator('.driver-popover-next-btn').click();
    await expect
      .poll(() => alvosDestacados(page))
      .toContain('instrumento-numeros');
    expect(new URL(page.url()).pathname).toBe('/instrumento');
  });

  test('a fila do dia e o sino mostram a mesma pendência no topo', async ({
    page
  }) => {
    await page.getByRole('button', { name: /^Notificações/ }).click();
    const primeiraDoSino = await page
      .getByRole('menu')
      .locator('[role="menuitem"]')
      .first()
      .innerText();
    await page.keyboard.press('Escape');

    // As duas leituras saem da mesma `montarPendencias`, então o que o sino
    // põe no topo tem de estar na fila do Início — senão a analista vê um
    // aviso que a tela não confirma.
    const tituloDoSino = primeiraDoSino.split('\n')[0]?.trim() ?? '';
    expect(tituloDoSino.length).toBeGreaterThan(0);
    await expect(page.locator('[data-tour="inicio-fila"]')).toContainText(
      tituloDoSino
    );
  });
});
