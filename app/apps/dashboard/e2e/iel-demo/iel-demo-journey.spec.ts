import { expect, test } from '@playwright/test';

/**
 * Percurso principal da Central de Seleção IEL (protótipo).
 *
 * Cobre: visão geral → mesa de seleção → evidência → comparação →
 * esclarecimento com o gestor → incorporação na análise → reaproveitamento do
 * perfil na segunda vaga → encaminhamento → retorno da empresa → reset.
 */
test.describe('Central de Seleção IEL — demonstração', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iel');
    // Cada execução começa da base fictícia inicial.
    await page.evaluate(() => window.localStorage.removeItem('iel-demo-state'));
    await page.reload();
  });

  test('percorre a jornada completa da demonstração', async ({ page }) => {
    // Cena 1 — a visão geral aponta onde agir.
    await expect(
      page.getByRole('heading', { name: 'Visão geral', exact: true })
    ).toBeVisible();
    await expect(
      page.getByText('Dados fictícios — demonstração').first()
    ).toBeVisible();
    // A base tem volume: o texto anuncia centenas de candidaturas, não as 10
    // do roteiro. O que precisa continuar visível é o rótulo da base demo.
    await expect(page.getByText('Base demo:', { exact: false })).toBeVisible();

    await page
      .getByRole('listitem')
      .filter({ hasText: 'Assistente de Logística' })
      .getByRole('button', { name: 'Abrir seleção' })
      .first()
      .click();

    // Cena 2 — mesa de seleção com candidaturas de fontes diferentes.
    await expect(
      page.getByRole('heading', {
        name: /Mesa de seleção — Assistente de Logística/
      })
    ).toBeVisible();
    await expect(page.getByText('Ana Ribeiro').first()).toBeVisible();
    await expect(page.getByText('Bruno Costa').first()).toBeVisible();

    // A conclusão abre a evidência de origem.
    await page
      .getByRole('button', { name: /Conferência de pedidos/ })
      .first()
      .click();
    const evidencePanel = page.getByRole('complementary', {
      name: /Evidências de Conferência de pedidos/
    });
    await expect(evidencePanel).toBeVisible();
    await expect(
      evidencePanel.getByText(
        'Conferia pedidos recebidos e identificava divergências',
        {
          exact: false
        }
      )
    ).toBeVisible();
    await expect(
      evidencePanel.getByText('Relato do candidato, sem verificação prática')
    ).toBeVisible();
    await evidencePanel.getByRole('button', { name: 'Fechar' }).click();

    // Cena 3 — comparação de Ana e Bruno.
    await page.locator('#compare-CAND-01').check();
    await page.locator('#compare-CAND-02').check();
    await page
      .getByRole('button', { name: 'Comparar selecionados (2)' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Comparação entre candidatos' })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /Ana Ribeiro/ })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: /Bruno Costa/ })
    ).toBeVisible();
    await expect(page.getByText('Comparação dos selecionados')).toBeVisible();

    // Cena 4 — pergunta ao gestor sobre o apoio inicial.
    await page
      .getByRole('button', { name: 'Voltar para a mesa de seleção' })
      .click();
    await page.getByRole('tab', { name: 'Contexto da vaga' }).click();
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Apoio inicial' })
      .getByRole('button', { name: 'Solicitar esclarecimento ao gestor' })
      .click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#clarification-question')).toHaveValue(
      /Quem poderá orientar a pessoa nas primeiras atividades/
    );
    await dialog.getByRole('button', { name: 'Enviar solicitação' }).click();

    // A experiência do destinatário responde com o texto preparado.
    await page.getByRole('link', { name: 'Pendências' }).click();
    const request = page
      .getByRole('listitem')
      .filter({ hasText: 'Quem poderá orientar a pessoa' })
      .first();
    await request
      .getByRole('link', { name: 'Abrir experiência do destinatário' })
      .click();
    await expect(
      page.getByRole('heading', { name: /Uma pergunta sobre a equipe da vaga/ })
    ).toBeVisible();
    await expect(page.locator('#recipient-answer')).toHaveValue(
      /não haverá acompanhamento inicial/
    );
    await page.getByRole('button', { name: 'Confirmar resposta' }).click();
    await expect(
      page.getByRole('heading', { name: 'Resposta registrada' })
    ).toBeVisible();

    // O analista incorpora a resposta e decide o estado de cada critério.
    await page
      .getByRole('button', { name: 'Voltar ao roteiro da demonstração' })
      .click();
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Quem poderá orientar a pessoa' })
      .first()
      .getByRole('button', { name: 'Incorporar à análise' })
      .click();
    const incorporateDialog = page.getByRole('dialog');
    await expect(
      incorporateDialog.getByText('Ana Ribeiro — Apoio inicial')
    ).toBeVisible();
    await incorporateDialog
      .getByRole('button', { name: /Incorporar em 4 critério/ })
      .click();

    // A análise de Ana muda para divergência, sem rejeição automática.
    await page.goto('/iel/vagas/VAG-01');
    const anaRow = page.getByRole('row').filter({ hasText: 'Ana Ribeiro' });
    await expect(
      anaRow.getByRole('button', { name: /Apoio inicial/ })
    ).toBeVisible();
    await anaRow.getByRole('button', { name: /Apoio inicial/ }).click();
    const supportPanel = page.getByRole('complementary', {
      name: /Evidências de Apoio inicial/
    });
    await expect(
      supportPanel.getByText('Divergência identificada')
    ).toBeVisible();
    await expect(
      supportPanel.getByText('a candidatura segue em análise', { exact: false })
    ).toBeVisible();

    // Cena 5 — mesmo perfil, outra vaga: esclarecer disponibilidade.
    await page.goto('/iel/pendencias');
    const availabilityRequest = page
      .getByRole('listitem')
      .filter({ hasText: 'Você segue disponível para o horário das 8h às 17h' })
      .first();
    await availabilityRequest
      .getByRole('link', { name: 'Abrir experiência do destinatário' })
      .click();
    await page.getByRole('button', { name: 'Confirmar resposta' }).click();
    await page
      .getByRole('button', { name: 'Voltar ao roteiro da demonstração' })
      .click();
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Você segue disponível para o horário das 8h às 17h' })
      .first()
      .getByRole('button', { name: 'Incorporar à análise' })
      .click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Incorporar em 1 critério/ })
      .click();

    // Cena 6 — preparar e registrar o encaminhamento da vaga 2.
    await page.goto('/iel/vagas/VAG-02');
    await page
      .getByRole('row')
      .filter({ hasText: 'Ana Ribeiro' })
      .getByRole('button', { name: 'Adicionar à lista' })
      .click();
    await page
      .getByRole('button', { name: /Preparar encaminhamento \(1\)/ })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Preparação do encaminhamento' })
    ).toBeVisible();

    // O analista vê exatamente o que a empresa receberá.
    await page
      .getByRole('button', { name: 'Pré-visualizar o que a empresa recebe' })
      .click();
    const previewDialog = page.getByRole('dialog');
    await expect(
      previewDialog.getByRole('heading', {
        name: 'O que a empresa vai receber'
      })
    ).toBeVisible();
    await expect(previewDialog.getByText('Ana Ribeiro').first()).toBeVisible();
    await expect(
      previewDialog.getByText('Fora deste conteúdo', { exact: false })
    ).toBeVisible();
    await previewDialog
      .getByRole('button', { name: 'Voltar para a revisão' })
      .click();

    await page
      .getByRole('button', { name: 'Registrar encaminhamento' })
      .click();
    await expect(
      page.getByText('Atualização externa não enviada', { exact: false })
    ).toBeVisible();

    // Cena 7 — a empresa vê apenas o conteúdo compartilhado e registra interesse.
    await page.selectOption('#demo-persona', 'gestor-emp-02');
    await page.getByRole('link', { name: /Perfis encaminhados/ }).click();
    await page.getByRole('button', { name: 'Abrir lista encaminhada' }).click();
    await expect(page.getByText('Ana Ribeiro').first()).toBeVisible();
    await expect(
      page.getByText('Avaliações internas, notas do analista', { exact: false })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Quero entrevistar' }).click();
    await expect(
      page.getByText('Empresa quer entrevistar').first()
    ).toBeVisible();

    // O IEL vê o retorno no histórico da vaga.
    await page.selectOption('#demo-persona', 'analista-iel');
    await page.goto('/iel/vagas/VAG-02');
    await page.getByRole('tab', { name: 'Histórico' }).click();
    await expect(
      page.getByText('Interesse em entrevista registrado').first()
    ).toBeVisible();

    // O progresso local sobrevive ao recarregamento.
    await page.reload();
    await page.getByRole('tab', { name: 'Histórico' }).click();
    await expect(
      page.getByText('Interesse em entrevista registrado').first()
    ).toBeVisible();

    // Reiniciar restaura a base inicial.
    await page.getByRole('button', { name: 'Reiniciar demonstração' }).click();
    await page.getByRole('button', { name: 'Reiniciar agora' }).click();
    await page.goto('/iel/pendencias');
    // As duas solicitações iniciais voltam; a criada na demonstração desaparece.
    await expect(page.getByText('ESC-01', { exact: false })).toBeVisible();
    await expect(page.getByText('ESC-03', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Incorporada à análise')).toHaveCount(0);
    await page.goto('/iel/encaminhamentos');
    await expect(
      page.getByRole('heading', { name: 'Nenhum encaminhamento registrado' })
    ).toBeVisible();
  });

  test('limita a comparação a três candidatos e preserva a seleção', async ({
    page
  }) => {
    await page.goto('/iel/vagas/VAG-01');
    await page.locator('#compare-CAND-01').check();
    await page.locator('#compare-CAND-02').check();
    await page.locator('#compare-CAND-03').check();
    await expect(page.locator('#compare-CAND-04')).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Comparar selecionados (3)' })
    ).toBeVisible();

    // Abrir um perfil e voltar mantém a seleção.
    await page
      .getByRole('row')
      .filter({ hasText: 'Ana Ribeiro' })
      .getByRole('link', { name: 'Ver perfil consolidado' })
      .click();
    await expect(
      page.getByText(
        'Análise para Assistente de Logística — Cerrado Distribuição'
      )
    ).toBeVisible();
    await page.getByRole('link', { name: 'Voltar para a vaga' }).click();
    await expect(page.locator('#compare-CAND-01')).toBeChecked();
    await expect(page.locator('#compare-CAND-02')).toBeChecked();
  });

  test('filtros de vagas afetam linhas e contadores', async ({ page }) => {
    await page.goto('/iel/vagas');
    const allRows = await page.getByRole('row').count();
    expect(allRows).toBeGreaterThan(4);

    // Busca de verdade: filtra sobre a base inteira, não sobre 3 registros.
    await page
      .getByLabel('Buscar por vaga ou empresa')
      .fill('Assistente de Estoque');
    await expect(page.getByRole('row')).toHaveCount(2);
    await expect(
      page.getByRole('row').filter({ hasText: 'Horizonte Alimentos' })
    ).toHaveCount(1);

    await page.getByLabel('Buscar por vaga ou empresa').fill('zzz');
    await expect(
      page.getByRole('heading', {
        name: 'Nenhuma vaga encontrada com esses filtros'
      })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(page.getByRole('row')).toHaveCount(allRows);
  });

  test('recebimento repetido não duplica registros', async ({ page }) => {
    await page.goto('/iel/fontes-de-dados');
    await page
      .getByRole('button', { name: 'Simular recebimento de atualização' })
      .click();
    await expect(page.getByText('Já aplicado')).toBeVisible();
    await page
      .getByRole('button', { name: 'Simular recebimento de atualização' })
      .click();
    await expect(
      page.getByText('já havia sido aplicado', { exact: false })
    ).toBeVisible();
    await expect(page.getByText('Base local:', { exact: false })).toBeVisible();
  });

  test('esclarecimento funciona em largura de celular e com teclado', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/iel/pendencias/ESC-01/responder');

    await expect(
      page.getByRole('heading', { name: /Uma pergunta sobre sua candidatura/ })
    ).toBeVisible();
    await expect(page.locator('#recipient-answer')).toBeVisible();

    // Sem rolagem horizontal na largura de celular.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Navegação por teclado até o botão de confirmação.
    await page.locator('#recipient-answer').focus();
    let focusedConfirm = false;
    for (let index = 0; index < 6 && !focusedConfirm; index += 1) {
      await page.keyboard.press('Tab');
      focusedConfirm = await page.evaluate(() =>
        (document.activeElement?.textContent ?? '').includes(
          'Confirmar resposta'
        )
      );
    }
    expect(focusedConfirm).toBe(true);

    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Resposta registrada' })
    ).toBeVisible();
  });
});
