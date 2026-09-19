/**
 * Cor nos dados: as classes que toda tela do /iel usa para dizer a mesma
 * coisa com a mesma cor. Os tokens moram em `app/(iel)/iel/iel-theme.css`.
 *
 *   azul          → lado da empresa
 *   verde-azulado → lado da pessoa e séries de dado
 *   verde / laranja / vermelho / cinza → combina / atenção / difere / sem dado
 *
 * Use estas constantes em vez de escrever `hsl(var(--…))` na tela: se a
 * paleta mudar, muda aqui e no tema, não em trinta arquivos.
 */

export type EstadoDeCor = 'combina' | 'atencao' | 'difere' | 'neutro';

/** Badge de estado: fundo tingido, texto e borda no mesmo tom. */
export const BADGE_DE_ESTADO: Record<EstadoDeCor, string> = {
  combina:
    'border-transparent bg-[hsl(var(--estado-combina-bg))] text-[hsl(var(--estado-combina-fg))]',
  atencao:
    'border-transparent bg-[hsl(var(--estado-atencao-bg))] text-[hsl(var(--estado-atencao-fg))]',
  difere:
    'border-transparent bg-[hsl(var(--estado-difere-bg))] text-[hsl(var(--estado-difere-fg))]',
  neutro:
    'border-transparent bg-[hsl(var(--estado-neutro-bg))] text-[hsl(var(--estado-neutro-fg))]'
};

/** Preenchimento de barra, ponto e ícone no tom do estado. */
export const PREENCHIMENTO_DE_ESTADO: Record<EstadoDeCor, string> = {
  combina: 'bg-[hsl(var(--estado-combina))]',
  atencao: 'bg-[hsl(var(--estado-atencao))]',
  difere: 'bg-[hsl(var(--estado-difere))]',
  neutro: 'bg-[hsl(var(--estado-neutro-fg))]'
};

export const TEXTO_DE_ESTADO: Record<EstadoDeCor, string> = {
  combina: 'text-[hsl(var(--estado-combina-fg))]',
  atencao: 'text-[hsl(var(--estado-atencao-fg))]',
  difere: 'text-[hsl(var(--estado-difere-fg))]',
  neutro: 'text-[hsl(var(--estado-neutro-fg))]'
};

/** Os dois lados da leitura: a empresa (azul) e a pessoa (verde-azulado). */
export const LADO = {
  empresa: {
    preenchimento: 'bg-[hsl(var(--data-empresa))]',
    texto: 'text-[hsl(var(--data-empresa))]',
    fundo: 'bg-[hsl(var(--data-empresa-bg))]',
    borda: 'border-[hsl(var(--data-empresa))]'
  },
  pessoa: {
    preenchimento: 'bg-[hsl(var(--data-pessoa))]',
    texto: 'text-[hsl(var(--data-pessoa))]',
    fundo: 'bg-[hsl(var(--data-pessoa-bg))]',
    borda: 'border-[hsl(var(--data-pessoa))]'
  }
} as const;

/** Escala sequencial do lado da pessoa, do claro (1) ao escuro (5). */
export const ESCALA = [
  'bg-[hsl(var(--escala-1))]',
  'bg-[hsl(var(--escala-2))]',
  'bg-[hsl(var(--escala-3))]',
  'bg-[hsl(var(--escala-4))]',
  'bg-[hsl(var(--escala-5))]'
] as const;

/**
 * "Combina com a empresa" → estado de cor do badge: do corte de 35% para
 * cima combina, abaixo é atenção. A intensidade dentro de "combina" fica
 * com a barra (`barraDaAderencia`).
 */
export function corDaAderencia(percentual: number | null): EstadoDeCor {
  if (percentual === null) return 'neutro';
  return percentual >= 35 ? 'combina' : 'atencao';
}

/**
 * Preenchimento da barra de "combina": verde forte acima de 60, verde-azulado
 * entre 35 e 59 (passou do mínimo), laranja abaixo do corte.
 */
export function barraDaAderencia(percentual: number | null): string {
  if (percentual === null) return PREENCHIMENTO_DE_ESTADO.neutro;
  if (percentual >= 60) return PREENCHIMENTO_DE_ESTADO.combina;
  if (percentual >= 35) return LADO.pessoa.preenchimento;
  return PREENCHIMENTO_DE_ESTADO.atencao;
}

/**
 * Variação de KPI → estado. `quedaEBoa` inverte a leitura para indicadores
 * em que cair é o resultado desejado (reabertura, tempo do ciclo).
 */
export function corDaVariacao(
  variacao: number | null,
  quedaEBoa = false
): EstadoDeCor {
  if (variacao === null || variacao === 0) return 'neutro';
  const melhorou = quedaEBoa ? variacao < 0 : variacao > 0;
  return melhorou ? 'combina' : 'difere';
}
