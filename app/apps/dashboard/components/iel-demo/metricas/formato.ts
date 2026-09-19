import type { Kpi } from '@/features/iel-demo/analysis/analytics';

/** 1284 → "1.284"; 2.4 → "2,4". */
export function formatarNumero(valor: number): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/**
 * O valor de um `Kpi` pronto para o cartão, pela unidade: "54%", "48",
 * "2,4 dias", "4,5 min". Sem base (`valor: null`) volta "—".
 */
export function formatarValorKpi(kpi: Pick<Kpi, 'valor' | 'unidade'>): string {
  if (kpi.valor === null) return '—';
  const numero = formatarNumero(kpi.valor);
  switch (kpi.unidade) {
    case 'p.p.':
      return `${numero}%`;
    case 'abs':
      return numero;
    case 'dias':
      return `${numero} ${kpi.valor === 1 ? 'dia' : 'dias'}`;
    case 'min':
      return `${numero} min`;
  }
}
