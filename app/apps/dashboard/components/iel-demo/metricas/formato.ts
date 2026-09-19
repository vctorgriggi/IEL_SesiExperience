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

/**
 * O valor de um `Kpi` por extenso, para o leitor de tela: "4,5 minutos" no
 * lugar de "4,5 min", "sem base" no lugar de "—".
 */
export function lerValorKpi(kpi: Pick<Kpi, 'valor' | 'unidade'>): string {
  if (kpi.valor === null) return 'sem base para a conta';
  if (kpi.unidade === 'min') {
    return `${formatarNumero(kpi.valor)} ${kpi.valor === 1 ? 'minuto' : 'minutos'}`;
  }
  return formatarValorKpi(kpi);
}

/**
 * A variação de um `Kpi` por extenso, para o leitor de tela.
 *
 * "↗ +10 p.p." é lido como "mais dez p p", quando é lido. A frase inteira
 * não depende do ícone nem da abreviação: "Subiu 10 pontos percentuais no
 * período", "Caiu 1,5 dia no período", "Estável no período".
 */
export function lerVariacao(
  kpi: Pick<Kpi, 'variacao' | 'unidade'>
): string | null {
  if (kpi.variacao === null) return null;
  if (kpi.variacao === 0) return 'Estável no período';
  const verbo = kpi.variacao > 0 ? 'Subiu' : 'Caiu';
  const modulo = Math.abs(kpi.variacao);
  const numero = formatarNumero(modulo);
  const um = modulo === 1;
  const unidade =
    kpi.unidade === 'p.p.'
      ? um
        ? ' ponto percentual'
        : ' pontos percentuais'
      : kpi.unidade === 'dias'
        ? um
          ? ' dia'
          : ' dias'
        : kpi.unidade === 'min'
          ? um
            ? ' minuto'
            : ' minutos'
          : '';
  return `${verbo} ${numero}${unidade} no período`;
}
