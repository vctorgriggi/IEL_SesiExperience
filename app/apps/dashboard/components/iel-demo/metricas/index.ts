/**
 * Peças de métrica compartilhadas pelas telas do painel (Início, Empresas,
 * Candidatos, Integrações e BI). Todas leem os tipos de
 * `features/iel-demo/analysis/analytics.ts`.
 */
export { formatarNumero, formatarValorKpi } from './formato';
export { Funil } from './funil';
export { KpiCard, type KpiCardProps } from './kpi-card';
export { MarcadorHistorico, TEXTO_HISTORICO } from './marcador-historico';
export { PERIODO_PADRAO, SeletorPeriodo } from './seletor-periodo';
export { TEXTO_OCULTO, ValorOculto } from './valor-oculto';
