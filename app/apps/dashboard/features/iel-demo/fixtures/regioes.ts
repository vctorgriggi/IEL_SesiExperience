/**
 * Regionais de atendimento no estado de Mato Grosso.
 *
 * O recorte segue a rede de unidades do Sebrae/MT, que divide o estado a
 * partir da sede em Cuiabá e de agências no interior (Alta Floresta, Barra do
 * Garças, Cáceres, Confresa, Juína, Lucas do Rio Verde, Primavera do Leste,
 * Rondonópolis, Sinop e Tangará da Serra). Só entram aqui as regionais que
 * têm cidade na base da demonstração; as demais existem no mundo real e
 * entrariam do mesmo jeito, bastando acrescentar a linha.
 *
 * Por que isso existe: cada regional tem meta própria, e a analista que
 * atende o norte não precisa — nem deve — abrir a carteira de quem atende o
 * sudeste. Recortar por regional é minimização de dado por desenho, no
 * sentido do art. 6º, III da LGPD, e não só um filtro de conveniência.
 *
 * As metas são da demonstração e estão na escala da base simulada, não na do
 * mundo real. A operação do IEL trabalha cerca de 2.500 vagas por mês
 * (reunião de 19/09/2026), mas o histórico desta base é pequeno de propósito
 * — ver o cabeçalho de `outcomes.ts` —, e uma meta de 900 ao lado de um
 * realizado de 4 só produziria uma barra vazia e uma leitura falsa. Cada meta
 * aqui é calibrada contra o que a própria base entrega em 30 dias, para que a
 * barra signifique alguma coisa. Nenhuma tela deve apresentá-las como meta
 * oficial do IEL, e o rótulo em tela diz "demonstração".
 */

export type RegiaoAtendimento = {
  id: string;
  /** Nome curto, como a operação fala. */
  nome: string;
  /** Cidade onde fica a unidade que responde pela regional. */
  sede: string;
  /** Cidades da base que pertencem a esta regional. */
  cidades: string[];
  /** Vagas por mês que a regional se compromete a atender. Demonstração. */
  metaMensal: number;
};

export const REGIOES_MT: RegiaoAtendimento[] = [
  {
    id: 'cuiaba',
    nome: 'Cuiabá',
    sede: 'Cuiabá',
    cidades: [
      'Cuiabá',
      'Várzea Grande',
      'Santo Antônio de Leverger',
      'Nossa Senhora do Livramento'
    ],
    metaMensal: 5
  },
  {
    id: 'rondonopolis',
    nome: 'Rondonópolis',
    sede: 'Rondonópolis',
    cidades: ['Rondonópolis'],
    metaMensal: 3
  },
  {
    id: 'sinop',
    nome: 'Sinop',
    sede: 'Sinop',
    cidades: ['Sinop', 'Sorriso'],
    metaMensal: 4
  },
  {
    id: 'lucas-do-rio-verde',
    nome: 'Lucas do Rio Verde',
    sede: 'Lucas do Rio Verde',
    cidades: ['Lucas do Rio Verde', 'Nova Mutum'],
    metaMensal: 3
  },
  {
    id: 'tangara-da-serra',
    nome: 'Tangará da Serra',
    sede: 'Tangará da Serra',
    cidades: ['Tangará da Serra'],
    metaMensal: 2
  },
  {
    id: 'primavera-do-leste',
    nome: 'Primavera do Leste',
    sede: 'Primavera do Leste',
    cidades: ['Primavera do Leste', 'Campo Verde'],
    metaMensal: 6
  },
  {
    id: 'caceres',
    nome: 'Cáceres',
    sede: 'Cáceres',
    cidades: ['Cáceres'],
    metaMensal: 4
  },
  {
    id: 'barra-do-garcas',
    nome: 'Barra do Garças',
    sede: 'Barra do Garças',
    cidades: ['Barra do Garças'],
    metaMensal: 3
  },
  {
    id: 'alta-floresta',
    nome: 'Alta Floresta',
    sede: 'Alta Floresta',
    cidades: ['Alta Floresta'],
    metaMensal: 2
  }
];

export const REGIAO_PADRAO_ID = 'cuiaba';

/** Índice por id, para leitura barata nas telas. */
const POR_ID = new Map(REGIOES_MT.map((regiao) => [regiao.id, regiao]));

/** Índice cidade → regional, montado uma vez. */
const POR_CIDADE = new Map<string, string>();
for (const regiao of REGIOES_MT) {
  for (const cidade of regiao.cidades) POR_CIDADE.set(cidade, regiao.id);
}

export function getRegiao(regiaoId: string | null): RegiaoAtendimento | null {
  if (!regiaoId) return null;
  return POR_ID.get(regiaoId) ?? null;
}

/**
 * Extrai o nome da cidade de uma localização.
 *
 * As localizações da base vêm em três formatos: `"Cuiabá, MT"`,
 * `"Cuiabá, MT — Distrito Industrial"` e `"Cuiabá, MT (matriz)"`. A cidade é
 * sempre o que vem antes da primeira vírgula.
 */
export function cidadeDaLocalizacao(location: string): string {
  const [cidade] = location.split(',');
  return (cidade ?? '').trim();
}

/** A regional de uma localização, ou `null` quando a cidade está fora do mapa. */
export function regiaoDaLocalizacao(location: string): string | null {
  return POR_CIDADE.get(cidadeDaLocalizacao(location)) ?? null;
}
