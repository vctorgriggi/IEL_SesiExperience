import { describe, expect, it } from 'vitest';

import {
  buildImportPlan,
  parseSpreadsheet
} from '../analysis/spreadsheet-import';
import { buildInitialDemoState, loadExampleSpreadsheet } from '../fixtures';
import { demoReducer } from './reducer';
import {
  getApplicationsByJob,
  getImportHistory,
  getJobRanking,
  getTalent
} from './selectors';

const AT = '2026-09-19T12:00:00.000Z';
const VAGA = 'VAG-01';

function importar() {
  const inicial = buildInitialDemoState();
  const plan = buildImportPlan(
    inicial,
    parseSpreadsheet(loadExampleSpreadsheet()),
    VAGA,
    AT
  );
  return {
    inicial,
    plan,
    depois: demoReducer(inicial, {
      type: 'import-spreadsheet',
      jobId: VAGA,
      plan,
      at: AT
    })
  };
}

describe('importação da planilha no reducer (M6)', () => {
  it('cria talentos e candidaturas e atualiza o match existente', () => {
    const { inicial, depois } = importar();

    expect(depois.importedTalents).toHaveLength(8);
    expect(getApplicationsByJob(depois, VAGA)).toHaveLength(
      getApplicationsByJob(inicial, VAGA).length + 10
    );
    expect(
      depois.applications.find((entry) => entry.id === 'CAND-02')
        ?.technicalMatch
    ).toBe(80);
    expect(
      depois.applications.find((entry) => entry.id === 'CAND-01')
        ?.technicalMatch
    ).toBe(82);
  });

  it('o talento importado é encontrado pelo ranking da vaga', () => {
    const { depois } = importar();
    const importado = depois.importedTalents?.[0];

    expect(importado).toBeDefined();
    expect(getTalent(importado!.id, depois)?.name).toBe(importado!.name);
    expect(
      getJobRanking(depois, VAGA).some(
        (entry) => entry.talent?.id === importado!.id
      )
    ).toBe(true);
  });

  it('reimportar a mesma planilha não duplica registros', () => {
    const { plan, depois } = importar();

    const denovo = demoReducer(depois, {
      type: 'import-spreadsheet',
      jobId: VAGA,
      plan,
      at: '2026-09-20T09:00:00.000Z'
    });

    expect(denovo.applications).toHaveLength(depois.applications.length);
    expect(denovo.importedTalents).toHaveLength(8);
    expect(denovo.spreadsheetImports).toHaveLength(1);
    expect(denovo.history[0]?.action).toBe('Planilha recebida (sem mudanças)');
  });

  it('recalcular o plano sobre a base já importada não acha nada novo', () => {
    const { depois } = importar();
    const segundoPlano = buildImportPlan(
      depois,
      parseSpreadsheet(loadExampleSpreadsheet()),
      VAGA,
      AT
    );

    expect(segundoPlano.counts).toEqual({
      'novo-talento': 0,
      'nova-candidatura': 0,
      'match-atualizado': 0,
      ignorada: 12
    });
  });

  it('o histórico de importações fica disponível por vaga', () => {
    const { depois } = importar();
    const historico = getImportHistory(depois, VAGA);

    expect(historico).toHaveLength(1);
    expect(historico[0]?.origin).toBe('empregare');
    expect(historico[0]?.sourceId).toBe('FONTE-EMPREGARE');
    expect(historico[0]?.counts).toEqual({
      newTalents: 8,
      newApplications: 10,
      updatedMatches: 1,
      ignored: 1,
      errors: 0
    });
    expect(getImportHistory(depois, 'VAG-02')).toEqual([]);
  });
});
