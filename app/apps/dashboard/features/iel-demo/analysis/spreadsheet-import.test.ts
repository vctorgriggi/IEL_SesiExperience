import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildInitialDemoState, loadExampleSpreadsheet } from '../fixtures';
import { buildImportPlan, parseSpreadsheet } from './spreadsheet-import';

const AT = '2026-09-19T12:00:00.000Z';
const VAGA = 'VAG-01';

describe('parser da planilha da Empregare', () => {
  it('lê a planilha de exemplo com BOM, separador ; e percentual com %', () => {
    const parsed = parseSpreadsheet(loadExampleSpreadsheet());

    expect(parsed.errors).toEqual([]);
    expect(parsed.summary.separator).toBe(';');
    expect(parsed.summary.dataLines).toBe(12);
    expect(parsed.summary.validRows).toBe(12);
    expect(parsed.summary.discardedRows).toBe(2);
    expect(parsed.rows[0]?.name).toBe('Ana Ribeiro');
    expect(parsed.rows[0]?.technicalMatch).toBe(82);
    expect(parsed.rows[1]?.technicalMatch).toBe(80);
    expect(parsed.rows[10]?.city).toBe('Senador Canedo, GO');
  });

  it('o arquivo .csv e a constante TS não divergem', () => {
    const arquivo = readFileSync(
      join(__dirname, '..', 'fixtures', 'planilha-exemplo.csv'),
      'utf-8'
    );
    expect(loadExampleSpreadsheet()).toBe(arquivo);
  });

  it('aceita separador vírgula com campo entre aspas', () => {
    const parsed = parseSpreadsheet(
      'nome,email,vaga,match_tecnico\n' +
        'Iara Souza,iara@example.com,"Assistente de Logística, turno A",70\n'
    );

    expect(parsed.summary.separator).toBe(',');
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.jobTitle).toBe('Assistente de Logística, turno A');
  });

  it('match em branco vira null, nunca zero', () => {
    const parsed = parseSpreadsheet(
      'nome;email;vaga;match_tecnico\nIara;iara@example.com;Vaga X;\n'
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0]?.technicalMatch).toBeNull();
  });

  it('reporta erro por linha e por coluna sem lançar nem perder as boas', () => {
    const parsed = parseSpreadsheet(
      'nome;email;vaga;match_tecnico\n' +
        'Sem Email;;Vaga X;70\n' +
        'Fora da Faixa;fora@example.com;Vaga X;180\n' +
        'Boa Linha;boa@example.com;Vaga X;55\n'
    );

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]?.name).toBe('Boa Linha');
    expect(parsed.errors).toEqual([
      expect.objectContaining({ line: 2, column: 'email' }),
      expect.objectContaining({ line: 3, column: 'match_tecnico' })
    ]);
    expect(parsed.summary.invalidRows).toBe(2);
  });

  it('coluna obrigatória ausente é erro de cabeçalho, não de linha', () => {
    const parsed = parseSpreadsheet('nome;telefone\nIara;62999\n');

    expect(parsed.rows).toEqual([]);
    expect(parsed.errors.map((erro) => erro.column)).toEqual([
      'email',
      'vaga',
      'match_tecnico'
    ]);
  });

  it('reconhece o descarte pelo filtro na coluna situacao', () => {
    const parsed = parseSpreadsheet(loadExampleSpreadsheet());
    const descartados = parsed.rows.filter((linha) => linha.discarded);

    expect(descartados.map((linha) => linha.name)).toEqual([
      'Larissa Prado',
      'Natália Cruz'
    ]);
    expect(
      descartados.every((linha) => (linha.technicalMatch ?? 100) < 50)
    ).toBe(true);
  });
});

describe('plano de importação', () => {
  it('decide entre as quatro situações possíveis', () => {
    const state = buildInitialDemoState();
    const plano = buildImportPlan(
      state,
      parseSpreadsheet(loadExampleSpreadsheet()),
      VAGA,
      AT
    );

    const porEmail = new Map(
      plano.entries.map((entry) => [entry.line, entry.decision])
    );

    expect(porEmail.get(2)).toBe('ignorada');
    expect(porEmail.get(3)).toBe('match-atualizado');
    expect(porEmail.get(4)).toBe('nova-candidatura');
    expect(porEmail.get(6)).toBe('novo-talento');

    expect(plano.counts).toEqual({
      'novo-talento': 8,
      'nova-candidatura': 2,
      'match-atualizado': 1,
      ignorada: 1
    });
    expect(plano.origin).toBe('empregare');
  });

  it('o talento novo carrega o match técnico mesmo quando foi descartado', () => {
    const state = buildInitialDemoState();
    const plano = buildImportPlan(
      state,
      parseSpreadsheet(loadExampleSpreadsheet()),
      VAGA,
      AT
    );

    const larissa = plano.entries.find((entry) => entry.line === 8);
    expect(larissa?.discarded).toBe(true);
    expect(larissa?.application?.technicalMatch).toBe(47);
  });

  it('linha de outra vaga vira erro em vez de candidatura errada', () => {
    const state = buildInitialDemoState();
    const parsed = parseSpreadsheet(
      'nome;email;vaga;match_tecnico\n' +
        'Iara Souza;iara.souza@example.com;Assistente de Estoque;70\n'
    );
    const plano = buildImportPlan(state, parsed, VAGA, AT);

    expect(plano.entries).toEqual([]);
    expect(plano.errors[0]).toEqual(
      expect.objectContaining({ line: 2, column: 'vaga' })
    );
  });

  it('e-mail repetido na mesma planilha entra uma vez só', () => {
    const state = buildInitialDemoState();
    const parsed = parseSpreadsheet(
      'nome;email;vaga;match_tecnico\n' +
        'Iara Souza;iara.souza@example.com;Assistente de Logística;70\n' +
        'Iara S.;IARA.SOUZA@example.com;Assistente de Logística;71\n'
    );
    const plano = buildImportPlan(state, parsed, VAGA, AT);

    expect(plano.entries).toHaveLength(1);
    expect(plano.errors[0]).toEqual(
      expect.objectContaining({ line: 3, column: 'email' })
    );
  });
});
