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

/** Um lado da leitura, pelo nome: o `tom` dos cartões e ícones de contexto. */
export type TomDeCor = EstadoDeCor | 'empresa' | 'pessoa';

/**
 * Quadradinho de ícone do cartão: preenchimento cheio no tom, glifo claro.
 *
 * Era fundo claro com o ícone tingido, e uma tela inteira de cartões assim
 * lia como branco sobre branco. Cheio, o quadradinho é o que dá cor à
 * página — e continua sendo cor com significado, porque o tom é o mesmo da
 * leitura do cartão. No laranja o glifo é azul-noite: branco sobre laranja
 * não chega aos 3:1 que a 1.4.11 pede para elemento gráfico.
 */
export const ICONE_TINGIDO: Record<TomDeCor, string> = {
  combina: 'bg-[hsl(var(--estado-combina))] text-white',
  atencao: 'bg-[hsl(var(--estado-atencao))] text-[hsl(var(--foreground))]',
  difere: 'bg-[hsl(var(--estado-difere))] text-white',
  neutro: 'bg-[hsl(var(--estado-neutro-fg))] text-white',
  empresa: 'bg-[hsl(var(--data-empresa))] text-white',
  pessoa: 'bg-[hsl(var(--data-pessoa))] text-white'
};

/** Preenchimento puro no tom (barra, ponto, mini indicador). */
export const PREENCHIMENTO_DO_TOM: Record<TomDeCor, string> = {
  ...PREENCHIMENTO_DE_ESTADO,
  empresa: LADO.empresa.preenchimento,
  pessoa: LADO.pessoa.preenchimento
};

/** Texto no tom da barra de "combina" (mesma faixa de `barraDaAderencia`). */
export function textoDaAderencia(percentual: number | null): string {
  if (percentual === null) return TEXTO_DE_ESTADO.neutro;
  if (percentual >= 60) return TEXTO_DE_ESTADO.combina;
  if (percentual >= 35) return LADO.pessoa.texto;
  return TEXTO_DE_ESTADO.atencao;
}

/**
 * O trilho de um ponto do dia a dia: a trilha, a faixa entre empresa e pessoa
 * (clara, só para ler a distância; a palavra do estado fica ao lado) e a marca
 * do mínimo de 35% no laranja da marca.
 */
export const TRILHO = {
  trilha: 'bg-muted',
  perto: 'bg-[hsl(var(--estado-combina)/0.3)]',
  longe: 'bg-[hsl(var(--estado-difere)/0.28)]',
  minimo: 'bg-[hsl(var(--brand-accent))]'
} as const;

/**
 * Tons de azul da empresa, para quando a empresa fala por mais de uma voz
 * (gestão e equipe), com a média em azul-escuro e a dispersão em azul claro.
 */
export const TONS_DA_EMPRESA = {
  gestao: 'bg-[hsl(var(--data-empresa))]',
  equipe: 'bg-[hsl(var(--data-empresa-claro))]',
  media: 'bg-[hsl(var(--data-empresa-escuro))]',
  mediaTexto: 'text-[hsl(var(--data-empresa-escuro))]',
  dispersao: 'bg-[hsl(var(--data-empresa)/0.18)]',
  bordaGestao: 'border-[hsl(var(--data-empresa))]',
  bordaEquipe: 'border-[hsl(var(--data-empresa-claro))]'
} as const;

/**
 * Item ativo da barra, que é azul-noite: o fundo sobe um tom, o texto vai a
 * branco e o ícone recebe o laranja da marca, com uma lasca laranja na borda
 * esquerda. Para `SidebarMenuButton`, que só marca o ativo com `data-active`.
 */
export const ITEM_ATIVO = [
  // Onde você está, em azul-noite: fundo um tom acima da barra, texto em
  // branco e o ícone no laranja da marca — as duas cores da assinatura.
  'relative data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
  'data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-accent-foreground',
  'data-[active=true]:[&>svg]:text-[hsl(var(--brand-accent))]',
  // A lasca laranja na borda esquerda: a marca do item ativo continua
  // legível para quem não distingue o fundo um tom acima.
  'before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-[hsl(var(--brand-accent))] before:opacity-0 data-[active=true]:before:opacity-100'
].join(' ');

/**
 * Acabamento do selo dos cartões (variação e etiquetas): 24px de altura,
 * canto `rounded-md`, sem borda, ícone de 12px. Some a um `BADGE_DE_ESTADO`.
 */
export const SELO = 'h-6 gap-1 rounded-md border-transparent px-2 font-medium';

/**
 * Tons claros de barra: o que é contexto, não destaque. Num gráfico, só o
 * dado que decide leva a cor forte; o resto usa estes (1 ou 2 cores fortes
 * por card, no máximo).
 */
export const PREENCHIMENTO_CLARO = {
  atencao: 'bg-[hsl(var(--estado-atencao)/0.35)]',
  neutro: 'bg-[hsl(var(--estado-neutro-fg)/0.4)]',
  pessoa: 'bg-[hsl(var(--data-pessoa-claro)/0.6)]',
  empresa: 'bg-[hsl(var(--data-empresa)/0.35)]'
} as const;

/** Mês em curso: verde-azulado claro com borda tracejada ("ainda não fechou"). */
export const PREENCHIMENTO_PARCIAL =
  'bg-[hsl(var(--data-pessoa-claro)/0.45)] border-2 border-b-0 border-dashed border-[hsl(var(--data-pessoa))]';

/** Cor de traço em SVG (linha da média móvel e seus pontos). */
export const TRACO_ATENCAO = 'hsl(var(--estado-atencao))';
