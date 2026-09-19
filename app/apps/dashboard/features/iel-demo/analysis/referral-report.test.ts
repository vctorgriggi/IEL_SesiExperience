import { describe, expect, it } from 'vitest';

import type { FitAxisId } from './fit-axes';
import {
  buildReportToken,
  countExperienceMonths,
  findMostDivergentAxis,
  formatExperienceSpan,
  initialsOf,
  readAxisMatch,
  REPORT_AXIS_CLOSE_FLOOR,
  REPORT_AXIS_MATCH_FLOOR,
  type ReportAxisMatch
} from './referral-report';

describe('token do relatório', () => {
  it('é o mesmo para a mesma vaga em cargas diferentes', () => {
    expect(buildReportToken('VAG-01')).toBe(buildReportToken('VAG-01'));
  });

  it('é diferente entre vagas e não carrega o id da vaga', () => {
    const token = buildReportToken('VAG-01');
    expect(token).not.toBe(buildReportToken('VAG-02'));
    expect(token).toMatch(/^[0-9a-f]{16}$/);
    expect(token).not.toContain('VAG');
  });
});

describe('faixa de cada ponto', () => {
  it('não transforma ausência de medida em divergência', () => {
    expect(readAxisMatch(null)).toBe('sem-resposta');
  });

  it('separa combina, parecido e difere pelos cortes declarados', () => {
    expect(readAxisMatch(100)).toBe('combina');
    expect(readAxisMatch(REPORT_AXIS_MATCH_FLOOR)).toBe('combina');
    expect(readAxisMatch(REPORT_AXIS_MATCH_FLOOR - 1)).toBe('parecido');
    expect(readAxisMatch(REPORT_AXIS_CLOSE_FLOOR)).toBe('parecido');
    expect(readAxisMatch(REPORT_AXIS_CLOSE_FLOOR - 1)).toBe('difere');
    expect(readAxisMatch(0)).toBe('difere');
  });
});

describe('tempo de experiência', () => {
  it('soma os períodos legíveis do currículo', () => {
    expect(
      countExperienceMonths(['mar/2024 — fev/2026', 'jan/2023 — fev/2024'])
    ).toBe(23 + 13);
  });

  it('ignora período ilegível em vez de estimar', () => {
    expect(countExperienceMonths(['desde sempre', 'atual'])).toBe(0);
    expect(formatExperienceSpan(['atual'])).toBeNull();
  });

  it('escreve em anos a partir de doze meses', () => {
    expect(formatExperienceSpan(['jan/2023 — jan/2026'])).toBe('3 anos');
    expect(formatExperienceSpan(['jan/2025 — set/2025'])).toBe('8 meses');
    expect(formatExperienceSpan(['jan/2025 — jan/2026'])).toBe('1 ano');
  });
});

describe('iniciais do avatar', () => {
  it('usa o primeiro e o último nome', () => {
    expect(initialsOf('Helena Castro')).toBe('HC');
    expect(initialsOf('Ana Maria Ribeiro')).toBe('AR');
    expect(initialsOf('Alex')).toBe('A');
  });
});

describe('ponto onde mais divergem', () => {
  const pessoa = (
    ...matches: [FitAxisId, ReportAxisMatch][]
  ): { byAxis: { axisId: FitAxisId; match: ReportAxisMatch }[] } => ({
    byAxis: matches.map(([axisId, match]) => ({ axisId, match }))
  });

  it('aponta o ponto com mais gente fora de "combina"', () => {
    expect(
      findMostDivergentAxis([
        pessoa(
          ['lideranca-autonomia', 'difere'],
          ['regras-decisao', 'combina']
        ),
        pessoa(
          ['lideranca-autonomia', 'parecido'],
          ['regras-decisao', 'combina']
        )
      ])
    ).toBe('lideranca-autonomia');
  });

  it('não conta silêncio como divergência', () => {
    expect(
      findMostDivergentAxis([
        pessoa(
          ['lideranca-autonomia', 'sem-resposta'],
          ['regras-decisao', 'combina']
        )
      ])
    ).toBeNull();
  });
});
