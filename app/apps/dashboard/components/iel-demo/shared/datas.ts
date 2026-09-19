/**
 * Datas do protótipo, escritas como quem lê no Brasil.
 *
 * As três funções vivem num módulo só, e não em cada tela, porque a mesma
 * data aparece no cabeçalho da vaga ("Empregare, 13/09"), no cartão de prazo
 * ("termina em 16/09") e no histórico com hora. É função pura, sem JSX: uma
 * tela que só precisa de uma data não carrega junto nenhum componente.
 *
 * Fuso fixo em UTC, e a data curta (`2026-09-19`) é lida ao meio-dia: a base
 * da demonstração guarda dia, não instante, e deixar o navegador interpretar
 * faria 13/09 virar 12/09 em quem estiver a oeste — o defeito clássico de
 * `new Date('2026-09-19')`.
 */

function paraData(valor: string): Date | null {
  const data = new Date(valor.length === 10 ? `${valor}T12:00:00.000Z` : valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

/** 13/09/2026 — a data completa, para registro. */
export function formatarData(valor: string): string {
  const data = paraData(valor);
  if (!data) return valor;
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

/** 13/09 — a data curta, para a linha de contexto do cabeçalho. */
export function formatarDataCurta(valor: string): string {
  const data = paraData(valor);
  if (!data) return valor;
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC'
  });
}

/** 13/09/2026 14:20 — quando a hora importa, como no histórico. */
export function formatarDataHora(valor: string): string {
  const data = paraData(valor);
  if (!data) return valor;
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
