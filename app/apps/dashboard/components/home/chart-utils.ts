import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ChartDataPoint = { month: string; value: number };

export function formatChartDate(raw: string): string {
  try {
    return format(new Date(raw), 'dd MMM', { locale: ptBR });
  } catch {
    return raw;
  }
}

export function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(v);
}

export function formatCurrencyAxis(v: number): string {
  if (v >= 1000) return `R$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return `R$${v}`;
}
