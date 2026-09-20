import { describe, expect, it } from 'vitest';

import {
  buildReferralDraft,
  compareSelection,
  getCriterionEvidenceBundle,
  missingInformation,
  suggestQuestion,
  summarizeSelection
} from '../analysis/assistant';
import { buildInitialDemoState } from '../fixtures';
import { demoReducer } from '../state/reducer';
import { getApplication, getJob } from '../state/selectors';

const JOB_1 = getJob('VAG-01')!;
const JOB_2 = getJob('VAG-02')!;

describe('análise assistida (respostas determinísticas)', () => {
  it('resume apenas as candidaturas selecionadas', () => {
    const state = buildInitialDemoState();
    const answer = summarizeSelection(state, JOB_1, ['CAND-01']);
    const text = answer.paragraphs.join(' ');

    expect(text).toContain('Ana');
    expect(text).not.toContain('Bruno');
    expect(text).toContain('6 de 8 critérios possuem dados suficientes');
    expect(answer.usedRecords).toContain('EVD-ANA-01');
    expect(answer.disclaimer).toBe(
      'Texto montado só a partir dos registros selecionados.'
    );
  });

  it('avisa quando nada está selecionado em vez de inventar conteúdo', () => {
    const state = buildInitialDemoState();
    expect(summarizeSelection(state, JOB_1, []).paragraphs[0]).toContain(
      'Nenhuma candidatura selecionada'
    );
    expect(compareSelection(state, JOB_1, ['CAND-01']).paragraphs[0]).toContain(
      'Selecione de dois a três candidatos'
    );
    expect(missingInformation(state, JOB_1, []).paragraphs[0]).toContain(
      'Selecione candidaturas'
    );
  });

  it('sinaliza requisitos obrigatórios sem eliminar a candidatura', () => {
    const state = buildInitialDemoState();
    const text = summarizeSelection(state, JOB_1, ['CAND-01']).paragraphs.join(
      ' '
    );

    expect(text).toContain('Requisitos obrigatórios que não estão plenamente');
    expect(text).toContain('Ana — Registro em planilha');
    expect(text).toContain('Sinalizar não é eliminar');
  });

  it('compara pelas três dimensões e destaca divergências', () => {
    const state = buildInitialDemoState();
    const answer = compareSelection(state, JOB_1, ['CAND-01', 'CAND-04']);
    const text = answer.paragraphs.join(' ');

    expect(text).toContain('Compatibilidade técnica');
    expect(text).toContain('Expectativas profissionais');
    expect(text).toContain('Contexto organizacional');
    expect(text).toContain('Divergências que precisam de decisão registrada');
    expect(text).toContain('Diego — Disponibilidade no turno');
    expect(text).toContain('não de um ranking de pessoas');
  });

  it('sugere perguntas específicas para as lacunas de cada pessoa', () => {
    const state = buildInitialDemoState();
    const text = missingInformation(state, JOB_1, ['CAND-01']).paragraphs.join(
      '\n'
    );

    expect(text).toContain('Ana Ribeiro — perguntas sugeridas');
    expect(text).toContain('Registro em planilha (perguntar à pessoa)');
    expect(text).toContain('Apoio inicial (perguntar ao gestor)');
  });

  it('usa a pergunta do catálogo e cai num texto genérico quando não há', () => {
    const cataloged = suggestQuestion(
      JOB_1,
      JOB_1.criteria.find((criterion) => criterion.id === 'CRI-106')!,
      'gestor'
    );
    const generic = suggestQuestion(
      JOB_1,
      JOB_1.criteria.find((criterion) => criterion.id === 'CRI-104')!,
      'candidato'
    );

    expect(cataloged).toBe(
      'Quem poderá orientar a pessoa nas primeiras atividades e em quais horários?'
    );
    expect(generic).toContain('Interesse nas atividades');
    expect(generic).toContain('Assistente de Logística');
  });

  it('monta o encaminhamento sem notas internas no snapshot', () => {
    const withNote = demoReducer(buildInitialDemoState(), {
      type: 'add-internal-note',
      talentId: 'ANA',
      jobId: 'VAG-02',
      note: 'Combinar retorno por telefone antes de encaminhar.',
      at: '2026-09-15T10:00:00.000Z'
    });

    const draft = buildReferralDraft(withNote, JOB_2, ['CAND-05']);
    const item = draft.items[0]!;
    const internalNote = withNote.evidences.find(
      (evidence) => evidence.visibility === 'interno'
    )!;

    expect(draft.items).toHaveLength(1);
    expect(draft.message).toContain('Assistente de Estoque');
    expect(item.summary).toContain('Ana Ribeiro');
    expect(item.justification).toContain(
      'Encaminhada para Assistente de Estoque'
    );
    expect(item.sharedEvidenceIds).toContain('EVD-ANA-01');
    expect(item.sharedEvidenceIds).not.toContain(internalNote.id);
    expect(item.attentionPoints.join(' ')).toContain(
      'Registro de entradas e saídas'
    );
    expect(item.suggestedQuestions.length).toBeGreaterThan(0);
  });

  it('reúne as evidências do critério com a nota da análise', () => {
    const state = buildInitialDemoState();
    const application = getApplication(state, 'CAND-04')!;
    const bundle = getCriterionEvidenceBundle(state, application, 'CRI-103');

    expect(bundle.analysis.state).toBe('divergencia');
    expect(bundle.evidences.map((evidence) => evidence.id)).toEqual([
      'EVD-DIE-03',
      'EVD-DIE-04'
    ]);
  });
});
