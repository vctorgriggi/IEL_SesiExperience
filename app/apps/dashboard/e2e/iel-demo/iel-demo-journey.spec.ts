import { expect, test, type Page } from '@playwright/test';

import { entrarNaCentral } from './entrar';

/**
 * O menu de quem apresenta.
 *
 * A faixa de demonstração virou o rodapé da barra lateral: é de lá que se
 * troca o recorte de dados e se reinicia a base.
 */
async function abrirMenuDaPersona(page: Page): Promise<void> {
  await page.getByRole('button', { name: /· demonstração/ }).click();
}

async function verComo(page: Page, persona: string): Promise<void> {
  await abrirMenuDaPersona(page);
  await page.getByRole('menuitemradio', { name: persona }).click();
  // O menu fecha depois que o estado muda; esperar aqui evita navegar antes
  // de o recorte novo chegar ao localStorage.
  await expect(page.getByRole('menu')).toBeHidden();
}

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
    // Com senha configurada, a porta vem antes do produto.
    await entrarNaCentral(page);
    // Cada execução começa da base fictícia inicial.
    await page.evaluate(() => window.localStorage.removeItem('iel-demo-state'));
    await page.reload();
  });

  test('percorre a jornada completa da demonstração', async ({ page }) => {
    // Cena 1 — a visão geral aponta onde agir.
    await expect(
      page.getByRole('heading', {
        name: 'O que precisa de mim hoje?',
        exact: true
      })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Centro de Empregos/ })
    ).toBeVisible();
    // A tela é uma fila de trabalho: cada cartão é uma coisa a resolver, com
    // o verbo que a resolve.
    await page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Assistente de Logística' })
      .getByRole('link', { name: 'Abrir a vaga' })
      .first()
      .click();

    // Cena 2 — mesa de seleção com candidaturas de fontes diferentes.
    await expect(
      page.getByRole('heading', {
        name: 'Assistente de Logística',
        exact: true
      })
    ).toBeVisible();
    // As duas candidaturas aparecem no detalhamento por critério, que é a
    // aba aberta por padrão abaixo da decisão de envio.
    await expect(
      page.getByRole('row').filter({ hasText: 'Ana Ribeiro' }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('row').filter({ hasText: 'Bruno Costa' }).first()
    ).toBeVisible();

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
    await page.getByRole('button', { name: 'Comparar (2)' }).click();
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
    await expect(dialog).toBeHidden();

    // A experiência do destinatário responde com o texto preparado.
    await page.goto('/iel/pendencias');
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
    await expect(incorporateDialog).toBeHidden();

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
    const availabilityDialog = page.getByRole('dialog');
    await availabilityDialog
      .getByRole('button', { name: /Incorporar em 1 critério/ })
      .click();
    await expect(availabilityDialog).toBeHidden();

    // Cena 6 — preparar e registrar o encaminhamento da vaga 2.
    await page.goto('/iel/vagas/VAG-02');
    await page
      .getByRole('row')
      .filter({ hasText: 'Ana Ribeiro' })
      .getByRole('button', { name: 'Adicionar à lista' })
      .click();
    await page.getByRole('button', { name: 'Enviar 1 currículo' }).click();
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
    await verComo(page, 'Gestor — Horizonte Alimentos');
    await page.goto('/iel/encaminhamentos');
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
    await verComo(page, 'Analista IEL');
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
    await abrirMenuDaPersona(page);
    await page
      .getByRole('menuitem', { name: 'Reiniciar demonstração' })
      .click();
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
      page.getByRole('button', { name: 'Comparar (3)' })
    ).toBeVisible();

    // Abrir um perfil e voltar mantém a seleção.
    await page
      .getByRole('row')
      .filter({ hasText: 'Ana Ribeiro' })
      .getByRole('link', { name: 'Ver perfil consolidado' })
      .click();
    // A pessoa abre lida no contexto desta vaga; a asserção fica no caminho
    // de volta, que é o que esta cena guarda.
    await expect(
      page.getByRole('link', { name: 'Voltar para a vaga' })
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

  test('o mapa de cultura filtra, busca e destaca um nome', async ({
    page
  }) => {
    await page.goto('/iel/mapa-de-cultura');

    await expect(
      page.getByRole('heading', { name: 'Mapa de Cultura', exact: true })
    ).toBeVisible();
    const plano = page.getByRole('img', { name: /Mapa de cultura/ });
    await expect(plano).toBeVisible();

    await page.getByLabel('Filtrar o mapa').selectOption('empresas');
    await expect(page.getByRole('button', { name: /Ana Ribeiro/ })).toHaveCount(
      0
    );

    await page.getByLabel('Filtrar o mapa').selectOption('todos');
    await page.getByPlaceholder('Buscar nome').fill('Ana Ribeiro');

    const linha = page.getByRole('button', { name: /Ana Ribeiro/ }).first();
    await linha.click();

    // O nome selecionado é rotulado dentro do plano, não só na lista.
    await expect(plano.getByText('Ana Ribeiro')).toBeVisible();
  });

  test('o resultado talento x vaga mostra o encaixe cultural', async ({
    page
  }) => {
    await page.goto('/iel/talentos/ANA?vaga=VAG-01');

    await expect(
      page.getByRole('heading', { name: 'Ambiente de trabalho, lado a lado' })
    ).toBeVisible();
    await expect(page.getByText('Onde vale alinhar')).toBeVisible();
    await expect(
      page.getByText('O mapa apoia a decisão humana e não descarta ninguém.')
    ).toBeVisible();
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
  /**
   * O questionário do candidato é a única tela em que uma pessoa de fora do
   * IEL responde sobre si. Duas coisas precisam continuar verdadeiras nela: o
   * aceite abre o questionário (M7, LGPD art. 7º, I) e o nome da empresa não
   * aparece antes da entrevista (R5). A segunda é a que este teste guarda —
   * um `company.name` que escapasse por qualquer caminho quebra aqui.
   */
  test('questionário de fit do candidato: aceite, cinco passos e sem nome de empresa', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/iel/candidatura/CAND-05/fit');

    // A base já traz a resposta de Ana nesta candidatura: abre na confirmação.
    await expect(
      page.getByRole('heading', { name: 'Respostas registradas' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Responder novamente' }).click();

    // Passo 0: sem aceite o questionário não abre.
    await expect(
      page.getByRole('heading', { name: 'Antes de começar' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar' })).toBeDisabled();
    await page.locator('#fit-consent').check();
    await page.getByRole('button', { name: 'Começar' }).click();

    await expect(page.getByText('1 de 5')).toBeVisible();

    // Nenhum nome de empresa da base fictícia aparece no conteúdo da tela.
    const content = await page.getByRole('main').innerText();
    for (const companyName of [
      'Cerrado Distribuição',
      'Horizonte Alimentos',
      'Oficina Pantanal'
    ]) {
      expect(content).not.toContain(companyName);
    }
    // O que ele vê da vaga: atividade, localidade, segmento e turno.
    expect(content).toContain('Assistente de Estoque');
    expect(content).toContain('Indústria de alimentos');

    // Sem rolagem horizontal na largura de celular.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    for (let step = 1; step <= 5; step += 1) {
      await expect(page.getByText(`${step} de 5`)).toBeVisible();
      await page.getByRole('radio').first().click();
      await page
        .getByRole('button', {
          name: step === 5 ? 'Enviar respostas' : 'Próxima'
        })
        .click();
    }

    await expect(
      page.getByRole('heading', { name: 'Respostas registradas' })
    ).toBeVisible();
    await expect(
      page.getByText('Você não precisa fazer mais nada agora.')
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Ver o que está registrado sobre você' })
      .click();
    await expect(
      page.getByRole('heading', { name: 'O que está registrado sobre você' })
    ).toBeVisible();
  });

  /**
   * A entrada de hoje é uma planilha exportada da Empregare (M6).
   *
   * O teste usa o atalho "Usar planilha de exemplo" porque o que precisa
   * ficar guardado é o percurso — conferir antes de gravar e ver as pessoas
   * na vaga —, não o diálogo de arquivo do sistema operacional.
   */
  test('importa a planilha de exemplo e os candidatos aparecem na vaga', async ({
    page
  }) => {
    await page.goto('/iel/vagas/VAG-01/importar');
    await expect(
      page.getByRole('heading', { name: 'Entrou tudo certo?' })
    ).toBeVisible();

    await page
      .getByRole('button', { name: 'Usar planilha de exemplo' })
      .click();

    // Passo 2: o plano é mostrado antes de qualquer gravação.
    await expect(
      page.getByRole('heading', { name: 'O que vai entrar' })
    ).toBeVisible();
    await expect(page.getByText('8 pessoas novas')).toBeVisible();
    await expect(
      page.getByText('1 requisito da vaga atualizado')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Confirmar importação' }).click();

    // Passo 3: confirmação, com a contagem do que entrou.
    await expect(page.getByRole('heading', { name: 'Pronto' })).toBeVisible();
    await expect(
      page.getByText(
        '10 pessoas novas entraram na vaga Assistente de Logística'
      )
    ).toBeVisible();

    await page.getByRole('link', { name: 'Ver a vaga' }).click();
    // Quem entrou pela planilha chega à mesa da vaga. A asserção é de
    // presença, e não de visibilidade, porque a lista da mesa recolhe grupos
    // e o que este teste guarda é a chegada do registro.
    await expect(page.getByText('Marcos Vieira').first()).toBeAttached();
  });

  /**
   * M2: a consulta aos colaboradores fecha o circuito.
   *
   * A empresa cobra quem falta olhando um número — "responderam X de N" — e
   * esse número só avança quando alguém responde pelo próprio link, sem
   * login. O token abaixo é o de um convite em aberto da Cerrado
   * (`fixtures/culture-invites.ts`); se a semente do produto ou a derivação
   * do token mudarem, este teste avisa.
   */
  test('colaborador responde pelo link e o contador da empresa avança', async ({
    page
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/iel/empresas/EMP-01');
    await expect(
      page.getByRole('heading', { name: 'Cerrado Distribuição' })
    ).toBeVisible();
    // O número principal do herói: quantas respostas chegaram, de quantas
    // foram pedidas.
    await expect(page.getByText('7 de 10', { exact: true })).toBeVisible();

    // O link do colaborador: só o token opaco, sem login e sem dado pessoal.
    await page.goto('/iel/consulta/418c781c386bb301');
    await expect(
      page.getByRole('heading', { name: 'Como é trabalhar aqui?' })
    ).toBeVisible();

    // Sem rolagem horizontal na largura de celular.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // Passo 0: sem aceite o questionário não abre (LGPD, art. 7º, I).
    await expect(page.getByRole('button', { name: 'Começar' })).toBeDisabled();
    await page.locator('#culture-consent').check();
    await page.getByRole('button', { name: 'Começar' }).click();

    for (let step = 1; step <= 5; step += 1) {
      await expect(page.getByText(`${step} de 5`)).toBeVisible();
      await page.getByRole('radio').first().click();
      await page
        .getByRole('button', {
          name: step === 5 ? 'Enviar respostas' : 'Próxima'
        })
        .click();
    }

    await expect(
      page.getByRole('heading', { name: 'Resposta registrada' })
    ).toBeVisible();

    // A resposta entra agregada: a empresa vê o contador, não quem respondeu.
    await page.goto('/iel/empresas/EMP-01');
    await expect(page.getByText('8 de 10', { exact: true })).toBeVisible();
  });
});
